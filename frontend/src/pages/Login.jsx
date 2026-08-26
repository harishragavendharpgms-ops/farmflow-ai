import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function Login() {
  const navigate = useNavigate();

  // Memory for what the user types
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  // Memory for messages
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setMessage("Checking credentials...");

    // Ask Python if the email and password are correct
    axios.post("[https://farmflow-ai-84t0.onrender.com](https://farmflow-ai-84t0.onrender.com)/api/login", {
      email: formData.email,
      password: formData.password
    })
    .then((response) => {
      setMessage("✅ Login successful!");
      
      // Save the real farmer's details in the browser's "backpack" (localStorage)
      const realName = response.data.farmer.name;
      const realEmail = response.data.farmer.email;
      const realPhone = response.data.farmer.phone;
      
      localStorage.setItem("farmerName", realName);
      localStorage.setItem("farmerEmail", realEmail);
      localStorage.setItem("farmerPhone", realPhone);

      // Send them to the Dashboard after a 1-second delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    })
    .catch((error) => {
      // If Python sends an error (like "Invalid password")
      if (error.response && error.response.data) {
        setMessage("❌ " + error.response.data.detail);
      } else {
        setMessage("❌ Could not connect to the server.");
      }
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🌾</div>
        <h1>Welcome Back</h1>
        <p className="login-subtitle">Login to FarmFlow AI</p>
        
        <form onSubmit={handleLogin}>
          <div className="login-form-group">
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
          
          <div className="login-form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="Enter your password" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>
          
          {message && (
            <div style={{ 
              textAlign: "center", 
              marginBottom: "15px", 
              fontWeight: "bold", 
              color: message.includes("✅") ? "#27ae60" : "#e74c3c" 
            }}>
              {message}
            </div>
          )}

          <button type="submit" className="login-submit">
            Login
          </button>
        </form>
        
        <p className="register-text">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;