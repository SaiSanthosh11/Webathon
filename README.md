# CINTEL — Film Intelligence Platform

An AI-powered film producer intelligence platform for Indian cinema.

## Stack
- **Frontend**: Vite + React (port 5173)
- **Backend**: FastAPI + Python (port 3001)
- **AI**: Anthropic Claude (proxied securely via backend)

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload --port 3001
```

### 2. Frontend (new terminal)
```bash
cd client
npm install
npm run dev
```

### 3. Open the app
Visit: http://localhost:5173

## Features
- **Overview** — Key metrics dashboard with AI brief generator
- **Audience DNA** — Psychographic profiling & behavioral triggers
- **Campaign ROI** — Budget allocation simulator
- **Distribution** — OTT platform match scores & deal simulation
- **Festival Radar** — AI-matched film festival submissions
- **Release Timing** — Calendar, competition analysis & historical data
- **Film Comps** — Comparable film finder with ROI analysis
- **AI Advisor** — Interactive Claude-powered strategy chat
