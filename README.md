# 🏎️ F1 Racing IBM 🏎️

## The Problem

Formula 1 fans typically engage with the sport by watching races, attending events, or participating in fantasy leagues. However, sports betting provides another opportunity to increase fan engagement by creating a deeper emotional investment in race outcomes. Our platform enhances the fan experience by combining AI-powered betting insights, live race visualization, and real-time telemetry data to build excitement and suspense throughout a race.

## AI Technical Approach 🚦

Our platform uses statistical and AI-driven models to help users make informed betting decisions. Before placing a bet, users can analyze a driver's probability of success, confidence score, risk level, and momentum indicators. Confidence scores are derived from factors such as race position reliability, timing gap reliability, telemetry quality, and prediction stability.

In addition to intelligent betting support, users can view driver positions on a live racetrack along with telemetry indicators that update throughout the race. An AI prediction engine continuously evaluates race conditions and updates the likelihood of a user's bet succeeding as the race progresses.

The prediction framework combines ranking-based machine learning techniques with Monte Carlo simulation to estimate race outcomes. Features considered include driver position, tire compound, recent lap performance, and pace relative to the race leader.

IBM Bob was used throughout development to accelerate coding, debugging, feature implementation, and rapid prototyping across both the frontend and backend systems.

The user experience begins on a Formula 1-themed landing page, followed by a betting dashboard where users can select drivers, choose betting markets, manage wager amounts, and evaluate bets using the AI Analyze Bet feature. Once the race begins, users can transition to the Race Action page, where they can monitor active bets, track vehicles on a live racetrack, view telemetry indicators, and receive continuously updated AI-generated betting insights.

## Why Does This Matter for Racing? 🏆

Formula 1 has traditionally been viewed as a sport with a high barrier to entry. However, its global fanbase extends far beyond those who can regularly attend races or participate in exclusive experiences.

Our platform introduces a new dimension of engagement by allowing fans to actively participate through data-driven betting and real-time race analytics. AI-powered decision support helps users better understand race dynamics while creating a more interactive and educational experience. By combining sports analytics, live visualization, and intelligent betting recommendations, the platform makes Formula 1 more accessible, engaging, and immersive for a broader audience.

## Folder Structure

This workspace is organized as a full-stack application:

* `frontend/` – Next.js application
* `backend/` – FastAPI service
* `data/` – Formula 1 telemetry and lap data
* `docs/` – Project documentation and reference materials

## Running the App

### Backend

```bash
./run-backend.sh
```

Or manually:

```bash
cd backend
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Local URLs

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8001
```

## Technologies Used

* Next.js
* React
* FastAPI
* Python
* JavaScript
* IBM Bob
* GitHub
