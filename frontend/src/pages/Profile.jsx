import "./Profile.css";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Profile() {
  const navigate = useNavigate();

  const [name, setName] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [phone, setPhone] = useState("Loading...");

  useEffect(() => {
    const savedName = localStorage.getItem("farmerName");
    const savedEmail = localStorage.getItem("farmerEmail");
    const savedPhone = localStorage.getItem("farmerPhone");

    setName(savedName ? savedName : "Guest Farmer");
    setEmail(savedEmail ? savedEmail : "guest@example.com");
    setPhone(savedPhone ? savedPhone : "No phone provided");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("farmerName");
    localStorage.removeItem("farmerEmail");
    localStorage.removeItem("farmerPhone");

    navigate("/");
  };

  // Get first letter for the professional avatar
  const avatarLetter =
    name && name !== "Loading..." ? name.charAt(0).toUpperCase() : "F";

  return (
    <div className="profile-page">

      {/* Background decorative elements */}
      <div className="profile-bg-circle circle-one"></div>
      <div className="profile-bg-circle circle-two"></div>

      <div className="profile-container">

        {/* Top navigation */}
        <div className="profile-topbar">
          <Link to="/dashboard" className="back-btn">
            <span className="back-icon">←</span>
            <span>Back to Dashboard</span>
          </Link>

          <div className="page-location">
            <span className="location-dot"></span>
            My Profile
          </div>
        </div>

        {/* Main profile card */}
        <div className="profile-card">

          {/* Profile hero */}
          <div className="profile-hero">

            <div className="avatar-wrapper">
              <div className="profile-avatar">
                {avatarLetter}
              </div>

              <div className="verified-badge">
                ✓
              </div>
            </div>

            <div className="profile-hero-content">
              <span className="profile-eyebrow">
                FARMER ACCOUNT
              </span>

              <h1>{name}</h1>

              <p className="profile-role">
                <span className="role-icon">🌱</span>
                Registered Farmer
              </p>
            </div>

          </div>

          {/* Divider */}
          <div className="profile-divider"></div>

          {/* Account information */}
          <div className="section-heading">
            <div className="section-icon">
              👤
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Your registered account details</p>
            </div>
          </div>

          <div className="profile-details">

            {/* Email */}
            <div className="detail-card">
              <div className="detail-icon email-icon">
                ✉
              </div>

              <div className="detail-content">
                <span className="detail-label">
                  Email Address
                </span>

                <span className="detail-value">
                  {email}
                </span>
              </div>
            </div>

            {/* Phone */}
            <div className="detail-card">
              <div className="detail-icon phone-icon">
                ☎
              </div>

              <div className="detail-content">
                <span className="detail-label">
                  Phone Number
                </span>

                <span className="detail-value">
                  {phone !== "No phone provided"
                    ? `+91 ${phone}`
                    : phone}
                </span>
              </div>
            </div>

          </div>

          {/* Account status */}
          <div className="account-status">
            <div className="status-left">
              <div className="status-icon">
                ✓
              </div>

              <div>
                <strong>Account Active</strong>
                <span>Your FarmFlow account is ready to use</span>
              </div>
            </div>

            <span className="status-badge">
              Active
            </span>
          </div>

          {/* Actions */}
          <div className="profile-actions">

            <button
              type="button"
              className="edit-btn"
              onClick={() => {
                alert("Profile editing will be available soon.");
              }}
            >
              <span className="button-icon">✎</span>
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="logout-btn"
            >
              <span className="button-icon">↪</span>
              <span>Logout</span>
            </button>

          </div>

          {/* Security note */}
          <div className="profile-security">
            <span className="security-icon">🔒</span>

            <p>
              Your profile information is stored securely
              and is only used to manage your FarmFlow account.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="profile-footer">
          <span>FarmFlow AI</span>
          <span className="footer-separator">•</span>
          <span>Smart Farming Platform</span>
        </div>

      </div>
    </div>
  );
}

export default Profile;