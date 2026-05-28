"use client";

import React from 'react';

export default function BettingCard({
  market,
  index,
  drivers,
  wager,
  selected = false,
  selectedDriver = "",
  onWagerChange,
  onDriverChange,
  onPlaceBet,
  onCancelBet,
  onAnalyzeBet,
  analyzing = false,
  disabled = false,
}) {
  function updateWager(step) {
    const currentValue = Number(wager) || 0;
    const newValue = String(Math.max(0, currentValue + step));
    onWagerChange(index, newValue);
  }

  function handleInputChange(event) {
    const value = event.target.value;
    const newValue = value === "" ? "" : String(Math.max(0, Number(value)));
    onWagerChange(index, newValue);
  }

  return (
    <div className={`race-card ${selected ? 'race-card-selected' : ''} ${disabled ? 'race-card-disabled' : ''}`}>
      {market && <span>{market}</span>}
      <select
        className="driver-select"
        value={selectedDriver}
        onChange={(e) => onDriverChange && onDriverChange(index, e.target.value)}
        disabled={disabled}
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
      <div className="wager-field">
        <div className="wager-control" aria-label={`${market || "Bet"} wager`}>
          <button type="button" onClick={() => updateWager(-1)} disabled={disabled}>
            -
          </button>
          <input
            id={`wager-${index}`}
            aria-label={`${market || "Bet"} wager amount`}
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={wager}
            onChange={handleInputChange}
            disabled={disabled}
          />
          <button type="button" onClick={() => updateWager(1)} disabled={disabled}>
            +
          </button>
        </div>
        <div className="wager-actions">
          <button
            className="bet-button"
            type="button"
            onClick={() => onPlaceBet(index)}
            disabled={disabled}
          >
            BET
          </button>
          <button
            className="cancel-button"
            type="button"
            onClick={() => onCancelBet(index)}
            disabled={disabled}
          >
            CANCEL
          </button>
          <button
            className="analyze-button"
            type="button"
            onClick={() => onAnalyzeBet && onAnalyzeBet(index)}
            disabled={disabled || analyzing}
          >
            {analyzing ? "ANALYZING..." : "AI ANALYZE BET"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
