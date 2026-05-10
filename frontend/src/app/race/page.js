"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8001";
const INITIAL_BANK = 500;
const RACE_COUNTDOWN_SECONDS = 3 * 60 * 60;
const BETTING_MARKETS = [
  "Race Winner",
  "Top 3 Finish",
  "Top 5 Finish",
  "1st Place +5 Sec",
  "2nd Place",
  "3rd Place",
  "",
  "1st Place +2 Sec",
];

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours,
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

export default function RacePage() {
  const [drivers, setDrivers] = useState([]);
  const [bank, setBank] = useState(INITIAL_BANK);
  const [countdown, setCountdown] = useState(RACE_COUNTDOWN_SECONDS);
  const [wagers, setWagers] = useState(() => Array(BETTING_MARKETS.length).fill(""));
  const [overUnderDriver, setOverUnderDriver] = useState("");
  const [overUnderSide, setOverUnderSide] = useState("");
  const [overUnderWager, setOverUnderWager] = useState("");

  function updateWager(index, step) {
    setWagers((currentWagers) =>
      currentWagers.map((wager, wagerIndex) => {
        if (wagerIndex !== index) {
          return wager;
        }

        const currentValue = Number(wager) || 0;
        return String(Math.max(0, currentValue + step));
      }),
    );
  }

  function placeBet(index) {
    const wagerAmount = Number(wagers[index]) || 0;
    if (wagerAmount <= 0) {
      return;
    }

    setBank((currentBank) => Math.max(0, currentBank - wagerAmount));
  }

  function cancelBet(index) {
    const wagerAmount = Number(wagers[index]) || 0;
    if (wagerAmount <= 0) {
      return;
    }

    setBank((currentBank) => Math.min(INITIAL_BANK, currentBank + wagerAmount));
  }

  function updateOverUnderWager(step) {
    setOverUnderWager((current) => {
      const currentValue = Number(current) || 0;
      return String(Math.max(0, currentValue + step));
    });
  }

  function placeOverUnderBet() {
    const wagerAmount = Number(overUnderWager) || 0;
    if (wagerAmount <= 0) {
      return;
    }

    setBank((currentBank) => Math.max(0, currentBank - wagerAmount));
  }

  function cancelOverUnderBet() {
    const wagerAmount = Number(overUnderWager) || 0;
    if (wagerAmount <= 0) {
      return;
    }

    setBank((currentBank) => Math.min(INITIAL_BANK, currentBank + wagerAmount));
  }

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((response) => response.json())
      .then((data) => setDrivers(data.drivers ?? []))
      .catch(() => setDrivers([]));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((currentCountdown) => Math.max(0, currentCountdown - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="race-page">
      <h1 className="race-page-title">F1 Racing Sports Betting</h1>
      <section className="countdown-card race-card">
        <span>Miami Grand Prix starts in</span>
        <strong>{formatCountdown(countdown)}</strong>
      </section>
      <section className="bank-card race-card">
        <span>BANK</span>
        <strong>${bank}</strong>
      </section>
      <section className="race-card-grid">
        {BETTING_MARKETS.map((market, index) => (
          <div className="race-card" key={`${market}-${index}`}>
            {market && <span>{market}</span>}
            <select className="driver-select" defaultValue="">
              <option value="" disabled>
                Select Driver
              </option>
              {drivers.map((driver) => (
                <option key={driver} value={driver}>
                  {driver}
                </option>
              ))}
            </select>
            <div className="wager-field">
              <div className="wager-control" aria-label={`${market || "Bet"} wager`}>
                <button type="button" onClick={() => updateWager(index, -1)}>
                  -
                </button>
                <input
                  id={`wager-${index}`}
                  aria-label={`${market || "Bet"} wager amount`}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={wagers[index]}
                  onChange={(event) =>
                    setWagers((currentWagers) =>
                      currentWagers.map((wager, wagerIndex) => {
                        if (wagerIndex !== index) {
                          return wager;
                        }

                        const value = event.target.value;
                        return value === "" ? "" : String(Math.max(0, Number(value)));
                      }),
                    )
                  }
                />
                <button type="button" onClick={() => updateWager(index, 1)}>
                  +
                </button>
              </div>
              <div className="wager-actions">
                <button
                  className="bet-button"
                  type="button"
                  onClick={() => placeBet(index)}
                >
                  BET
                </button>
                <button
                  className="cancel-button"
                  type="button"
                  onClick={() => cancelBet(index)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="over-under-grid-cell">
          <div className="race-card-section over-under-heading">OVER / UNDER</div>
          <div className="race-card over-under-card">
            <span>FIRST LAP 90 SEC</span>
            <select
              className="driver-select"
              aria-label="First lap 90 sec driver"
              value={overUnderDriver}
              onChange={(event) => setOverUnderDriver(event.target.value)}
            >
              <option value="" disabled>
                Select Driver
              </option>
              {drivers.map((driver) => (
                <option key={driver} value={driver}>
                  {driver}
                </option>
              ))}
            </select>
            <select
              className="driver-select"
              aria-label="Over or under"
              value={overUnderSide}
              onChange={(event) => setOverUnderSide(event.target.value)}
            >
              <option value="" disabled>
                Over / Under
              </option>
              <option value="OVER">OVER</option>
              <option value="UNDER">UNDER</option>
            </select>
            <div className="wager-field">
              <div className="wager-control" aria-label="First lap 90 sec wager">
                <button type="button" onClick={() => updateOverUnderWager(-1)}>
                  -
                </button>
                <input
                  id="wager-over-under"
                  aria-label="First lap 90 sec wager amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={overUnderWager}
                  onChange={(event) => {
                    const value = event.target.value;
                    setOverUnderWager(value === "" ? "" : String(Math.max(0, Number(value))));
                  }}
                />
                <button type="button" onClick={() => updateOverUnderWager(1)}>
                  +
                </button>
              </div>
              <div className="wager-actions">
                <button
                  className="bet-button"
                  type="button"
                  onClick={placeOverUnderBet}
                >
                  BET
                </button>
                <button
                  className="cancel-button"
                  type="button"
                  onClick={cancelOverUnderBet}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
