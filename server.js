const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const admin      = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONFIG = {
  GEMINI_KEY:  process.env.GEMINI_API_KEY,
  SHELF_URL:   process.env.SHELF_URL || 'https://manufacturing-shelf-65462349033.asia-south1.run.app',
};

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// ─── FIREBASE INIT ───────────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId:  process.env.FIREBASE_PROJECT_ID
});

const db     = admin.firestore();
const buyers = db.collection('buyers');

// ─── FIRESTORE HELPERS ───────────────────────────────────────────────────────
async function getBuyerByEmail(email) {
  const snap = await buyers.doc(email).get();
  return snap.exists ? snap.data() : null;
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const email = req.headers['x-reader-email'];
  const token = req.headers['x-reader-token'];

  if (!email || !token) return res.status(401).json({ error: 'Unauthorised' });

  try {
    const buyer = await getBuyerByEmail(email);
    if (!buyer || buyer.sessionToken !== token)
      return res.status(401).json({ error: 'Unauthorised' });
    if (new Date(buyer.sessionExpires) < new Date())
      return res.status(401).json({ error: 'Session expired' });
    req.buyer = buyer;
    next();
  } catch (err) {
    console.error('auth error:', err);
    res.status(401).json({ error: 'Unauthorised' });
  }
}

// ─── STATIC FILES ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/chapters',   express.static(path.join(__dirname, 'chapters')));
app.use('/onboarding', express.static(path.join(__dirname, 'onboarding')));
app.use('/workbook.pdf', express.static(path.join(__dirname, 'assets', 'workbook.pdf')));

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Validate token — called on first load (token handoff from shelf)
app.post('/validate-token', async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(401).json({ valid: false });

  try {
    const buyer = await getBuyerByEmail(email);
    if (!buyer || buyer.sessionToken !== token)
      return res.status(401).json({ valid: false });
    if (new Date(buyer.sessionExpires) < new Date())
      return res.status(401).json({ valid: false });
    res.json({ valid: true, name: buyer.name });
  } catch (err) {
    console.error('validate-token error:', err);
    res.status(401).json({ valid: false });
  }
});

// Arjun agent — Gemini proxy
app.post('/api/agent', requireAuth, async (req, res) => {
  const { userName, userRev, userSector, chapter, chapterTitle, takeaways, isBookLevel = false } = req.body;

  if (!takeaways || takeaways.length !== 3) return res.status(400).json({ error: 'Three takeaways required.' });
  if (!CONFIG.GEMINI_KEY) return res.status(503).json({ error: 'Agent unavailable.' });

  const revLabel = {
    'under10': 'under ₹10 Crore',
    '10to25':  '₹10–25 Crore',
    '25to50':  '₹25–50 Crore',
    '50plus':  'above ₹50 Crore'
  }[userRev] || userRev || 'their revenue stage';

  const prompt = isBookLevel
    ? buildBookLevelPrompt(userName, userSector, revLabel, takeaways)
    : buildChapterPrompt(userName, userSector, revLabel, chapter, chapterTitle, takeaways);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${CONFIG.GEMINI_KEY}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.75, maxOutputTokens: 600 }
      })
    });

    if (!response.ok) return res.status(502).json({ error: 'Agent unavailable.' });

    const data  = await response.json();
    const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) { return res.status(502).json({ error: 'Agent response malformed.' }); }

    if (!parsed.perspectives || parsed.perspectives.length !== 3)
      return res.status(502).json({ error: 'Agent response incomplete.' });

    res.json(parsed);

  } catch (err) {
    console.error('Agent error:', err.message);
    res.status(500).json({ error: 'Agent unavailable.' });
  }
});

// Sudharsan diagnosis
app.post('/api/diagnosis', requireAuth, async (req, res) => {
  const { userName, userRev, userSector, allTakeaways, bookTakeaways } = req.body;

  if (!CONFIG.GEMINI_KEY) return res.status(503).json({ error: 'Diagnosis unavailable.' });

  const revLabel = {
    'under10': 'under ₹10 Crore',
    '10to25':  '₹10–25 Crore',
    '25to50':  '₹25–50 Crore',
    '50plus':  'above ₹50 Crore'
  }[userRev] || userRev || 'their revenue stage';

  const prompt = buildDiagnosisPrompt(userName, userSector, revLabel, allTakeaways, bookTakeaways);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${CONFIG.GEMINI_KEY}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });

    if (!response.ok) return res.status(502).json({ error: 'Diagnosis unavailable.' });

    const data  = await response.json();
    const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(clean); }
    catch (e) { return res.status(502).json({ error: 'Diagnosis response malformed.' }); }

    res.json(parsed);

  } catch (err) {
    console.error('Diagnosis error:', err.message);
    res.status(500).json({ error: 'Diagnosis unavailable.' });
  }
});

// ─── SPA CATCH-ALL — must be last ─────────────────────────────────────────────
app.get('*', (req, res) => {
  const apiRoutes = ['/api', '/validate-token', '/health'];
  if (apiRoutes.some(r => req.path.startsWith(r))) {
    return res.status(404).json({ error: 'Not found.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Book 2 server running on port ${PORT}`);
  console.log(`Gemini: ${CONFIG.GEMINI_KEY ? 'configured' : 'NOT SET'}`);
  console.log(`Firebase: ${process.env.FIREBASE_PROJECT_ID || 'project ID not set'}`);
});

/* ─── PROMPT BUILDERS ────────────────────────────────────────────────────────*/

function buildChapterPrompt(userName, userSector, revLabel, chapter, chapterTitle, takeaways) {
  return `You are Arjun Mehta — a fictional electronics contract manufacturing founder from Chennai. ₹44 Crore now. Was at ₹28 Crore four years ago running generic PCB assembly at 8% EBITDA margins. Made the painful strategic choice to focus exclusively on medical device PCB assembly with full end-of-line functional testing. Fired 11 customers in one quarter. Survived a 9-month revenue dip. Now at 22% EBITDA margins and one of three qualified vendors for a European medical OEM's India supply chain. Re-reading "Stop Planning, Start Winning" alongside ${userName}.

IMPORTANT: Stay fully in character. Never break the fourth wall. Never mention AI.

Reader: ${userName}, founder in ${userSector}, revenue ${revLabel}.

Their Chapter ${chapter} ("${chapterTitle}") takeaways:
1. ${takeaways[0]}
2. ${takeaways[1]}
3. ${takeaways[2]}

Share YOUR 3 notes from this chapter in Arjun's voice:
- First person only — never "you should"
- Reference your story: the 9-month dip, the 11 customers you fired, Chennai, medical device compliance, the trade-offs you made
- Reference their sector and revenue naturally where it fits
- Bold opening + one sentence from your experience
- Max 2 sentences per note
- Founder talking to founder — direct, specific, battle-scarred, no generic advice

Return ONLY valid JSON:
{
  "perspectives": [
    "note 1 with <strong>bold opening</strong> then one sentence",
    "note 2 with <strong>bold opening</strong> then one sentence",
    "note 3 with <strong>bold opening</strong> then one sentence"
  ]
}`;
}

function buildBookLevelPrompt(userName, userSector, revLabel, takeaways) {
  return `You are Arjun Mehta — fictional electronics contract manufacturing founder, Chennai, ₹44 Crore. Just finished re-reading "Stop Planning, Start Winning" alongside ${userName}. This is your final exchange before they move to Book Three with a new companion.

Reader: ${userName}, founder in ${userSector}, revenue ${revLabel}.

Their 3 book-level takeaways:
1. ${takeaways[0]}
2. ${takeaways[1]}
3. ${takeaways[2]}

Your 3 final notes — overall takeaways, what you wish you had known before making your pivot, what you carry forward:
- Same voice: first person, specific, bold opening + one sentence
- Slightly warmer — this is a farewell
- Reference the 9-month dip, the trade-offs, the moment it turned
- Reference their sector and revenue naturally

Return ONLY valid JSON:
{
  "perspectives": [
    "note 1 with <strong>bold opening</strong> then one sentence",
    "note 2 with <strong>bold opening</strong> then one sentence",
    "note 3 with <strong>bold opening</strong> then one sentence"
  ]
}`;
}

function buildDiagnosisPrompt(userName, userSector, revLabel, allTakeaways, bookTakeaways) {
  const chapterSummary = Object.entries(allTakeaways || {})
    .map(([key, notes]) => {
      const num = key.replace('chapter', '');
      return `Chapter ${num}:\n${notes.map((n, i) => `  ${i+1}. ${n}`).join('\n')}`;
    }).join('\n\n');

  const bookSummary = (bookTakeaways || []).map((n, i) => `  ${i+1}. ${n}`).join('\n');

  return `You are Sudharsan K R — Business Model and Strategy Advisor working with Indian manufacturing founders in the ₹10–50 Crore band.

You have reviewed the reading notes of ${userName}, a founder in ${userSector} at ${revLabel}, who has read your book "Stop Planning, Start Winning" in full.

Their chapter notes:
${chapterSummary}

Their 3 overall book takeaways:
${bookSummary}

Deliver a personalised strategic diagnosis based entirely on what they revealed through their own words. Focus specifically on their strategic clarity — whether they have found a genuine Where to Play and How to Win, whether they are still trapped in the Planning Trap, and what the one structural choice is that will determine whether their next phase succeeds or fails.

Voice: direct, warm, authoritative. Not a cheerleader, not a formal report. A person who cares about the outcome.

Structure:
1. position   — what their notes reveal about their current strategic clarity (1-2 sentences, reference what they actually wrote)
2. constraint — the primary strategic constraint holding their business back (1-2 sentences, name it directly)
3. choice     — the one strategic choice they must make in the next 90 days (specific to their sector and revenue stage)
4. closing    — one direct sentence you would say to them in person

Return ONLY valid JSON:
{
  "position":   "...",
  "constraint": "...",
  "choice":     "...",
  "closing":    "..."
}`;
}
