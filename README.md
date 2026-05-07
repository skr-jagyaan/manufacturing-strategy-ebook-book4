# Stop Planning, Start Winning — Book Two Reader

The Manufacturing Strategy Series · Book Two

## What This Is

A standalone SPA ebook reader for Book Two of The Manufacturing Strategy Series by Sudharsan K R. Deployed on GCP Cloud Run. Authentication is handled by the shelf service — this app is a pure reading experience.

## Architecture

```
manufacturing-shelf (Cloud Run)   — login, session, token handoff
       ↓ ?token=xxx&email=yyy
manufacturing-book2 (Cloud Run)   — this app
       ↓
Firebase Firestore (vcf-01)       — session validation only
Gemini API                        — Arjun agent + Sudharsan diagnosis
```

## File Structure

```
server.js              — Express backend (validate-token, Arjun agent, diagnosis)
package.json
Dockerfile
public/
  index.html           — SPA shell (copy from Book 1 — identical)
  app.js               — SPA brain (Book Two version)
  style.css            — Design system (copy from Book 1 — identical)
chapters/
  ch1.js – ch9.js      — Chapter content modules
  backmatter.js        — Conclusion, workbook, diagnosis teaser, Arjun closing
  diagnosis.js         — Diagnosis result screens
onboarding/
  onboarding.js        — Cover through Arjun intro
assets/
  workbook.pdf         — Book Two diagnostic workbook (add before deploy)
```

## AI Companion

**Arjun Mehta** — Electronics contract manufacturing, Chennai. ₹44 Crore now. Was at ₹28 Crore running generic PCB assembly. Pivoted to medical device PCB assembly with full end-of-line functional testing. Fired 11 customers. Survived a 9-month revenue dip. Now at 22% EBITDA margins.

## Deploy

See `DEPLOY.sh` for the full GCP Cloud Run deploy command.

**Before first deploy:**
1. Copy `public/index.html` and `public/style.css` from `manufacturing-strategy-ebook-book1`
2. Add `assets/workbook.pdf`
3. Create Artifact Registry repo: `manufacturing-book2`

**After first deploy:**
1. Note the Cloud Run URL
2. Update `RAILWAY_URL` in `public/app.js` → redeploy
3. Update shelf `server.js` → add Book 2 to `bookUrls` map → redeploy shelf
4. Update shelf `public/app.js` → activate Book 2 card → redeploy shelf

## GCP Project

- **Project ID:** `vcf-01`
- **Region:** `asia-south1`
- **Artifact Registry:** `asia-south1-docker.pkg.dev/vcf-01/manufacturing-book2/app:latest`
- **Firestore:** same `buyers` collection as shelf and Book 1
