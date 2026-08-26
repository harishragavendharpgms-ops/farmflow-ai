import "./Scheduling.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function Scheduling() {
  const navigate = useNavigate();

  // Memory for what the user types into the form
  const [formData, setFormData] = useState({
    cropType: "Wheat", // Default value
    quantity: "",
    date: ""
  });

  // Memory for our success or error messages
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSchedule = (e) => {
    e.preventDefault();
    setMessage("Booking your slot...");

    // 1. Grab the farmer's email from the browser's memory (backpack)
    const userEmail = localStorage.getItem("farmerEmail");

    if (!userEmail) {
      setMessage("❌ Error: You must be logged in to book a slot.");
      return;
    }

    // 2. Send the booking to our Python API
    axios.post("[https://farmflow-ai-84t0.onrender.com](https://farmflow-ai-84t0.onrender.com)/api/schedule", {
      farmer_email: userEmail,
      crop_type: formData.cropType,
      quantity: Number(formData.quantity), // Make sure this is a number!
      date: formData.date
    })
    .then((response) => {
      setMessage("✅ " + response.data.message);
      
      // Send them back to the Dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    })
    .catch((error) => {
      setMessage("❌ Could not connect to the server.");
    });
  };

  return (
    <div className="scheduling-page">
      <div className="scheduling-card">
        
        <div className="scheduling-header">
          <h2>📅 Book a Drop-off Slot</h2>
          <Link to="/dashboard" className="back-btn">
            ⬅ Back to Dashboard
          </Link>
        </div>

        {/* Connect our form to the handleSchedule function */}
        <form className="scheduling-form" onSubmit={handleSchedule}>
          
          <div className="form-group">
            <label htmlFor="cropType">Select Crop</label>
            <select 
              id="cropType" 
              value={formData.cropType} 
              onChange={handleChange}
            >
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice (Paddy)</option>
              <option value="Maize">Maize</option>
              <option value="Vegetables">Vegetables</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Estimated Quantity (in Quintals)</label>
            <input 
              type="number" 
              id="quantity" 
              placeholder="e.g., 50" 
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Select Date</label>
            <input 
              type="date" 
              id="date" 
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Display success/error message here */}
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

          <button type="submit" className="submit-btn">
            Confirm Booking
          </button>
        </form>

      </div>
    </div>
  );
}

export default Scheduling;