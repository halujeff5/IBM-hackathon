"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8001";
const RACE_TITLE = "2026 Miami Grand Prix Race";
const RACE_DISTANCE_DOMAIN = 310000;
const FINAL_LAP = 57;
const TOP_DRIVER_COLORS = [
  "#E10600",  // Ferrari Red (1st place)
  "#0090FF",  // Racing Blue (2nd place)
  "#FF8700",  // McLaren Orange (3rd place)
  "#00D2BE",  // Mercedes Teal (4th place)
  "#6692FF",  // Alpine Blue (5th place)
  "#DC0000",  // Red Bull Red (6th place)
];
const FINISH_LABELS = ["1st finish", "2nd finish", "3rd finish"];
const PODIUM_LABELS = ["1st", "2nd", "3rd"];

function podiumLabel(index) {
  return PODIUM_LABELS[index] ?? `${index + 1}th`;
}

function clampRaceDistance(distance) {
  return Math.min(RACE_DISTANCE_DOMAIN, Math.max(0, Number(distance) || 0));
}

function lapDistance(points) {
  return points.reduce(
    (maxDistance, point) => Math.max(maxDistance, Number(point.distance) || 0),
    0,
  );
}

function mergeDriverRows(currentData, incomingDrivers) {
  const currentByName = new Map(
    currentData.map((driver) => [driver.name, driver]),
  );

  return incomingDrivers.map((driver) => (
    currentByName.get(driver.name) ?? { name: driver.name, lap: 0, total: 0 }
  ));
}

function rankDrivers(drivers) {
  return [...drivers]
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .map((driver, index) => {
      const place = index + 1;
      const isTopDriver = place <= 6 && driver.total > 0;

      return {
        ...driver,
        place,
        displayName: isTopDriver ? `P${place} ${driver.name}` : driver.name,
        fill: isTopDriver ? TOP_DRIVER_COLORS[index] : "#4F46E5",
      };
    });
}

export default function AccumulatingStream({ shouldStart = true, onRaceFinished }) {
  const [data, setData] = useState([]);
  const [podium, setPodium] = useState([]);
  const [raceFinished, setRaceFinished] = useState(false);
  const dataRef = useRef(data);
  const queueRef = useRef([]);
  const timerRef = useRef(null);
  const animatingRef = useRef(false);
  const streamFinishedRef = useRef(false);
  const onRaceFinishedRef = useRef(onRaceFinished);
  const chartData = rankDrivers(data);
  const chartHeight = Math.max(420, chartData.length * 34);
  const podiumDrivers = podium.slice(0, PODIUM_LABELS.length);
  const renderFinishLabel = ({ x, y, width, height, index }) => {
    const driver = chartData[index];
    if (!driver || driver.place > 3 || driver.total <= 0) {
      return null;
    }

    return (
      <text
        x={Number(x) + Number(width) + 8}
        y={Number(y) + Number(height) / 2}
        dominantBaseline="middle"
        fill={driver.fill}
        fontSize={13}
        fontWeight={700}
        fontFamily="Formula1 Display Bold, Arial Black, Impact, sans-serif"
      >
        {FINISH_LABELS[driver.place - 1]}
      </text>
    );
  };

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    onRaceFinishedRef.current = onRaceFinished;
  }, [onRaceFinished]);

  useEffect(() => {
    if (raceFinished) {
      const callbackTimer = setTimeout(() => {
        onRaceFinishedRef.current?.();
      }, 0);

      return () => clearTimeout(callbackTimer);
    }
  }, [raceFinished]);

  useEffect(() => {
    if (!shouldStart) {
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('telemetryData');
      localStorage.removeItem('telemetryPodium');
      localStorage.removeItem('telemetryStreamFinished');
    }

    const events = new EventSource(`${API_URL}/laps/stream`);

    function playNextLap() {
      const incoming = queueRef.current.shift();
      if (!incoming || streamFinishedRef.current) {
        animatingRef.current = false;
        return;
      }

      animatingRef.current = true;
      const driverRows = mergeDriverRows(dataRef.current, incoming.drivers);
      const baseTotals = Object.fromEntries(
        driverRows.map((driver) => [driver.name, driver.total]),
      );
      const maxPoints = Math.max(
        ...incoming.drivers.map((driver) => driver.points.length),
      );
      let pointIndex = 0;

      timerRef.current = setInterval(() => {
        setData((currentData) =>
          mergeDriverRows(currentData, incoming.drivers).map((driver) => {
            const driverLap = incoming.drivers.find(
              (item) => item.name === driver.name,
            );

            if (!driverLap) {
              return driver;
            }

            const point =
              driverLap.points[Math.min(pointIndex, driverLap.points.length - 1)];

            return {
              ...driver,
              lap: incoming.lap,
              total: clampRaceDistance(
                baseTotals[driver.name] + Math.max(0, Number(point.distance) || 0),
              ),
            };
          }),
        );

        pointIndex += 8;

        if (pointIndex >= maxPoints) {
          clearInterval(timerRef.current);
          let finalPodium = null;

          setData((currentData) => {
            const finalData = mergeDriverRows(currentData, incoming.drivers).map((driver) => {
              const driverLap = incoming.drivers.find(
                (item) => item.name === driver.name,
              );

              if (!driverLap) {
                return driver;
              }

              return {
                ...driver,
                lap: incoming.lap,
                total: clampRaceDistance(
                  baseTotals[driver.name] + lapDistance(driverLap.points),
                ),
              };
            });

            if (incoming.lap === FINAL_LAP) {
              finalPodium = rankDrivers(finalData).slice(0, 3);
              streamFinishedRef.current = true;
              queueRef.current = [];
              events.close();
            }

            return finalData;
          });

          if (incoming.lap === FINAL_LAP) {
            if (finalPodium) {
              setPodium(finalPodium);
            }

            setRaceFinished(true);
            animatingRef.current = false;
            return;
          }

          playNextLap();
        }
      }, 20);
    }

    events.onmessage = (event) => {
      if (streamFinishedRef.current) {
        events.close();
        return;
      }

      const incoming = JSON.parse(event.data);
      queueRef.current.push(incoming);

      if (!animatingRef.current) {
        playNextLap();
      }
    };

    events.onerror = () => {
      events.close();
    };

    return () => {
      events.close();
      clearInterval(timerRef.current);
    };
  }, [shouldStart]);

  return (
    <main className="telemetry-shell">
      <section className="race-chart">
        <h1 className="race-title">{RACE_TITLE}</h1>
        <div className="recharts-panel">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, RACE_DISTANCE_DOMAIN]}
                allowDataOverflow
                tickFormatter={(value) => `${Math.round(value / 1000)} km`}
              />
              <YAxis type="category" dataKey="displayName" width={78} />
              <Tooltip
                cursor={false}
                formatter={(value) => [
                  `${Math.round(value).toLocaleString()} m`,
                  "Distance",
                ]}
                labelFormatter={(label) => `Driver ${label}`}
              />
              <Bar
                dataKey="total"
                fill="#4F46E5"
                background={{ fill: "#EEF2F7" }}
                barSize={46}
                minPointSize={8}
                isAnimationActive={false}
                label={renderFinishLabel}
              >
                {chartData.map((driver) => (
                  <Cell key={driver.name} fill={driver.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      {podiumDrivers.length === PODIUM_LABELS.length && (
        <aside
          className="podium-flash"
          aria-live="polite"
          style={{
            position: "fixed",
            right: 12,
            bottom: 12,
            left: 12,
            zIndex: 10,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          {podiumDrivers.map((driver, index) => (
            <div
              key={driver.name}
              className={`podium-place podium-place-${index + 1}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                minHeight: 58,
                border: `2px solid ${TOP_DRIVER_COLORS[index] ?? "#39ff14"}`,
                background: "#ffffff",
                color: "#14171a",
                fontWeight: 800,
                boxShadow: "0 8px 24px rgba(20, 23, 26, 0.18)",
              }}
            >
              <span>{podiumLabel(index)}</span>
              <strong style={{ fontSize: 26 }}>{driver.name}</strong>
            </div>
          ))}
        </aside>
      )}
    </main>
  );
}
