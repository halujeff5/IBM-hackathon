# 🏎️ F1 Racing IBM 🏎️

## The Problem
F1 Racing Fans can enjoy the sport by watching on a screen, attending the racetrack, or participating in fantasy leagues. However, fan engagement via sports betting can be explored to enhance fan engagement and connect the fan through actual emotional investment, building excitement and suspense with our platform.

## AI Technical Approach 🚦
Through the use of statistical models in our intelligent betting, users can get win probability %, confidence % (data quality, race position reliability, timing gap reliability, etc.), risk level, and momentum. In addition to intelligent betting, users can witness the F1 driver's position in the racetrack along with their F1 car's telemetry data that is updated in real-time via each racer card in the race panel. Another AI prediction model calculates race telemetry data to guess the likelihood of your bet succeeding  during the race. This prediction model uses an XGBRanker Model followed by 10_000 Monet Carlo simulations to arrive at the prediction. The features in the XGBRanker model include car position, tire compound, the average lap time of the last 3 laps, and the pace delta or time behind leader. We utilized IBM Bob to code alot of our features in the backend and frontend. 

The frontend begins with a landing page followed by a betting page which has a bank to keep track of bettor funds. The list of drivers of the race is listed in a dropdown and the money wager entry is below it. The bettor uses the AI Analyze Bet button to view the bet's quality, confidence interval, etc. Finally when the race begins, the fan sees the race live in an arcade track and sees their favorite F1 racer speed along the track followed by their racer's race card that streams the driver's telemetry data. Another AI model updates the bet's likelihood of succeeding in real-time.

## Why does this matter for racing? 🏆
The sport of F1 racing is currently skewed toward the affluent. There is a much larger fanbase than that. Commoners want to enjoy the sport in other ways outside of spectating. Our platform allows the fan to cheer and engage in a whole new dimension via betting and builds suspense through AI prediction of their likelihood of winning their bet. Moreover, the addition of a betting AI tool guiding fan bet making pre-race makes the experience quite fun and engaging. The fan learns about the F1 racer's capabilities against their own intuition about racing. This added dimension helps popularize the sport and delivers it to the general public.  

This workspace is organized as a small full-stack project:

- `frontend/` - Next.js app
- `backend/` - FastAPI service
- `data/` - local Formula 1 telemetry and lap data
- `docs/` - project reference documentation

## Backend

```bash
./run-backend.sh
```

Or manually:

```bash
cd backend
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```
