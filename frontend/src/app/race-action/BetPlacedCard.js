"use client";

import React from 'react';

export default function BetPlacedCard({
  driver,
  betAmount,
  selected,
  bettingMarket,
  overUnder,
  probabilityLabel,
  probabilityValue,
}) {
  const hasProbability = Number.isFinite(probabilityValue);

  return (
    <div className={`race-card bet-placed-card ${selected ? 'race-card-selected' : ''}`}>
      {bettingMarket && <span className="bet-placed-market">{bettingMarket}</span>}
      <div className="bet-placed-driver">
        {driver}
      </div>
      {overUnder && (
        <div className="bet-placed-info">
          {overUnder}
        </div>
      )}
      {hasProbability && (
        <div className="bet-placed-info">
          {probabilityLabel}: {(probabilityValue * 100).toFixed(1)}%
        </div>
      )}
      <div className="bet-placed-amount">
        ${betAmount}
      </div>
    </div>
  );
}

// Made with Bob
