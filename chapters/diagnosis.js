/* ============================================================
   DIAGNOSIS.JS
   Sudharsan's personalised strategic diagnosis
   Loads at /diagnosis
   Reads all takeaways from localStorage
   Calls /api/diagnosis on the server
   Displays personalised diagnosis screen by screen
   ============================================================ */

export default {
  chapterNum:   null,
  chapterTitle: 'Your Strategic Diagnosis',
  partName:     '',
  barTitle:     'Your Strategic Diagnosis',

  screens: [

    // SCREEN 0 — Loading / Processing
    {
      type: 'diagnosis-loading'
    },

    // SCREEN 1 — The Diagnosis
    {
      type: 'diagnosis-result'
    },

    // SCREEN 2 — Working with the Author
    {
      type:    'working-with-author',
      heading: 'Working with the Author',
      body: `
        <p><strong>Sudharsan K R</strong><br>Business Model &amp; Strategy Advisor<br>Manufacturing MSMEs — ₹10 Cr to ₹50 Cr</p>
        <p>This book is a distillation of what I have observed across manufacturing businesses navigating the ₹10 to ₹50 Crore growth band. The frameworks here — the Strategic Choice Cascade, the WWHTBT logic test, the Thin-Slicing methodology — are not academic constructs. They are the diagnostic tools I use in direct engagement with founders, boards, and leadership teams facing high-stakes decisions about where to compete and how to invest.</p>
        <p>If the thinking in this book has surfaced a question your leadership team has not yet been able to answer clearly — about strategic position, capital allocation, or the structural constraints limiting your next phase of growth — that question is where the advisory work begins.</p>
        <div style="margin:28px 0;padding:20px 24px;background:var(--bg);border-radius:8px;border-left:3px solid var(--ink);">
          <div style="font:600 0.75rem/1 'Inter',sans-serif;color:var(--ink-3);margin-bottom:12px;letter-spacing:0.5px;text-transform:uppercase;">What the Advisory Engagement Is</div>
          <p style="font:400 0.9375rem/1.7 'Inter',sans-serif;color:var(--ink-2);margin:0;">I work directly alongside promoters, managing directors, and boards of engineering-led manufacturing businesses. The engagement is not a consulting report delivered at the end of a process — it is active involvement in the real decisions the business is navigating. The starting point is a single diagnostic conversation to identify the primary structural constraint limiting the business's ability to scale.</p>
        </div>
        <p>Five diagnostic conversations are available each week. Active advisory engagements are limited each quarter by the nature of the work.</p>
        <p style="margin-top:8px;"><strong>sudharsan@sudharsankr.co.in</strong><br>sudharsankr.co.in</p>
        <p style="font:400 0.9375rem/1.6 'Inter',sans-serif;color:var(--ink-3);font-style:italic;margin-top:24px;">"The factory is already built. The question is whether the strategy running it is strong enough for what comes next."</p>`
    }

  ]
};
