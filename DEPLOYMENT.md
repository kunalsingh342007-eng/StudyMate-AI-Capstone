# StudyMate AI — Production Deployment Guide

This guide details deployment options for **StudyMate AI** across Vercel, Cloud Run, Docker containers, and standard Node.js servers.

---

## 1. Environment Variable Setup

The following environment variables must be declared in your production environment:

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | Anthropic Claude Secret Key | **Yes** (or runs in graceful Demo mode) | `sk-ant-api03-...` |
| `ANTHROPIC_MODEL` | Target Claude Model Alias | No (Defaults to `claude-3-5-sonnet-20241022`) | `claude-3-5-sonnet-20241022` |
| `NODE_ENV` | Environment identifier | No | `production` |
| `PORT` | Server listening port | No (Defaults to `3000`) | `3000` |

---

## 2. Deploying to Vercel

### Option A: Standard Full-Stack Vercel Deployment
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. In **Project Settings &rarr; Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = `your_key_here`
   - `ANTHROPIC_MODEL` = `claude-3-5-sonnet-20241022`
5. Click **Deploy**.

---

## 3. Deploying to Google Cloud Run / Docker

### Production Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

### Cloud Run Deployment Command
```bash
gcloud run deploy studymate-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY="your_api_key_here",NODE_ENV="production"
```

---

## 4. Health Check & Diagnostics

The production server includes a diagnostic health endpoint:
```
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "provider": "Anthropic Claude",
  "model": "claude-3-5-sonnet-20241022",
  "isConfigured": true
}
```

---

## 5. Security & Rate Limiting Guidelines

1. **Keep Secrets Private**: Ensure `.env` is listed in `.gitignore` and never committed.
2. **Timeout Safeguards**: All Claude API requests are governed by a 25-second server-side timeout to avoid stalled client connections.
3. **CORS Isolation**: For stand-alone API servers, ensure only authorized frontends are permitted.
