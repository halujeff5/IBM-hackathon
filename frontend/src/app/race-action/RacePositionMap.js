"use client";

import { useMemo } from "react";

const X_DOMAIN = [-4700, 10800];
const Y_DOMAIN = [-5050, 1250];
const TRACK_PATH = "M 42.23 17.90 L 44.09 20.78 L 47.83 26.56 L 50.84 31.14 L 54.00 35.73 L 56.84 39.44 L 59.74 43.17 L 61.44 45.71 L 62.19 47.42 L 62.66 50.32 L 62.39 52.71 L 61.79 54.62 L 60.89 56.84 L 60.05 58.92 L 59.15 62.41 L 58.82 65.79 L 58.78 70.24 L 58.44 74.61 L 57.70 78.54 L 55.61 83.30 L 53.57 85.75 L 49.76 87.81 L 47.12 87.48 L 43.85 85.03 L 41.08 81.21 L 38.62 77.35 L 34.82 71.37 L 32.88 68.43 L 29.41 63.98 L 27.98 62.84 L 25.62 62.46 L 23.67 63.51 L 20.28 67.97 L 18.92 68.85 L 16.44 68.21 L 14.62 65.71 L 13.19 62.78 L 11.51 59.94 L 9.35 58.56 L 6.74 59.43 L 4.86 61.44 L 3.15 64.94 L 2.31 68.06 L 1.83 72.51 L 1.82 73.59 L 2.06 76.97 L 2.79 79.61 L 3.74 80.97 L 5.05 81.54 L 6.77 81.65 L 10.61 82.37 L 13.07 83.37 L 15.58 84.68 L 18.41 85.57 L 22.17 85.37 L 27.68 84.92 L 32.25 84.76 L 35.64 84.90 L 39.22 86.82 L 41.84 89.10 L 47.09 93.19 L 51.10 95.30 L 56.61 95.84 L 60.04 95.10 L 65.41 92.17 L 69.75 88.62 L 73.60 85.41 L 77.35 82.09 L 80.17 79.18 L 82.94 76.08 L 86.39 72.00 L 88.59 69.15 L 91.19 65.13 L 92.07 62.97 L 92.69 60.25 L 92.57 57.59 L 91.95 55.76 L 91.28 54.32 L 90.25 52.14 L 89.40 49.22 L 89.18 45.71 L 89.53 43.03 L 90.20 40.89 L 90.83 39.86 L 92.01 39.03 L 93.31 38.92 L 96.65 36.67 L 97.69 33.75 L 98.35 30.42 L 98.49 28.17 L 98.10 26.55 L 97.30 24.57 L 97.47 21.87 L 98.00 17.43 L 98.39 14.73 L 98.34 12.48 L 97.44 10.64 L 96.65 9.92 L 95.85 9.51 L 94.47 9.25 L 93.09 9.15 L 91.66 9.05 L 88.51 8.81 L 85.97 8.62 L 83.61 8.46 L 79.60 8.24 L 75.83 8.03 L 72.36 7.84 L 67.29 7.51 L 62.06 7.07 L 58.08 6.73 L 54.82 6.45 L 50.20 6.05 L 46.34 5.72 L 42.88 5.43 L 39.01 5.25 L 34.76 5.05 L 32.07 4.93 L 25.28 4.57 L 21.18 3.71 L 18.81 3.13 L 16.48 2.70 L 14.71 3.06 L 13.84 3.92 L 13.41 5.21 L 13.33 7.06 L 13.62 8.92 L 14.18 10.51 L 14.91 11.88 L 15.35 12.54 L 16.98 14.91 L 19.07 17.73 L 20.75 18.48 L 22.78 17.36 L 25.82 13.90 L 29.86 10.36 L 32.87 9.81 L 38.21 12.70 L 40.10 14.80 L 42.41 18.14";
const DRIVER_COLORS = [
  "#E10600",
  "#0090FF",
  "#FF8700",
  "#00D2BE",
  "#6692FF",
  "#DC0000",
  "#7C3AED",
  "#16A34A",
  "#FACC15",
  "#EC4899",
  "#14B8A6",
  "#8B5CF6",
  "#F97316",
  "#22C55E",
  "#06B6D4",
  "#A855F7",
  "#EF4444",
  "#84CC16",
  "#3B82F6",
  "#D946EF",
  "#10B981",
  "#F59E0B",
];

function hasCoordinate(driver) {
  return Number.isFinite(Number(driver?.x)) && Number.isFinite(Number(driver?.y));
}

function projectPoint(x, y) {
  const px = ((Number(x) - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * 100;
  const py = 100 - ((Number(y) - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * 100;

  return {
    x: Math.min(100, Math.max(0, px)),
    y: Math.min(100, Math.max(0, py)),
  };
}

export default function RacePositionMap({ racers = [], limit = 8, driverCount = 0 }) {
  const visibleRacers = useMemo(
    () => racers.filter(hasCoordinate).slice(0, 8),
    [racers],
  );
  const allDrivers = racers.slice(0, 22);

  return (
    <section className="race-position-map" aria-label="Live car position map">
      <div className="race-position-map-header">
        <h2>Live Position Map</h2>
        <span>{visibleRacers.length} / {driverCount || limit} drivers</span>
      </div>
      <div className="race-position-content">
        <aside className="race-position-featured" aria-label="All drivers">
          {allDrivers.map((driver, index) => (
            <div key={driver.name} className="race-position-rank-row">
              <span className="race-position-rank-number">{index + 1}</span>
              <span
                className="race-position-rank-swatch"
                style={{ backgroundColor: index < 8 ? DRIVER_COLORS[index % DRIVER_COLORS.length] : '#808080' }}
              />
              <strong>{driver.name}</strong>
            </div>
          ))}
        </aside>
        <svg className="race-position-svg" viewBox="0 0 100 100" role="img">
          <rect x="0" y="0" width="100" height="100" rx="2" className="race-position-grid-bg" />
          {[20, 40, 60, 80].map((line) => (
            <g key={line}>
              <line x1={line} x2={line} y1="0" y2="100" className="race-position-grid-line" />
              <line x1="0" x2="100" y1={line} y2={line} className="race-position-grid-line" />
            </g>
          ))}
        <path d={TRACK_PATH} className="race-track-curb" />
        <path d={TRACK_PATH} className="race-track-asphalt" />
        {visibleRacers.length === 0 && (
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="middle"
              className="race-position-empty-text"
            >
              Waiting for streamed x/y coordinates
            </text>
          )}
          {visibleRacers.map((driver, index) => {
            const color = DRIVER_COLORS[index % DRIVER_COLORS.length];
            const projected = projectPoint(driver.x, driver.y);

            return (
              <g key={driver.name}>
                <rect
                  x={projected.x - 0.65}
                  y={projected.y - 0.65}
                  width="1.3"
                  height="1.3"
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth="0.2"
                />
                <text
                  x={projected.x + 1.8}
                  y={projected.y - 1.5}
                  fill={color}
                  fontSize="3.2"
                  fontWeight="800"
                >
                  {driver.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
