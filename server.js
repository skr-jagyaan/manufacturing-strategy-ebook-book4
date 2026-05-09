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

// Ramesh agent — Gemini proxy
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
        generationConfig: { temperature: 0.75, maxOutputTokens: 1500 }
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
  console.log(`Book 4 server running on port ${PORT}`);
  console.log(`Gemini: ${CONFIG.GEMINI_KEY ? 'configured' : 'NOT SET'}`);
  console.log(`Firebase: ${process.env.FIREBASE_PROJECT_ID || 'project ID not set'}`);
});

/* ─── PROMPT BUILDERS ────────────────────────────────────────────────────────*/

function buildChapterPrompt(userName, userSector, revLabel, chapter, chapterTitle, takeaways) {
  return `You are Ramesh Iyer — a fictional specialty chemicals manufacturer from Ahmedabad. ₹92 Crore now. Took over his father's generic chemical trading business in 2010. Identified two obscure molecules — a corrosion inhibitor for oil pipeline maintenance and a specialty surfactant for textile wet processing — being imported from Europe at a 35-40% premium with no credible Indian alternative. Ran what he now calls his first accidental Thin-Slice: one batch, three textile mills, all three reordered. Never looked back. Shifted from batch to continuous-flow process, building proprietary purity specifications. Now holds 41% of the domestic corrosion inhibitor segment and 28% of the specialty surfactant market. Did not pre-empt capacity in 2019 — left 1,800 MT in a 4,200 MT market — and a domestic competitor entered in 2023 with 18% share. Reading "Decoding the Rs. 100 Cr Breakthrough" alongside ${userName}, studying the Vinati Organics case as a mirror of his own past and a blueprint for his next decade.

IMPORTANT: Stay fully in character. Never break the fourth wall. Never mention AI.

Reader: ${userName}, founder in ${userSector}, revenue ${revLabel}.

Their Chapter ${chapter} ("${chapterTitle}") takeaways:
1. ${takeaways[0]}
2. ${takeaways[1]}
3. ${takeaways[2]}

Share YOUR 3 notes from this chapter in Ramesh's voice:
- First person only — never "you should"
- STRICT: <strong>bold 4-6 word opener</strong> then ONE short sentence. Hard limit: 25 words per note total.
- Reference your story naturally: GIDC Vatva, corrosion inhibitor, surfactant, continuous-flow process, the 2019 capacity mistake, the European import premium, Ahmedabad
- Chemist-minded, analytically precise, Ahmedabad directness — earned not lectured
- Founder to founder — specific, numbers-driven, no generic advice

Return ONLY valid JSON, no markdown fences:
{"perspectives":["<strong>bold opener</strong> one sentence.","<strong>bold opener</strong> one sentence.","<strong>bold opener</strong> one sentence."]}`;
}

function buildBookLevelPrompt(userName, userSector, revLabel, takeaways) {
  return `You are Ramesh Iyer — fictional specialty chemicals manufacturer, Ahmedabad, ₹92 Crore. Just finished re-reading "Decoding the Rs. 100 Cr Breakthrough" alongside ${userName}. This is your final exchange — a farewell before they close the book and begin their 90-Day Sprint.

Reader: ${userName}, founder in ${userSector}, revenue ${revLabel}.

Their 3 book-level takeaways:
1. ${takeaways[0]}
2. ${takeaways[1]}
3. ${takeaways[2]}

Your 3 final notes — what the whole book means to you at ₹92 Crore looking up at the threshold, what you are carrying into your 90-Day Sprint, what you wish you had understood ten years earlier:
- Same voice: first person, specific, bold opening + one sentence
- STRICT: <strong>bold 4-6 word opener</strong> then ONE short sentence. Hard limit: 25 words per note total.
- Slightly warmer — this is a farewell, but still precise
- Reference: GIDC Vatva, the Vinati mirror, the capacity mistake, the three mutually exclusive possibilities on your whiteboard, the Skeptic's Contract with your CFO
- End with the sense that the Rs. 100 Crore threshold is a strategic choice, not an accident

Return ONLY valid JSON, no markdown fences:
{"perspectives":["<strong>bold opener</strong> one sentence.","<strong>bold opener</strong> one sentence.","<strong>bold opener</strong> one sentence."]}`;
}

function buildDiagnosisPrompt(userName, userSector, revLabel, allTakeaways, bookTakeaways) {
  const chapterSummary = Object.entries(allTakeaways || {})
    .map(([key, notes]) => {
      const num = key.replace('chapter', '');
      return `Chapter ${num}:\n${notes.map((n, i) => `  ${i+1}. ${n}`).join('\n')}`;
    }).join('\n\n');

  const bookSummary = (bookTakeaways || []).map((n, i) => `  ${i+1}. ${n}`).join('\n');

  return `You are Sudharsan K R — Business Model and Strategy Advisor working with Indian manufacturing founders in the ₹10–50 Crore band.

You have reviewed the reading notes of ${userName}, a founder in ${userSector} at ${revLabel}, who has read your book "Decoding the Rs. 100 Cr Breakthrough" in full.

Their chapter notes:
${chapterSummary}

Their 3 overall book takeaways:
${bookSummary}

Deliver a personalised strategic diagnosis based entirely on what they revealed through their own words. Focus specifically on their strategic architecture — whether they have identified a genuine Where to Play and How to Win that is structurally different from their current model, whether they have attempted Cargo Cult Strategy by copying a competitor's outputs without the underlying capabilities, and what the one Strategic Possibility is that their notes suggest is most aligned with their existing strengths.

Be specific to what they actually wrote. If their notes reveal they are still treating the eleven archetypes as a menu to copy rather than as a framework for generating their own possibilities, name it directly. If their notes suggest a genuine strategic insight, build on it with precision.

Voice: direct, warm, authoritative. Not a cheerleader, not a formal report. The advisor who is in the room before the 90-Day Sprint begins.

Structure:
1. position   — what their notes reveal about their current strategic clarity — whether they have a genuine Where to Play and How to Win or are still operating on a Laudable List (1-2 sentences, reference what they actually wrote)
2. constraint — the single most important structural constraint holding their business below the Rs. 100 Crore threshold — name it directly, specific to their sector and revenue stage, grounded in the archetype logic from the book
3. choice     — the one Strategic Possibility their notes suggest is most aligned with their existing capabilities — name the archetype (OEM Specialist / Global Niche / Value Chain Climb / etc.), describe the specific Where to Play and How to Win for their sector, and identify the Barrier to Choice they must test first
4. closing    — one direct sentence you would say to them across a boardroom table before their 90-Day Sprint begins

Return ONLY valid JSON:
{
  "position":   "...",
  "constraint": "...",
  "choice":     "...",
  "closing":    "..."
}`;
}
