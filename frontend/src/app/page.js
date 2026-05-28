import Link from "next/link";

export default function HomePage() {
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

          <Link href="/race" className="landing-start-button">
            START
          </Link>
        </div>

        <div className="landing-car-wrap">
          <div className="landing-car">🏎️</div>
        </div>
      </section>
    </main>
  );
}
