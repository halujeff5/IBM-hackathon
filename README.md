# 🏎️ F1 Racing IBM 🏎️

## The Problem

Formula 1 fans typically engage with the sport by watching races, attending events, or participating in fantasy leagues. However, there is an opportunity to further increase fan engagement through interactive betting experiences that create a deeper emotional investment in race outcomes.

Our platform enhances the Formula 1 viewing experience by combining AI-powered betting assistance, live race visualization, and real-time race analytics into a single application. By helping fans make informed betting decisions and follow races in real time, we create a more immersive and engaging experience.

---

## User Experience

The platform allows fans to experience Formula 1 racing through three connected stages:

### 1. Landing Page

Users begin on a Formula 1-themed landing page featuring an interactive race car and a "Start Experience" button.

### 2. Betting Dashboard

Users can:

* Select a betting market
* Choose a driver
* Enter a wager amount
* Analyze the quality of a potential bet using AI
* Place or cancel bets

The platform maintains a virtual betting bank that tracks user funds and active wagers.

### 3. Race Action Center

Once the race begins, users enter the Race Action Center where they can:

* View active bets
* Track cars moving around a live racetrack
* Monitor race telemetry
* Follow AI-generated race insights
* Watch predictions update throughout the race

---

## AI Technical Approach 🚦

Our platform uses statistical and AI-driven decision support to help users make informed betting decisions.

Before placing a bet, users can use the **AI Analyze Bet** feature to evaluate:

* Probability of success
* Confidence score
* Risk level
* Momentum indicator
* Betting recommendation

Confidence scores are generated using factors such as:

* Race position reliability
* Timing gap reliability
* Telemetry quality
* Prediction stability

The AI engine continuously evaluates race conditions and updates the likelihood of a user's bet succeeding as the race progresses.

Users receive not only recommendations, but also explanations describing why a particular prediction was generated. This creates a more transparent and educational experience.

IBM Bob was used extensively throughout development to accelerate coding, debugging, feature implementation, and rapid prototyping across both frontend and backend systems.

---

## Race Visualization & Telemetry 🏁

The Race Action Center provides a live race experience through:

### Live Position Map

* Cars move around a virtual racetrack
* Driver positions update continuously
* Race progress is visualized in real time

### Telemetry Dashboard

Each racer card displays race information such as:

* Speed
* Throttle position
* Brake activity
* Position tracking
* Race status updates

### Active Bets Panel

Users can monitor:

* Current wagers
* Selected drivers
* Betting markets
* Live prediction updates

---

## Why Does This Matter for Racing? 🏆

Formula 1 has traditionally been viewed as a sport with a high barrier to entry. While the sport attracts a global audience, many fans participate primarily as spectators.

Our platform introduces a new layer of engagement by allowing fans to actively participate through AI-assisted betting and real-time race analytics.

Rather than relying solely on intuition, fans can use AI-generated insights to better understand race dynamics, evaluate risks, and follow how race conditions affect their predictions.

This combination of sports analytics, live visualization, and intelligent decision support helps create a more interactive and accessible Formula 1 experience.

---

## Folder Structure

This workspace is organized as a full-stack application:

```text
frontend/   - Next.js application
backend/    - FastAPI service
data/       - Formula 1 telemetry and lap data
docs/       - Project documentation
```

---

## Technology Stack

### Frontend

* Next.js
* React
* JavaScript
* CSS

### Backend

* FastAPI
* Python

### Development Tools

* IBM SkillsBuild
* IBM Bob
* Git
* GitHub

---

## Running the Application

### Backend

```bash
./run-backend.sh
```

Or manually:

```bash
cd backend

.venv/bin/python -m pip install -r requirements.txt

.venv/bin/python -m uvicorn main:app \
    --host 127.0.0.1 \
    --port 8001
```

Backend URL:

```text
http://localhost:8001
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

---

## Application Flow

1. Launch the application.
2. Enter through the landing page.
3. Navigate to the betting dashboard.
4. Select a betting market.
5. Choose a driver.
6. Enter a wager amount.
7. Run AI Analyze Bet.
8. Review AI recommendations.
9. Place a bet.
10. Proceed to the Race Action Center.
11. Monitor active bets, race telemetry, and live race progress.

---

## Future Enhancements

* Advanced machine learning prediction models
* Historical race performance analysis
* Driver trend forecasting
* Real-time Formula 1 data integration
* Personalized betting recommendations
* Expanded race simulation capabilities
* Additional telemetry metrics

---

## License

This project was developed for educational and hackathon purposes.
