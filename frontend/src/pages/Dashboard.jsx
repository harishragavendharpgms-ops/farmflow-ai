import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Teleport the user back to the login screen
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#1e392a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#4caf50', margin: '0 0 40px 0', fontSize: '24px' }}>🌱 FarmFlow AI</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>📊 Dashboard</div>
          <div style={{ color: '#a0b2a6', fontSize: '18px', cursor: 'pointer' }}>🌾 My Crops</div>
          <div style={{ color: '#a0b2a6', fontSize: '18px', cursor: 'pointer' }}>💧 Irrigation</div>
          <div style={{ color: '#a0b2a6', fontSize: '18px', cursor: 'pointer' }}>🤖 AI Insights</div>
        </nav>

        <button 
          onClick={handleLogout} 
          style={{ padding: '12px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: 'auto' }}
        >
          Log Out
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '40px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '32px' }}>Command Center</h1>
            <p style={{ color: '#7f8c8d', fontSize: '16px', marginTop: '8px' }}>Here is your farm's overview and AI analysis for today.</p>
          </div>
          <div style={{ padding: '10px 20px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontWeight: 'bold', border: '1px solid #c8e6c9' }}>
            🟢 AI Engine Online
          </div>
        </div>

        {/* FEATURE CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
          
          {/* Card 1 */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>🧪 Soil Health Analysis</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>AI is currently analyzing recent soil sensor data. Nitrogen levels are optimal.</p>
            <button style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', color: '#495057', fontWeight: 'bold' }}>
              View Full Report
            </button>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>🌤️ Weather Prediction</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>Clear skies expected for the next 3 days. Rain probability remains at a low 10%.</p>
            <button style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', color: '#495057', fontWeight: 'bold' }}>
              Open Radar
            </button>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>📈 AI Yield Forecast</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>Based on current growth rates, your corn yield is projected to be 15% above average.</p>
            <button style={{ width: '100%', padding: '10px', backgroundColor: '#4caf50', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
              Run AI Model
            </button>
          </div>

          {/* Card 4 */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>🐛 Pest Alert System</h3>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>No active threats detected in Sector A. Last drone scan completed 2 hours ago.</p>
            <button style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', color: '#495057', fontWeight: 'bold' }}>
              Deploy Drone
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;