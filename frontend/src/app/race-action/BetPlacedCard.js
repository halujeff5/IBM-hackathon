"use client";

import React from 'react';

export default function BetPlacedCard({
  driver,
  betAmount,
  selected,
  bettingMarket,
  overUnder,
}) {
  return (
    <div className={`race-card ${selected ? 'race-card-selected' : ''}`}>
      {bettingMarket && <span>{bettingMarket}</span>}
      <div className="race-text-input" style={{ width: '100%', textAlign: 'center' }}>
        {driver}
      </div>
      {overUnder && (
        <div className="race-text-input" style={{ width: '100%', textAlign: 'center' }}>
          {overUnder}
        </div>
      )}
      <div className="race-text-input" style={{ width: '100%', textAlign: 'center' }}>
        ${betAmount}
      </div>
    </div>
  );
}

// Made with Bob