"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BettingCard from "./BettingCard";
import CountdownCard from "./CountdownCard";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8001";
const INITIAL_BANK = 500;
const RACE_COUNTDOWN_SECONDS = 300; // 5 minutes
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

export default function RacePage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [bank, setBank] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bank');
      const savedWagers = localStorage.getItem('wagers');
      const savedSelectedBets = localStorage.getItem('selectedBets');
      
      // If we have saved data, use the saved bank value
      if (saved) {
        return Number(saved);
      }
      
      // Otherwise, calculate bank from initial minus any placed bets
      if (savedWagers && savedSelectedBets) {
        const wagers = JSON.parse(savedWagers);
        const selectedBets = JSON.parse(savedSelectedBets);
        const totalWagered = wagers.reduce((sum, wager, index) => {
          return sum + (selectedBets[index] ? (Number(wager) || 0) : 0);
        }, 0);
        return INITIAL_BANK - totalWagered;
      }
      
      return INITIAL_BANK;
    }
    return INITIAL_BANK;
  });
  const [countdown, setCountdown] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('countdown');
      const savedTimestamp = localStorage.getItem('countdownTimestamp');
      
      if (saved && savedTimestamp) {
        const elapsed = Math.floor((Date.now() - Number(savedTimestamp)) / 1000);
        const remaining = Math.max(0, Number(saved) - elapsed);
        return remaining;
      }
      
      // Initialize countdown for the first time
      localStorage.setItem('countdown', String(RACE_COUNTDOWN_SECONDS));
      localStorage.setItem('countdownTimestamp', String(Date.now()));
      return RACE_COUNTDOWN_SECONDS;
    }
    return RACE_COUNTDOWN_SECONDS;
  });
  const [wagers, setWagers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wagers');
      return saved ? JSON.parse(saved) : Array(BETTING_MARKETS.length).fill("");
    }
    return Array(BETTING_MARKETS.length).fill("");
  });
  const [selectedBets, setSelectedBets] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedBets');
      return saved ? JSON.parse(saved) : Array(BETTING_MARKETS.length).fill(false);
    }
    return Array(BETTING_MARKETS.length).fill(false);
  });
  const [selectedDrivers, setSelectedDrivers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedDrivers');
      return saved ? JSON.parse(saved) : Array(BETTING_MARKETS.length).fill("");
    }
    return Array(BETTING_MARKETS.length).fill("");
  });
  const [overUnderDriver, setOverUnderDriver] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('overUnderDriver');
      return saved || "";
    }
    return "";
  });
  const [overUnderSide, setOverUnderSide] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('overUnderSide');
      return saved || "";
    }
    return "";
  });
  const [overUnderWager, setOverUnderWager] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('overUnderWager');
      return saved || "";
    }
    return "";
  });

  function updateWager(index, newValue) {
    setWagers((currentWagers) =>
      currentWagers.map((wager, wagerIndex) =>
        wagerIndex === index ? newValue : wager
      ),
    );
  }

  function updateDriver(index, driver) {
    setSelectedDrivers((currentDrivers) =>
      currentDrivers.map((d, driverIndex) =>
        driverIndex === index ? driver : d
      ),
    );
  }

  function placeBet(index) {
    const wagerAmount = Number(wagers[index]) || 0;
    const driver = selectedDrivers[index];
    
    // Validate that both wager and driver are selected
    if (wagerAmount <= 0 || !driver) {
      return;
    }

    setBank((currentBank) => Math.max(0, currentBank - wagerAmount));
    setSelectedBets((currentSelected) =>
      currentSelected.map((selected, betIndex) =>
        betIndex === index ? true : selected
      )
    );
  }

  function cancelBet(index) {
    const wagerAmount = Number(wagers[index]) || 0;
    if (wagerAmount <= 0) {
      return;
    }

    setBank((currentBank) => Math.min(INITIAL_BANK, currentBank + wagerAmount));
    setSelectedBets((currentSelected) =>
      currentSelected.map((selected, betIndex) =>
        betIndex === index ? false : selected
      )
    );
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBets', JSON.stringify(selectedBets));
      localStorage.setItem('bettingMarkets', JSON.stringify(BETTING_MARKETS));
      localStorage.setItem('wagers', JSON.stringify(wagers));
      localStorage.setItem('selectedDrivers', JSON.stringify(selectedDrivers));
      localStorage.setItem('bank', String(bank));
      localStorage.setItem('overUnderDriver', overUnderDriver);
      localStorage.setItem('overUnderSide', overUnderSide);
      localStorage.setItem('overUnderWager', overUnderWager);
    }
  }, [selectedBets, wagers, selectedDrivers, bank, overUnderDriver, overUnderSide, overUnderWager]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((currentCountdown) => {
        const newCountdown = Math.max(0, currentCountdown - 1);
        if (typeof window !== 'undefined') {
          localStorage.setItem('countdown', String(newCountdown));
          localStorage.setItem('countdownTimestamp', String(Date.now()));
        }
        return newCountdown;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="race-page">
      <h1 className="race-page-title">F1 Racing Sports Betting</h1>
      <CountdownCard countdown={countdown} raceName="Miami Grand Prix" />
      <section className="bank-card race-card">
        <span>BANK</span>
        <strong>${bank}</strong>
      </section>
      <button
        className="proceed-to-race-button"
        type="button"
        onClick={() => router.push('/race-action')}
      >
        Proceed to Race
      </button>
      <section className="race-card-grid">
        {BETTING_MARKETS.map((market, index) => (
          <BettingCard
            key={`${market}-${index}`}
            market={market}
            index={index}
            drivers={drivers}
            wager={wagers[index]}
            selected={selectedBets[index]}
            selectedDriver={selectedDrivers[index]}
            onWagerChange={updateWager}
            onDriverChange={updateDriver}
            onPlaceBet={placeBet}
            onCancelBet={cancelBet}
            disabled={countdown <= 10}
          />
        ))}

        <div className="over-under-grid-cell">
          <div className="race-card-section over-under-heading">OVER / UNDER</div>
          <div className={`race-card over-under-card ${countdown <= 10 ? 'race-card-disabled' : ''}`}>
            <span>FIRST LAP 90 SEC</span>
            <select
              className="driver-select"
              aria-label="First lap 90 sec driver"
              value={overUnderDriver}
              onChange={(event) => setOverUnderDriver(event.target.value)}
              disabled={countdown <= 10}
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
              disabled={countdown <= 10}
            >
              <option value="" disabled>
                Over / Under
              </option>
              <option value="OVER">OVER</option>
              <option value="UNDER">UNDER</option>
            </select>
            <div className="wager-field">
              <div className="wager-control" aria-label="First lap 90 sec wager">
                <button type="button" onClick={() => updateOverUnderWager(-1)} disabled={countdown <= 10}>
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
                  disabled={countdown <= 10}
                />
                <button type="button" onClick={() => updateOverUnderWager(1)} disabled={countdown <= 10}>
                  +
                </button>
              </div>
              <div className="wager-actions">
                <button
                  className="bet-button"
                  type="button"
                  onClick={placeOverUnderBet}
                  disabled={countdown <= 10}
                >
                  BET
                </button>
                <button
                  className="cancel-button"
                  type="button"
                  onClick={cancelOverUnderBet}
                  disabled={countdown <= 10}
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
