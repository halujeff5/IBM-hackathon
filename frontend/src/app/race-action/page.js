"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RacePositionMap from "./RacePositionMap";
import BetPlacedCard from "./BetPlacedCard";
import CountdownCard from "../race/CountdownCard";
import RacerCard from "./RacerCard";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8001";
const BETTING_PAGE_ROUTE = "/race";
const RACER_CARD_LIMIT = 8;
const POINT_STEP = 8;
const REALTIME_PLAYBACK_RATE = 20;
const MAX_FRAME_DELAY_MS = 1200;

function telemetryFromPoint(point = {}) {
    return {
        distance: Math.max(0, Number(point.distance) || 0),
        speed: Math.max(0, Number(point.speed) || 0),
        brake: Math.max(0, Number(point.brake) || 0),
        gear: Math.max(0, Number(point.gear) || 0),
        throttle: Math.max(0, Number(point.throttle) || 0),
        x: Number(point.x),
        y: Number(point.y),
    };
}

function buildRacerTelemetry(driverNames, incomingDrivers, pointIndex, previousTelemetry = [], baseTotals = {}) {
    const incomingByName = new Map(incomingDrivers.map((driver) => [driver.name, driver]));
    const previousByName = new Map(previousTelemetry.map((driver) => [driver.name, driver]));

    return driverNames.map((name) => {
        const incoming = incomingByName.get(name);
        const previous = previousByName.get(name);
        const hasPoints = Boolean(incoming?.active !== false && incoming?.points?.length);
        const point = hasPoints
            ? incoming.points[Math.min(pointIndex, incoming.points.length - 1)]
            : null;
        const telemetry = point ? telemetryFromPoint(point) : {};

        return {
            name,
            lap: incoming?.lap ?? previous?.lap ?? 0,
            speed: previous?.speed ?? 0,
            brake: previous?.brake ?? 0,
            gear: previous?.gear ?? 1,
            throttle: previous?.throttle ?? 0,
            ...telemetry,
            total: point
                ? (baseTotals[name] ?? 0) + telemetry.distance
                : previous?.total ?? 0,
            disabled: !hasPoints,
        };
    });
}

function pointTimeAt(drivers, pointIndex) {
    const times = drivers
        .map((driver) => {
            const point = driver.points?.[Math.min(pointIndex, Math.max(0, driver.points.length - 1))];
            const time = Number(point?.time);

            return Number.isFinite(time) ? time : null;
        })
        .filter((time) => time !== null);

    return times.length ? Math.max(...times) : 0;
}

function realtimeDelay(drivers, pointIndex, nextPointIndex) {
    const currentTime = pointTimeAt(drivers, pointIndex);
    const nextTime = pointTimeAt(drivers, nextPointIndex);
    const deltaSeconds = Math.max(0, nextTime - currentTime);

    return Math.min(MAX_FRAME_DELAY_MS, Math.round((deltaSeconds * 1000) / REALTIME_PLAYBACK_RATE));
}

function topRacerCards(racers) {
    const sorted = [...racers]
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0) || a.name.localeCompare(b.name));

    return sorted
        .slice(0, RACER_CARD_LIMIT)
        .map((racer, index) => ({
            ...racer,
            position: index + 1
        }));
}

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
    const [countdown, setCountdown] = useState(0);
    const [streamStarted, setStreamStarted] = useState(true);
    const [raceFinished, setRaceFinished] = useState(false);
    const [racerTelemetry, setRacerTelemetry] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const driversRef = useRef(drivers);

    useEffect(() => {
        driversRef.current = drivers;
    }, [drivers]);

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
            }

            setCountdown(0);
            setStreamStarted(true);
            localStorage.setItem('countdown', '0');
            localStorage.setItem('countdownTimestamp', String(Date.now()));

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

    useEffect(() => {
        if (countdown === 0 && !streamStarted) {
            setStreamStarted(true);
        } else if (countdown > 0 && streamStarted) {
            setStreamStarted(false);
        }
    }, [countdown, streamStarted]);

    useEffect(() => {
        if (!streamStarted) {
            return;
        }

        const events = new EventSource(`${API_URL}/laps/stream`);
        const queue = [];
        let timer = null;
        let animating = false;
        let streamFinished = false;
        let latestRacerTelemetry = [];

        function playNextLap() {
            const incoming = queue.shift();
            if (!incoming || streamFinished) {
                animating = false;
                return;
            }

            animating = true;
            const driverNames = driversRef.current.length
                ? driversRef.current
                : incoming.drivers.map((driver) => driver.name);
            const baseTotals = Object.fromEntries(
                latestRacerTelemetry.map((driver) => [driver.name, driver.total ?? 0]),
            );
            const maxPoints = Math.max(
                1,
                ...incoming.drivers.map((driver) => driver.points.length),
            );
            let pointIndex = 0;

            function playPoint() {
                setRacerTelemetry((currentTelemetry) => {
                    const nextTelemetry = buildRacerTelemetry(
                        driverNames,
                        incoming.drivers,
                        pointIndex,
                        currentTelemetry,
                        baseTotals,
                    );

                    latestRacerTelemetry = nextTelemetry;

                    return nextTelemetry;
                });

                const nextPointIndex = pointIndex + POINT_STEP;

                if (nextPointIndex >= maxPoints) {
                    setRacerTelemetry((currentTelemetry) => {
                        const nextTelemetry = buildRacerTelemetry(
                            driverNames,
                            incoming.drivers,
                            maxPoints - 1,
                            currentTelemetry,
                            baseTotals,
                        );

                        latestRacerTelemetry = nextTelemetry;

                        return nextTelemetry;
                    });

                    if (incoming.lap === 57) {
                        streamFinished = true;
                        queue.length = 0;
                        events.close();
                        animating = false;
                        return;
                    }

                    playNextLap();
                    return;
                }

                const delay = realtimeDelay(incoming.drivers, pointIndex, nextPointIndex);
                pointIndex = nextPointIndex;
                timer = setTimeout(playPoint, delay);
            }

            playPoint();
        }

        events.onmessage = (event) => {
            if (streamFinished) {
                events.close();
                return;
            }

            queue.push(JSON.parse(event.data));

            if (!animating) {
                playNextLap();
            }
        };

        events.onerror = () => {
            events.close();
        };

        return () => {
            events.close();
            clearTimeout(timer);
        };
    }, [streamStarted]);

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
    const racerCardDrivers = topRacerCards(
        racerTelemetry.length > 0
            ? racerTelemetry
            : drivers.map((driver) => ({
                name: driver,
                speed: 0,
                brake: 0,
                gear: 1,
                throttle: 0,
                total: 0,
                disabled: !streamStarted,
            })),
    );

    if (!isClient) {
        return <main className="race-action-page" />;
    }

    return (
        <main className="race-action-page">
            <CountdownCard countdown={countdown} raceName="Miami Grand Prix" />
            <button
                className={`proceed-to-race-button ${raceIsRunning ? 'proceed-to-race-button-dimmed' : ''}`}
                type="button"
                onClick={() => router.push(BETTING_PAGE_ROUTE)}
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
            <RacePositionMap
                racers={racerTelemetry.length > 0
                    ? [...racerTelemetry].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
                    : drivers.map((driver) => ({
                        name: driver,
                        speed: 0,
                        brake: 0,
                        gear: 1,
                        throttle: 0,
                        total: 0,
                        disabled: !streamStarted,
                    }))}
                limit={22}
                driverCount={22}
            />
            {racerTelemetry.length > 0 && racerTelemetry[0]?.lap > 0 && (
                <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    marginBottom: '16px',
                    color: '#14171a',
                    fontFamily: '"Formula1 Display Bold", "Arial Black", Impact, sans-serif',
                }}>
                    Lap {racerTelemetry[0].lap} / 57
                </div>
            )}
            <section className="racer-card-grid">
                {racerCardDrivers.map((driver) => (
                    <RacerCard
                        key={driver.name}
                        position={driver.position}
                        name={driver.name}
                        speed={driver.speed}
                        brake={driver.brake}
                        gear={driver.gear}
                        throttle={driver.throttle}
                        disabled={driver.disabled}
                        raceFinished={raceFinished}
                    />
                ))}
            </section>
        </main>
    )
}
