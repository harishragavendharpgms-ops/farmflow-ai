import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Register.css"; // (Keep whatever stylesheet import you already use)

function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = (e) => {
    e.preventDefault(); // Stops the page from refreshing
    setMessage("Processing..."); // Show a loading message

    // Check if passwords match first
    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    // Send the data to our Python API (Clean URL)
    axios.post("https://farmflow-ai-84t0.onrender.com/register", {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    })
    .then((response) => {
      // If Python says success!
      setMessage("✅ Registration successful! Sending you to login...");
      
      // Wait 2 seconds, then send them to the Login page
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    })
    .catch((error) => {
      // Catch real errors instead of showing "undefined"
      console.error("Registration error:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Registration failed";
      setMessage(`❌ ${errorMsg}`);
    });
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleRegister}>
        <h2>Create Account</h2>
        <p>Join FarmFlow AI and manage your farming smarter</p>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        {message && <div className="register-message">{message}</div>}

        <button type="submit" className="register-submit">
          Create Account
        </button>

        <p className="login-redirect">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;