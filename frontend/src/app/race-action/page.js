"use client";

import { useEffect, useState } from "react";
import TelemetryStream from "./TelemetryStream";
import BetPlacedCard from "./BetPlacedCard";
import CountdownCard from "../race/CountdownCard";

export default function RaceActionPage() {
    const [selectedBets, setSelectedBets] = useState([]);
    const [bettingMarkets, setBettingMarkets] = useState([]);
    const [wagers, setWagers] = useState([]);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [overUnderDriver, setOverUnderDriver] = useState("");
    const [overUnderSide, setOverUnderSide] = useState("");
    const [overUnderWager, setOverUnderWager] = useState("");
    const [countdown, setCountdown] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('countdown');
            const savedTimestamp = localStorage.getItem('countdownTimestamp');
            
            if (saved && savedTimestamp) {
                const elapsed = Math.floor((Date.now() - Number(savedTimestamp)) / 1000);
                const remaining = Math.max(0, Number(saved) - elapsed);
                return remaining;
            }
            
            return 300; // Default 5 minutes
        }
        return 300;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedSelectedBets = localStorage.getItem('selectedBets');
            const storedBettingMarkets = localStorage.getItem('bettingMarkets');
            const storedWagers = localStorage.getItem('wagers');
            const storedSelectedDrivers = localStorage.getItem('selectedDrivers');
            const storedOverUnderDriver = localStorage.getItem('overUnderDriver');
            const storedOverUnderSide = localStorage.getItem('overUnderSide');
            const storedOverUnderWager = localStorage.getItem('overUnderWager');
            
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
            if (storedOverUnderDriver) {
                setOverUnderDriver(storedOverUnderDriver);
            }
            if (storedOverUnderSide) {
                setOverUnderSide(storedOverUnderSide);
            }
            if (storedOverUnderWager) {
                setOverUnderWager(storedOverUnderWager);
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

    const activeBets = bettingMarkets
        .map((market, index) => ({
            market,
            index,
            selected: selectedBets[index],
            wager: wagers[index],
            driver: selectedDrivers[index]
        }))
        .filter(bet => bet.selected && Number(bet.wager) > 0);

    const hasOverUnderBet = overUnderDriver && overUnderSide && Number(overUnderWager) > 0;
    const hasAnyBets = activeBets.length > 0 || hasOverUnderBet;

    return (
        <main className="race-action-page">
            <CountdownCard countdown={countdown} raceName="Miami Grand Prix" />
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
                                driver={overUnderDriver}
                                betAmount={overUnderWager}
                                selected={true}
                                bettingMarket="First Lap 90 sec"
                                overUnder={overUnderSide}
                            />
                        )}
                    </div>
                </aside>
            )}
            <TelemetryStream shouldStart={countdown === 0} />
        </main>
    )
}