"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TelemetryStream from "./TelemetryStream";
import BetPlacedCard from "./BetPlacedCard";
import CountdownCard from "../race/CountdownCard";

export default function RaceActionPage() {
    const router = useRouter();
    const [selectedBets, setSelectedBets] = useState([]);
    const [bettingMarkets, setBettingMarkets] = useState([]);
    const [wagers, setWagers] = useState([]);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [placedBets, setPlacedBets] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [overUnderDriver, setOverUnderDriver] = useState("");
    const [overUnderSide, setOverUnderSide] = useState("");
    const [overUnderWager, setOverUnderWager] = useState("");
    const [placedOverUnderBet, setPlacedOverUnderBet] = useState(null);
    const [countdown, setCountdown] = useState(120);
    const [streamStarted, setStreamStarted] = useState(false);
    const [raceFinished, setRaceFinished] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('countdown');
            const savedTimestamp = localStorage.getItem('countdownTimestamp');
            const storedSelectedBets = localStorage.getItem('selectedBets');
            const storedBettingMarkets = localStorage.getItem('bettingMarkets');
            const storedWagers = localStorage.getItem('wagers');
            const storedSelectedDrivers = localStorage.getItem('selectedDrivers');
            const storedPlacedBets = localStorage.getItem('placedBets');
            const storedOverUnderDriver = localStorage.getItem('overUnderDriver');
            const storedOverUnderSide = localStorage.getItem('overUnderSide');
            const storedOverUnderWager = localStorage.getItem('overUnderWager');
            const storedPlacedOverUnderBet = localStorage.getItem('placedOverUnderBet');

            if (saved && savedTimestamp) {
                const elapsed = Math.floor((Date.now() - Number(savedTimestamp)) / 1000);
                const remaining = Math.max(0, Number(saved) - elapsed);
                setCountdown(remaining);
                setStreamStarted(remaining === 0);
            }
            
            if (storedSelectedBets) {
                setSelectedBets(JSON.parse(storedSelectedBets));
            }
            if (storedBettingMarkets) {
                setBettingMarkets(JSON.parse(storedBettingMarkets));
            }
            if (storedWagers) {
                setWagers(JSON.parse(storedWagers));
            }
            if (storedSelectedDrivers) {
                setSelectedDrivers(JSON.parse(storedSelectedDrivers));
            }
            if (storedPlacedBets) {
                setPlacedBets(JSON.parse(storedPlacedBets));
            }
            if (storedOverUnderDriver) {
                setOverUnderDriver(storedOverUnderDriver);
            }
            if (storedOverUnderSide) {
                setOverUnderSide(storedOverUnderSide);
            }
            if (storedOverUnderWager) {
                setOverUnderWager(storedOverUnderWager);
            }
            if (storedPlacedOverUnderBet) {
                setPlacedOverUnderBet(JSON.parse(storedPlacedOverUnderBet));
            }
        }

        const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8001";
        fetch(`${API_URL}/`)
            .then((response) => response.json())
            .then((data) => setDrivers(data.drivers ?? []))
            .catch(() => setDrivers([]));
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                const newCountdown = prev > 0 ? prev - 1 : 0;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('countdown', String(newCountdown));
                    localStorage.setItem('countdownTimestamp', String(Date.now()));
                }
                return newCountdown;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Separate effect to manage stream start based on countdown
    useEffect(() => {
        if (countdown === 0 && !streamStarted) {
            setStreamStarted(true);
        } else if (countdown > 0 && streamStarted) {
            // Reset stream if countdown is reset (e.g., from landing page)
            setStreamStarted(false);
        }
    }, [countdown, streamStarted]);

    const storedActiveBets = bettingMarkets
        .map((market, index) => ({
            market,
            index,
            selected: selectedBets[index],
            wager: wagers[index],
            driver: selectedDrivers[index]
        }))
        .filter(bet => bet.selected && Number(bet.wager) > 0);
    const activeBets = placedBets.length > 0 ? placedBets : storedActiveBets;

    const fallbackOverUnderBet = overUnderDriver && overUnderSide && Number(overUnderWager) > 0
        ? {
            driver: overUnderDriver,
            betAmount: overUnderWager,
            bettingMarket: "First Lap 90 sec",
            overUnder: overUnderSide,
        }
        : null;
    const activeOverUnderBet = placedOverUnderBet ?? fallbackOverUnderBet;
    const hasOverUnderBet = Boolean(activeOverUnderBet);
    const hasAnyBets = activeBets.length > 0 || hasOverUnderBet;
    const raceIsRunning = (countdown === 0 || streamStarted) && !raceFinished;

    if (!isClient) {
        return <main className="race-action-page" />;
    }

    return (
        <main className="race-action-page">
            <CountdownCard countdown={countdown} raceName="Miami Grand Prix" />
            <button
                className={`proceed-to-race-button ${raceIsRunning ? 'proceed-to-race-button-dimmed' : ''}`}
                type="button"
                onClick={() => router.push('/race')}
                disabled={raceIsRunning}
                style={{ marginBottom: '20px' }}
            >
                Return to Bets
            </button>
            {hasAnyBets && (
                <aside className="active-bets-sidebar">
                    <h2 className="active-bets-title">Active Bets</h2>
                    <div className="active-bets-grid">
                        {activeBets.map((bet) => (
                            <BetPlacedCard
                                key={`active-${bet.market}-${bet.index}`}
                                driver={bet.driver}
                                betAmount={bet.wager}
                                selected={bet.selected}
                                bettingMarket={bet.market}
                            />
                        ))}
                        {hasOverUnderBet && (
                            <BetPlacedCard
                                key="active-over-under"
                                driver={activeOverUnderBet.driver}
                                betAmount={activeOverUnderBet.wager ?? activeOverUnderBet.betAmount}
                                selected={true}
                                bettingMarket={activeOverUnderBet.bettingMarket}
                                overUnder={activeOverUnderBet.overUnder}
                            />
                        )}
                    </div>
                </aside>
            )}
            <TelemetryStream
                shouldStart={streamStarted}
                onRaceFinished={() => setRaceFinished(true)}
            />
        </main>
    )
}
