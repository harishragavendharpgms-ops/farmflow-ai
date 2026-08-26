import "./Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const [farmerName, setFarmerName] = useState("Farmer");
  const [appointments, setAppointments] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loadingMarket, setLoadingMarket] = useState(true);

  useEffect(() => {
    // 1. Get the farmer's details from local storage
    const savedName = localStorage.getItem("farmerName");
    const savedEmail = localStorage.getItem("farmerEmail");

    if (savedName) {
      setFarmerName(savedName);
    } else {
      // If no name is found, redirect to login
      navigate("/login");
      return;
    }

    // 2. Fetch appointments from Python backend
    axios.get(`http://localhost:8000/api/appointments?email=${savedEmail}`)
      .then((response) => {
        setAppointments(response.data);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
      });

    // 3. Fetch market prices from Python backend
    axios.get("http://localhost:8000/api/market")
      .then((response) => {
        setMarketPrices(response.data);
        setLoadingMarket(false);
      })
      .catch((error) => {
        console.error("Error fetching market prices:", error);
        setLoadingMarket(false);
      });
  }, [navigate]);

  return (
    <div className="dashboard-page">
      {/* Top Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-logo">🌾 FarmFlow AI</div>
        <div className="nav-links">
          <Link to="/profile" className="profile-link">👤 {farmerName}'s Profile</Link>
        </div>
      </nav>

      <div className="dashboard-container">
        <h1 className="dashboard-title">Welcome back, {farmerName}!</h1>
        
        <div className="dashboard-grid">
          {/* Smart Scheduling Card */}
          <div className="dashboard-card">
            <div className="card-icon">📅</div>
            <h3>Smart Scheduling</h3>
            <p>Book your crop drop-off slot to avoid long queues at the mandi.</p>
            <Link to="/scheduling" className="card-btn">Schedule Now</Link>
          </div>

          {/* Profile Card */}
          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <h3>Farmer Profile</h3>
            <p>Manage your account details, farm location, and preferences.</p>
            <Link to="/profile" className="card-btn secondary">View Profile</Link>
          </div>
        </div>

        {/* Live Market Insights Section (Directly Integrated) */}
        <div className="appointments-section" style={{ marginTop: "30px" }}>
          <h2>📈 Live Mandi Market Insights</h2>
          
          {loadingMarket ? (
            <p className="no-appointments">Loading live market prices...</p>
          ) : (
            <div className="appointments-list">
              {marketPrices.map((item) => (
                <div key={item.id} className="appointment-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><strong>🌾 Crop:</strong> {item.crop}</div>
                  <div style={{ color: "#27ae60", fontWeight: "bold" }}>₹{item.price} / {item.unit}</div>
                  <div>{item.trend}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments Section */}
        <div className="appointments-section" style={{ marginTop: "30px" }}>
          <h2>Your Upcoming Drop-offs</h2>
          
          {appointments.length === 0 ? (
            <p className="no-appointments">You have no upcoming appointments.</p>
          ) : (
            <div className="appointments-list">
              {appointments.map((appt) => (
                <div key={appt.id} className="appointment-card">
                  <div className="appt-detail"><strong>Crop:</strong> {appt.crop_type}</div>
                  <div className="appt-detail"><strong>Quantity:</strong> {appt.quantity} Quintals</div>
                  <div className="appt-detail"><strong>Date:</strong> {appt.date}</div>
                  <div className="appt-status">Status: Confirmed ✅</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;