"use client";

import React from "react";

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours,
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

function CountdownCardClient({ countdown, raceName = "Miami Grand Prix" }) {
  return (
    <section className="countdown-card race-card">
      <span>{raceName} starts in</span>
      <strong suppressHydrationWarning>{formatCountdown(countdown)}</strong>
    </section>
  );
}

export default CountdownCardClient;

// Made with Bob
