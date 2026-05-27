"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BettingCard from "./BettingCard";
import AIInsightPanel from "./AIInsightPanel";

const CountdownCard = dynamic(() => import("./CountdownCard"), {
  ssr: false,
});

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8001";
const INITIAL_BANK = 500;
const RACE_COUNTDOWN_SECONDS = 120; // 2 minutes
const BETTING_MARKETS = [
  "Race Winner",
  "Top 3 Finish",
  "Top 5 Finish",
  "1st Place +5 Sec",
  "2nd Place",
  "3rd Place",
  "Fastest Lap",
  "1st Place +2 Sec",
];

function saveBetState({
  selectedBets,
  wagers,
  selectedDrivers,
  overUnderDriver,
  overUnderSide,
  overUnderWager,
  overUnderBetPlaced,
}) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('selectedBets', JSON.stringify(selectedBets));
  localStorage.setItem('bettingMarkets', JSON.stringify(BETTING_MARKETS));
  localStorage.setItem('wagers', JSON.stringify(wagers));
  localStorage.setItem('selectedDrivers', JSON.stringify(selectedDrivers));
  localStorage.setItem('overUnderDriver', overUnderDriver);
  localStorage.setItem('overUnderSide', overUnderSide);
  localStorage.setItem('overUnderWager', overUnderWager);
  localStorage.setItem('overUnderBetPlaced', String(overUnderBetPlaced));
  localStorage.setItem(
    'placedBets',
    JSON.stringify(buildPlacedBets(BETTING_MARKETS, selectedBets, wagers, selectedDrivers)),
  );
  localStorage.setItem(
    'placedOverUnderBet',
    JSON.stringify(buildPlacedOverUnderBet(
      overUnderDriver,
      overUnderSide,
      overUnderWager,
      overUnderBetPlaced,
    )),
  );
}

function buildPlacedBets(markets, selectedBets, wagers, selectedDrivers) {
  return markets
    .map((market, index) => ({
      market,
      index,
      selected: selectedBets[index],
      wager: wagers[index],
      driver: selectedDrivers[index],
    }))
    .filter((bet) => bet.selected && bet.market && bet.driver && Number(bet.wager) > 0);
}

function buildPlacedOverUnderBet(driver, side, wager, isPlaced) {
  if (!isPlaced || !driver || !side || Number(wager) <= 0) {
    return null;
  }

  return {
    driver,
    overUnder: side,
    wager,
    bettingMarket: "First Lap 90 sec",
  };
}

export default function RacePage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showBetPlacedModal, setShowBetPlacedModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [countdown, setCountdown] = useState(RACE_COUNTDOWN_SECONDS);
  const [wagers, setWagers] = useState(Array(BETTING_MARKETS.length).fill(""));
  const [selectedBets, setSelectedBets] = useState(Array(BETTING_MARKETS.length).fill(false));
  const [selectedDrivers, setSelectedDrivers] = useState(Array(BETTING_MARKETS.length).fill(""));
  const [overUnderDriver, setOverUnderDriver] = useState("");
  const [overUnderSide, setOverUnderSide] = useState("");
  const [overUnderWager, setOverUnderWager] = useState("");
  const [overUnderBetPlaced, setOverUnderBetPlaced] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  // Calculate bank as INITIAL_BANK - totalWagered
  const bank = useMemo(() => {
    let totalWagered = 0;
    
    // Sum up all placed bets from betting cards
    wagers.forEach((wager, index) => {
      if (selectedBets[index]) {
        totalWagered += Number(wager) || 0;
      }
    });
    
    // Add over/under bet if placed
    if (overUnderBetPlaced) {
      totalWagered += Number(overUnderWager) || 0;
    }
    
    return INITIAL_BANK - totalWagered;
  }, [wagers, selectedBets, overUnderWager, overUnderBetPlaced]);

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

  function analyzeBet(index) {
    const driver = selectedDrivers[index];
    const market = BETTING_MARKETS[index];

    if (!driver || !market) {
      setShowIncompleteModal(true);
      setTimeout(() => setShowIncompleteModal(false), 2000);
      return;
    }

    fetch(`${API_URL}/ai/betting-insight/${driver}/${encodeURIComponent(market)}?lap=10`)
      .then((response) => response.json())
      .then((data) => setAiInsight(data))
      .catch(() => setAiInsight(null));
  }

  function placeBet(index) {
    const wagerAmount = Number(wagers[index]) || 0;
    const driver = selectedDrivers[index];
    
    // Validate that both wager and driver are selected
    if (wagerAmount <= 0 || !driver) {
      setShowIncompleteModal(true);
      setTimeout(() => setShowIncompleteModal(false), 2000);
      return;
    }

    const nextSelectedBets = selectedBets.map((selected, betIndex) =>
      betIndex === index ? true : selected
    );

    setSelectedBets(nextSelectedBets);
    saveBetState({
      selectedBets: nextSelectedBets,
      wagers,
      selectedDrivers,
      overUnderDriver,
      overUnderSide,
      overUnderWager,
      overUnderBetPlaced,
    });
    
    // Show success modal
    setShowBetPlacedModal(true);
    setTimeout(() => setShowBetPlacedModal(false), 2000);
  }

  function cancelBet(index) {
    const nextSelectedBets = selectedBets.map((selected, betIndex) =>
      betIndex === index ? false : selected
    );
    const nextWagers = wagers.map((wager, wagerIndex) =>
      wagerIndex === index ? "" : wager
    );
    const nextSelectedDrivers = selectedDrivers.map((driver, driverIndex) =>
      driverIndex === index ? "" : driver
    );

    setSelectedBets(nextSelectedBets);
    setWagers(nextWagers);
    setSelectedDrivers(nextSelectedDrivers);
    saveBetState({
      selectedBets: nextSelectedBets,
      wagers: nextWagers,
      selectedDrivers: nextSelectedDrivers,
      overUnderDriver,
      overUnderSide,
      overUnderWager,
      overUnderBetPlaced,
    });
  }

  function updateOverUnderWager(step) {
    setOverUnderWager((current) => {
      const currentValue = Number(current) || 0;
      return String(Math.max(0, currentValue + step));
    });
  }

  function placeOverUnderBet() {
    const wagerAmount = Number(overUnderWager) || 0;
    const driver = overUnderDriver;
    const side = overUnderSide;
    
    // Validate that all fields are filled
    if (wagerAmount <= 0 || !driver || !side) {
      setShowIncompleteModal(true);
      setTimeout(() => setShowIncompleteModal(false), 2000);
      return;
    }

    setOverUnderBetPlaced(true);
    saveBetState({
      selectedBets,
      wagers,
      selectedDrivers,
      overUnderDriver,
      overUnderSide,
      overUnderWager,
      overUnderBetPlaced: true,
    });
    
    // Show success modal
    setShowBetPlacedModal(true);
    setTimeout(() => setShowBetPlacedModal(false), 2000);
  }

  function cancelOverUnderBet() {
    // Reset all over/under fields
    setOverUnderBetPlaced(false);
    setOverUnderWager("");
    setOverUnderDriver("");
    setOverUnderSide("");
    saveBetState({
      selectedBets,
      wagers,
      selectedDrivers,
      overUnderDriver: "",
      overUnderSide: "",
      overUnderWager: "",
      overUnderBetPlaced: false,
    });
  }

  // Initialize client-side state from localStorage
  useEffect(() => {
    setIsClient(true);
    
    // Load countdown
    const saved = localStorage.getItem('countdown');
    const savedTimestamp = localStorage.getItem('countdownTimestamp');
    
    if (saved && savedTimestamp) {
      const elapsed = Math.floor((Date.now() - Number(savedTimestamp)) / 1000);
      const remaining = Math.max(0, Number(saved) - elapsed);
      setCountdown(remaining);
    } else {
      // Initialize countdown for the first time
      localStorage.setItem('countdown', String(RACE_COUNTDOWN_SECONDS));
      localStorage.setItem('countdownTimestamp', String(Date.now()));
      setCountdown(RACE_COUNTDOWN_SECONDS);
    }
    
    // Load other state from localStorage
    const savedWagers = localStorage.getItem('wagers');
    if (savedWagers) setWagers(JSON.parse(savedWagers));
    
    const savedBets = localStorage.getItem('selectedBets');
    if (savedBets) setSelectedBets(JSON.parse(savedBets));
    
    const savedDrivers = localStorage.getItem('selectedDrivers');
    if (savedDrivers) setSelectedDrivers(JSON.parse(savedDrivers));
    
    const savedOverUnderDriver = localStorage.getItem('overUnderDriver');
    if (savedOverUnderDriver) setOverUnderDriver(savedOverUnderDriver);
    
    const savedOverUnderSide = localStorage.getItem('overUnderSide');
    if (savedOverUnderSide) setOverUnderSide(savedOverUnderSide);
    
    const savedOverUnderWager = localStorage.getItem('overUnderWager');
    if (savedOverUnderWager) setOverUnderWager(savedOverUnderWager);
    
    const savedOverUnderBetPlaced = localStorage.getItem('overUnderBetPlaced');
    if (savedOverUnderBetPlaced) setOverUnderBetPlaced(savedOverUnderBetPlaced === 'true');
    
    // Fetch drivers
    fetch(`${API_URL}/`)
      .then((response) => response.json())
      .then((data) => setDrivers(data.drivers ?? []))
      .catch(() => setDrivers([]));

    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (storageLoaded) {
      saveBetState({
        selectedBets,
        wagers,
        selectedDrivers,
        overUnderDriver,
        overUnderSide,
        overUnderWager,
        overUnderBetPlaced,
      });
    }
  }, [storageLoaded, selectedBets, wagers, selectedDrivers, overUnderDriver, overUnderSide, overUnderWager, overUnderBetPlaced]);

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

  // Auto-navigate to race-action page when countdown reaches zero
  useEffect(() => {
    if (countdown === 0) {
      // router.push('/race-action');
    }
  }, [countdown, router]);

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <main className="race-page">
      {showIncompleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Incomplete Info</p>
          </div>
        </div>
      )}
      {showBetPlacedModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-success">
            <p>Bet Placed</p>
          </div>
        </div>
      )}
      <h1 className="race-page-title">F1 Racing Sports Betting</h1>
      <CountdownCard countdown={countdown} raceName="Miami Grand Prix" />
      <section className="bank-card race-card">
        <span>BANK</span>
        <strong suppressHydrationWarning>${bank}</strong>
      </section>
      <button
        className="proceed-to-race-button"
        type="button"
        onClick={() => router.push('/race-action')}
      >
        Proceed to Race
      </button>
      <AIInsightPanel insight={aiInsight} />

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
            onAnalyzeBet={analyzeBet}
            disabled={false}
          />
        ))}

        <div className="over-under-grid-cell">
          <div className="race-card-section over-under-heading">Under/Over</div>
          <div className={`race-card over-under-card `}>
            <span>FIRST LAP 90 SEC</span>
            <select
              className="driver-select"
              aria-label="First lap 90 sec driver"
              value={overUnderDriver}
              onChange={(event) => setOverUnderDriver(event.target.value)}
              disabled={false}
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
              disabled={false}
            >
              <option value="" disabled>
                Over / Under
              </option>
              <option value="OVER">OVER</option>
              <option value="UNDER">UNDER</option>
            </select>
            <div className="wager-field">
              <div className="wager-control" aria-label="First lap 90 sec wager">
                <button type="button" onClick={() => updateOverUnderWager(-1)} disabled={false}>
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
                  disabled={false}
                />
                <button type="button" onClick={() => updateOverUnderWager(1)} disabled={false}>
                  +
                </button>
              </div>
              <div className="wager-actions">
                <button
                  className="bet-button"
                  type="button"
                  onClick={placeOverUnderBet}
                  disabled={false}
                >
                  BET
                </button>
                <button
                  className="cancel-button"
                  type="button"
                  onClick={cancelOverUnderBet}
                  disabled={false}
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
