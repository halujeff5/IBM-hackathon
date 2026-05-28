"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  function handleStart() {
    localStorage.setItem("countdown", "120");
    localStorage.setItem("countdownTimestamp", String(Date.now()));
    router.push("/race");
  }

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-text">
          <p className="landing-kicker">IBM F1 Hackathon</p>
          <h1>F1 AI Betting Intelligence</h1>
          <p>
            Analyze race outcomes, review AI betting insights, place wagers,
            and follow the live race simulation.
          </p>

          <button
            className="landing-start-button"
            type="button"
            onClick={handleStart}
          >
            START
          </button>
        </div>

        <div className="landing-car-wrap">
          <div className="landing-car">🏎️</div>
        </div>
      </section>
    </main>
  );
}
