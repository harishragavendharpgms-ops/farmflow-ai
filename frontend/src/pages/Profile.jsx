import "./Profile.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Profile() {
  const navigate = useNavigate();
  
  // Create memory for the real name, email, AND phone
  const [name, setName] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [phone, setPhone] = useState("Loading...");

  // When the page opens, look inside the backpack
  useEffect(() => {
    const savedName = localStorage.getItem("farmerName");
    const savedEmail = localStorage.getItem("farmerEmail");
    const savedPhone = localStorage.getItem("farmerPhone");

    // If we found them, use them!
    setName(savedName ? savedName : "Guest Farmer");
    setEmail(savedEmail ? savedEmail : "guest@example.com");
    setPhone(savedPhone ? savedPhone : "No phone provided");
  }, []);

  const handleLogout = () => {
    // Empty the backpack when they log out!
    localStorage.removeItem("farmerName");
    localStorage.removeItem("farmerEmail");
    localStorage.removeItem("farmerPhone");
    navigate("/");
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        
        <div className="profile-header">
          <Link to="/dashboard" className="back-btn">⬅ Back</Link>
          <h2>My Profile</h2>
          <div style={{ width: '50px' }}></div> 
        </div>

        <div className="profile-avatar-section">
          <div className="profile-avatar">👨‍🌾</div>
          <h3>{name}</h3>
          <p className="profile-role">Registered Farmer</p>
        </div>

        <div className="profile-details">
          <div className="detail-group">
            <span className="detail-label">Email</span>
            <span className="detail-value">{email}</span>
          </div>

          {/* We changed Location to Phone Number! */}
          <div className="detail-group">
            <span className="detail-label">Phone</span>
            <span className="detail-value">+91 {phone}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="edit-btn">Edit Profile</button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;