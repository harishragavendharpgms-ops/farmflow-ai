import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    navigate('/login');
  };

  const handleFeatureClick = (featureName) => {
    alert(`Opening ${featureName} Data... (This feature is processing!)`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#1e392a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#4caf50', margin: '0 0 40px 0', fontSize: '24px' }}>🌱 FarmFlow AI</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
          <div onClick={() => setActiveTab('dashboard')} style={{ color: activeTab === 'dashboard' ? '#fff' : '#a0b2a6', fontSize: '18px', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', cursor: 'pointer' }}>📊 Dashboard</div>
          <div onClick={() => setActiveTab('crops')} style={{ color: activeTab === 'crops' ? '#fff' : '#a0b2a6', fontSize: '18px', fontWeight: activeTab === 'crops' ? 'bold' : 'normal', cursor: 'pointer' }}>🌾 My Crops</div>
          <div onClick={() => setActiveTab('procurement')} style={{ color: activeTab === 'procurement' ? '#fff' : '#a0b2a6', fontSize: '18px', fontWeight: activeTab === 'procurement' ? 'bold' : 'normal', cursor: 'pointer' }}>🛒 Procurement</div>
          <div onClick={() => setActiveTab('irrigation')} style={{ color: activeTab === 'irrigation' ? '#fff' : '#a0b2a6', fontSize: '18px', fontWeight: activeTab === 'irrigation' ? 'bold' : 'normal', cursor: 'pointer' }}>💧 Irrigation</div>
          <div onClick={() => setActiveTab('ai')} style={{ color: activeTab === 'ai' ? '#fff' : '#a0b2a6', fontSize: '18px', fontWeight: activeTab === 'ai' ? 'bold' : 'normal', cursor: 'pointer' }}>🤖 AI Insights</div>
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
        
        {/* Dynamic Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '32px' }}>
              {activeTab === 'dashboard' && 'Command Center'}
              {activeTab === 'procurement' && 'Smart Procurement'}
              {activeTab !== 'dashboard' && activeTab !== 'procurement' && 'Module Overview'}
            </h1>
            <p style={{ color: '#7f8c8d', fontSize: '16px', marginTop: '8px' }}>
              {activeTab === 'dashboard' ? "Here is your farm's overview and AI analysis for today." : "Manage your farm operations seamlessly."}
            </p>
          </div>
          <div style={{ padding: '10px 20px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontWeight: 'bold', border: '1px solid #c8e6c9' }}>
            🟢 AI Engine Online
          </div>
        </div>

        {/* --- VIEW 1: MAIN DASHBOARD GRID --- */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>🧪 Soil Health Analysis</h3>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>AI is currently analyzing recent soil sensor data. Nitrogen levels are optimal.</p>
              <button onClick={() => handleFeatureClick('Soil Health')} style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', color: '#495057', fontWeight: 'bold' }}>View Full Report</button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>🌤️ Weather Prediction</h3>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>Clear skies expected for the next 3 days. Rain probability remains at a low 10%.</p>
              <button onClick={() => handleFeatureClick('Weather Radar')} style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', color: '#495057', fontWeight: 'bold' }}>Open Radar</button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', borderTop: '4px solid #2196f3', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>🛒 Smart Procurement</h3>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>Urea prices dropped by 4% today. Recommended time to bulk order fertilizers.</p>
              <button onClick={() => setActiveTab('procurement')} style={{ width: '100%', padding: '10px', backgroundColor: '#2196f3', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Compare Market Prices</button>
            </div>

            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '20px' }}>📈 AI Yield Forecast</h3>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '20px' }}>Based on current growth rates, your corn yield is projected to be 15% above average.</p>
              <button onClick={() => handleFeatureClick('Yield AI Model')} style={{ width: '100%', padding: '10px', backgroundColor: '#4caf50', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Run AI Model</button>
            </div>

          </div>
        )}

        {/* --- VIEW 2: PROCUREMENT PAGE --- */}
        {activeTab === 'procurement' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Live Market Prices</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '15px 10px', color: '#555' }}>Item</th>
                  <th style={{ padding: '15px 10px', color: '#555' }}>Current Price</th>
                  <th style={{ padding: '15px 10px', color: '#555' }}>Trend</th>
                  <th style={{ padding: '15px 10px', color: '#555' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 10px' }}><strong>Urea Fertilizer (45kg Bag)</strong></td>
                  <td style={{ padding: '15px 10px' }}>₹266.50</td>
                  <td style={{ padding: '15px 10px', color: '#2e7d32', fontWeight: 'bold' }}>↓ 4% (Good time to buy)</td>
                  <td style={{ padding: '15px 10px' }}><button style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleFeatureClick('Order Urea')}>Order Now</button></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 10px' }}><strong>Wheat Seeds (Premium 40kg)</strong></td>
                  <td style={{ padding: '15px 10px' }}>₹3,500.00</td>
                  <td style={{ padding: '15px 10px', color: '#e74c3c', fontWeight: 'bold' }}>↑ 2% (Price rising)</td>
                  <td style={{ padding: '15px 10px' }}><button style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleFeatureClick('Order Seeds')}>Order Now</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* --- VIEW 3: PLACEHOLDER FOR OTHER TABS --- */}
        {activeTab !== 'dashboard' && activeTab !== 'procurement' && (
          <div style={{ backgroundColor: 'white', padding: '60px 40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '40px', margin: '0 0 10px 0' }}>🚧</h2>
            <h3 style={{ color: '#2c3e50', fontSize: '24px', margin: '0 0 10px 0' }}>Under Construction</h3>
            <p style={{ color: '#7f8c8d', fontSize: '18px' }}>This module is being built for the next phase of the hackathon!</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;