"use client";

function recommendationClass(recommendation = "") {
  const text = recommendation.toLowerCase();

  if (text.includes("strong")) {
    return "strong-value";
  }

  if (text.includes("watchlist")) {
    return "watchlist-value";
  }

  return "low-value";
}

function decisionLabel(recommendation = "") {
  const text = recommendation.toLowerCase();

  if (text.includes("strong")) {
    return "Strong Bet Opportunity";
  }

  if (text.includes("watchlist")) {
    return "Place Small Bet / Watch Closely";
  }

  return "Avoid Bet";
}

export default function AIInsightPanel({ insight }) {
  if (!insight) {
    return null;
  }

  if (insight.loading) {
    return (
      <section className="ai-insight-panel">
        <div className="ai-header">
          <span className="ai-label">IBM AI Betting Intelligence</span>
          <h2>Analyzing Bet...</h2>
        </div>
        <p className="ai-risk-note">
          Reviewing {insight.driver} for {insight.market}.
        </p>
      </section>
    );
  }

  if (insight.error) {
    return (
      <section className="ai-insight-panel ai-insight-error">
        <div className="ai-header">
          <span className="ai-label">IBM AI Betting Intelligence</span>
          <h2>{insight.recommendation}</h2>
        </div>
        <p className="ai-risk-note">
          {insight.reasons?.[0] ?? "Try again once the backend is running."}
        </p>
      </section>
    );
  }

  const confidenceBreakdown = insight.confidenceBreakdown ?? {};
  const recClass = recommendationClass(insight.recommendation);
  const reasons = insight.reasons ?? [];

  return (
    <section className="ai-insight-panel">
      <div className="ai-header">
        <span className="ai-label">IBM AI Betting Intelligence</span>
        <h2 className={recClass}>{insight.recommendation}</h2>
      </div>

      <div className={`ai-decision-banner ${recClass}`}>
        IBM Recommendation: {decisionLabel(insight.recommendation)}
      </div>

      <div className="ai-bet-summary">
        <span className="ai-driver">Driver: {insight.driver}</span>
        <span className="ai-market">Market: {insight.market}</span>
        <span className="ai-lap">Lap {insight.lap}</span>
      </div>

      <div className="ai-metric-grid">
        <div className="ai-metric-card probability-card">
          <span title="Estimated likelihood that this bet outcome occurs.">
            Probability ⓘ
          </span>
          <strong>{insight.probability}%</strong>
        </div>

        <div className="ai-metric-card confidence-card">
          <span title="How much the AI trusts the prediction quality.">
            Confidence ⓘ
          </span>
          <strong>{insight.confidence}%</strong>
        </div>

        <div className="ai-metric-card risk-card">
          <span title="Estimated uncertainty level for this bet.">
            Risk Level ⓘ
          </span>
          <strong>{insight.risk}</strong>
        </div>

        <div className="ai-metric-card momentum-card">
          <span title="Positive values suggest stronger race momentum.">
            Momentum ⓘ
          </span>
          <strong>{insight.momentumScore}</strong>
        </div>
      </div>

      <div className="confidence-breakdown-box">
        <h3>AI Confidence Breakdown</h3>

        {Object.entries(confidenceBreakdown).map(([label, value]) => (
          <div className="confidence-row" key={label}>
            <span>{label}</span>
            <div className="confidence-bar">
              <div
                className="confidence-bar-fill"
                style={{ width: `${value}%` }}
              />
            </div>
            <strong>{value}%</strong>
          </div>
        ))}
      </div>

      <div className="ai-explanation-box">
        <h3>Why this recommendation?</h3>
        <ul>
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      <p className="ai-risk-note">
        Decision-support only. This does not guarantee betting outcomes.
      </p>
    </section>
  );
}