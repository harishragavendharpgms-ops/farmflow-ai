import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
// 1. We import useState (for memory) and axios (for talking to Python)
import { useState } from "react";
import axios from "axios";

function Register() {
  const navigate = useNavigate();

  // 2. We create a "memory" space to hold what the user types
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // 3. We create a memory space for success or error messages
  const [message, setMessage] = useState("");

  // 4. This function updates our memory every time they type a letter
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // 5. This is the magic function that runs when they click "Create Account"
  const handleRegister = (e) => {
    e.preventDefault(); // Stops the page from refreshing
    setMessage("Processing..."); // Show a loading message

    // Check if passwords match first
    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match!");
      return;
    }

    // Send the data to our Python API
    axios.post("http://localhost:8000/api/register", {
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
      // If Python sends an error (like "Email already registered")
      if (error.response && error.response.data) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Could not connect to the server.");
      }
    });
  };

  return (
    <div className="register-page">
      <div className="register-card">
        
        <div className="register-logo">🌾</div>
        <h1>Create Account</h1>
        <p className="register-subtitle">Join FarmFlow AI and manage your farming smarter</p>
        
        {/* We tell the form to use our handleRegister function */}
        <form onSubmit={handleRegister}>
          
          <div className="register-form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              id="name" 
              type="text" 
              placeholder="Enter your full name" 
              value={formData.name}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="register-form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              placeholder="Enter your email" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="register-form-group">
            <label htmlFor="phone">Phone Number</label>
            <input 
              id="phone" 
              type="tel" 
              placeholder="Enter your phone number" 
              value={formData.phone}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="register-form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="Create a password" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="register-form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              id="confirmPassword" 
              type="password" 
              placeholder="Confirm your password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
          </div>
          
          {/* This is where our success/error message will show up */}
          {message && (
            <div style={{ textAlign: "center", marginBottom: "15px", fontWeight: "bold", color: message.includes("✅") ? "#27ae60" : "#e74c3c" }}>
              {message}
            </div>
          )}

          <button type="submit" className="register-submit">
            Create Account
          </button>
          
        </form>
        
        <p className="login-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        
      </div>
    </div>
  );
}

export default Register;