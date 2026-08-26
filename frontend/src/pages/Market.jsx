import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

function Market() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ask Python for the live market prices
    axios.get("[https://farmflow-ai-84t0.onrender.com](https://farmflow-ai-84t0.onrender.com)/api/market")
      .then((response) => {
        setPrices(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching market prices:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-page" style={{ padding: "20px" }}>
      <div className="dashboard-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <div className="scheduling-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>📈 Live Market Insights</h2>
          <Link to="/dashboard" className="card-btn" style={{ textDecoration: "none", padding: "8px 15px" }}>⬅ Back</Link>
        </div>

        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
          Current Mandi Rates (Estimated)
        </p>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading live prices...</p>
        ) : (
          <div className="appointments-list">
            {prices.map((item) => (
              <div key={item.id} className="appointment-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", marginBottom: "10px", background: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#2c3e50" }}>
                  🌾 {item.crop}
                </div>
                <div style={{ fontSize: "1.1rem", color: "#27ae60", fontWeight: "bold" }}>
                  ₹{item.price} <span style={{ fontSize: "0.9rem", color: "#7f8c8d", fontWeight: "normal" }}>/ {item.unit}</span>
                </div>
                <div style={{ fontSize: "1rem" }}>
                  {item.trend}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Market;