# StudyMate AI — Production Deployment Guide

This guide details deployment options for **StudyMate AI** across Vercel, Cloud Run, Docker containers, and standard Node.js servers.

---

## 1. Environment Variable Setup

The following environment variables must be declared in your production environment:

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Secret Key | **Yes** (or runs in graceful Demo mode) | `AIzaSy...` |
| `NODE_ENV` | Environment identifier | No | `production` |
| `PORT` | Server listening port | No (Defaults to `3000`) | `3000` |

---

## 2. Deploying to Vercel (Why was it not working before?)

### Reason:
1. **Serverless API Function**: Vercel by default only deploys the static Vite frontend (`dist/`). Express servers do not run automatically unless configured as a Serverless Function (`api/index.ts` with `vercel.json`).
2. **Missing Environment Variable**: In AI Studio, `GEMINI_API_KEY` is provided automatically, but on Vercel, you must manually add `GEMINI_API_KEY` in your Vercel Project Settings.

### Step-by-Step Vercel Deployment:
1. Push your updated code to your GitHub repository.
2. In [Vercel Dashboard](https://vercel.com/dashboard):
   - Click on your **StudyMate Project** &rarr; **Settings** &rarr; **Environment Variables**.
   - Add **`GEMINI_API_KEY`**:
     - Key: `GEMINI_API_KEY`
     - Value: `Your Google Gemini API Key` (Get one free at https://aistudio.google.com/app/apikey)
     - Select Environments: **Production**, **Preview**, **Development**
     - Click **Save**.
3. Go to **Deployments** tab &rarr; Click **Redeploy** on your latest deployment.
4. Now all AI features (Study Planner, Topic Explainer, Quiz Generator, Adaptive Rescheduler) will work live on Vercel!

---

## 3. Deploying to Google Cloud Run / Docker

### Cloud Run Deployment Command
```bash
gcloud run deploy studymate-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_api_key_here",NODE_ENV="production"
```

---

## 4. Health Check & Diagnostics

The production server includes a diagnostic health endpoint:
```
GET /api/health
GET /api/status
```
**Response:**
```json
{
  "status": "ready",
  "provider": "Google Gemini",
  "model": "gemini-3.7-flash",
  "isConfigured": true
}
```
