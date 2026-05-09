// diagnosis.js — Book 4: Decoding the Rs. 100 Cr Breakthrough
// Both screens are fully renderer-driven — no fields are read from screen data.
// The ONLY thing that matters is the correct screen type strings.
// Required app.js patches before deployment:
//   1. "Across all ten chapters" → "Across all sixteen chapters"  (line ~646)
//   2. diag-next-btn onclick="go(...)" → onclick="loadBackmatter(7)"
//      (screen 7 = working-with-author in backmatter, 0-indexed)

export default {
  chapterNum:   null,
  chapterTitle: 'Your Strategic Diagnosis',
  partName:     '',
  barTitle:     'Your Strategic Diagnosis',

  screens: [
    {
      type:    'diagnosis-loading',
    },
    {
      type:    'diagnosis-result',
    },
  ],
}
