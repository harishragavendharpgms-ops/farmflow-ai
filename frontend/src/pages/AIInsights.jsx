import "./AIInsights.css";
import { Link } from "react-router-dom";

function AIInsights() {
  return (
    <div className="insights-page">
      <div className="insights-card">
        
        <div className="insights-header">
          <h2>🧠 AI Insights & Recommendations</h2>
          <Link to="/dashboard" className="back-btn">
            ⬅ Back to Dashboard
          </Link>
        </div>

        <p className="insights-subtitle">
          Powered by FarmFlow AI. These recommendations are based on real-time market data and weather patterns.
        </p>

        <div className="insights-list">
          
          {/* Insight 1 */}
          <div className="insight-item price-up">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Wheat Demand is High</h4>
              <p>Market demand for Wheat has increased by 15% this week. Consider scheduling your procurement soon to get the best value.</p>
            </div>
          </div>

          {/* Insight 2 */}
          <div className="insight-item weather-warn">
            <div className="insight-icon">🌧️</div>
            <div className="insight-content">
              <h4>Harvesting Recommendation</h4>
              <p>Heavy rainfall expected in 3 days. We recommend harvesting your mature Vegetables before Friday to avoid crop damage.</p>
            </div>
          </div>

          {/* Insight 3 */}
          <div className="insight-item optimal">
            <div className="insight-icon">✅</div>
            <div className="insight-content">
              <h4>Low Wait Times Today</h4>
              <p>The procurement center currently has a low queue. Scheduling a drop-off for this afternoon will result in minimal waiting time.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default AIInsights;