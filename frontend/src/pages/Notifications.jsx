import "./Notifications.css";
import { Link } from "react-router-dom";

function Notifications() {
  return (
    <div className="notifications-page">
      <div className="notifications-card">
        
        <div className="notifications-header">
          <h2>🔔 Notifications</h2>
          <Link to="/dashboard" className="back-btn">
            ⬅ Back to Dashboard
          </Link>
        </div>

        <div className="notifications-list">
          
          {/* Unread Alert */}
          <div className="alert-item unread">
            <div className="alert-icon">📦</div>
            <div className="alert-content">
              <h4>Procurement Update</h4>
              <p>Your Maize has been successfully processed at the center.</p>
              <span className="alert-time">2 hours ago</span>
            </div>
          </div>

          {/* Read Alert */}
          <div className="alert-item">
            <div className="alert-icon">📅</div>
            <div className="alert-content">
              <h4>Booking Confirmed</h4>
              <p>Your slot for Wheat drop-off on Aug 28 is confirmed.</p>
              <span className="alert-time">1 day ago</span>
            </div>
          </div>

          {/* Read Alert */}
          <div className="alert-item">
            <div className="alert-icon">🌦️</div>
            <div className="alert-content">
              <h4>Weather Alert</h4>
              <p>Heavy rain expected tomorrow. Please protect harvested crops.</p>
              <span className="alert-time">2 days ago</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Notifications;