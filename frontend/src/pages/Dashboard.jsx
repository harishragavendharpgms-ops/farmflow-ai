import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Procurement Form States
  const [orderingItem, setOrderingItem] = useState(null);
  const [orderDetails, setOrderDetails] = useState({ location: '', datetime: '' });

  const handleLogout = () => navigate('/login');
  const handleFeatureClick = (featureName) => alert(`Opening ${featureName}...`);

  const submitOrder = (e) => {
    e.preventDefault();
    alert(`Success! Application submitted for ${orderingItem} at ${orderDetails.location} on ${orderDetails.datetime}.`);
    setOrderingItem(null); // Reset form
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#1e392a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#4caf50', margin: '0 0 40px 0', fontSize: '24px' }}>🌱 FarmFlow AI</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
          <div onClick={() => {setActiveTab('dashboard'); setOrderingItem(null);}} style={{ color: activeTab === 'dashboard' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', cursor: 'pointer' }}>📊 Dashboard</div>
          <div onClick={() => {setActiveTab('crops'); setOrderingItem(null);}} style={{ color: activeTab === 'crops' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'crops' ? 'bold' : 'normal', cursor: 'pointer' }}>🌾 My Crops</div>
          <div onClick={() => setActiveTab('procurement')} style={{ color: activeTab === 'procurement' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'procurement' ? 'bold' : 'normal', cursor: 'pointer' }}>🛒 Procurement</div>
          <div onClick={() => {setActiveTab('irrigation'); setOrderingItem(null);}} style={{ color: activeTab === 'irrigation' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'irrigation' ? 'bold' : 'normal', cursor: 'pointer' }}>💧 Irrigation</div>
          <div onClick={() => {setActiveTab('ai'); setOrderingItem(null);}} style={{ color: activeTab === 'ai' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'ai' ? 'bold' : 'normal', cursor: 'pointer' }}>🤖 AI Insights</div>
        </nav>
        <button onClick={handleLogout} style={{ padding: '12px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '32px' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h1>
            <p style={{ color: '#7f8c8d', fontSize: '16px', marginTop: '8px' }}>Manage your smart farm operations seamlessly.</p>
          </div>
          <div style={{ padding: '10px 20px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontWeight: 'bold', border: '1px solid #c8e6c9' }}>🟢 AI Engine Online</div>
        </div>

        {/* VIEW 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>🌤️ Weather</h3>
              <p>Clear skies expected. 10% rain chance.</p>
              <button onClick={() => handleFeatureClick('Radar')} style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px' }}>Open Radar</button>
            </div>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>🐛 Pest Alert</h3>
              <p>No active threats detected in Sector A.</p>
              <button onClick={() => handleFeatureClick('Drone')} style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px' }}>Deploy Drone</button>
            </div>
          </div>
        )}

        {/* VIEW 2: MY CROPS */}
        {activeTab === 'crops' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px' }}>Active Plantings</h3>
            <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>Wheat (Sector 1)</h4>
              <p style={{ margin: 0, color: '#555' }}>Status: <strong style={{ color: 'green' }}>Healthy</strong> | Expected Harvest: Oct 15</p>
            </div>
            <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#2e7d32' }}>Corn (Sector 2)</h4>
              <p style={{ margin: 0, color: '#555' }}>Status: <strong style={{ color: '#f39c12' }}>Needs Nitrogen</strong> | Expected Harvest: Nov 01</p>
            </div>
          </div>
        )}

        {/* VIEW 3: PROCUREMENT (WITH APPLICATION FORM) */}
        {activeTab === 'procurement' && !orderingItem && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px' }}>Live Market Prices</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '15px 10px' }}>Item</th>
                  <th style={{ padding: '15px 10px' }}>Current Price</th>
                  <th style={{ padding: '15px 10px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 10px' }}><strong>Urea Fertilizer (45kg)</strong></td>
                  <td style={{ padding: '15px 10px' }}>₹266.50 <span style={{ color: 'green' }}>↓</span></td>
                  <td style={{ padding: '15px 10px' }}><button onClick={() => setOrderingItem('Urea Fertilizer')} style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply for Procurement</button></td>
                </tr>
                <tr>
                  <td style={{ padding: '15px 10px' }}><strong>Wheat Seeds (40kg)</strong></td>
                  <td style={{ padding: '15px 10px' }}>₹3,500.00 <span style={{ color: 'red' }}>↑</span></td>
                  <td style={{ padding: '15px 10px' }}><button onClick={() => setOrderingItem('Wheat Seeds')} style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply for Procurement</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* PROCUREMENT FORM (Visible when an item is selected) */}
        {activeTab === 'procurement' && orderingItem && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Procurement Application</h3>
            <p style={{ color: '#777', marginBottom: '20px' }}>Applying for: <strong>{orderingItem}</strong></p>
            
            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Farm Location / Address</label>
                <input type="text" required placeholder="Enter delivery location" value={orderDetails.location} onChange={(e) => setOrderDetails({...orderDetails, location: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Preferred Date & Time</label>
                <input type="datetime-local" required value={orderDetails.datetime} onChange={(e) => setOrderDetails({...orderDetails, datetime: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flexGrow: 1, padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Order</button>
                <button type="button" onClick={() => setOrderingItem(null)} style={{ padding: '12px', backgroundColor: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 4: IRRIGATION */}
        {activeTab === 'irrigation' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px' }}>Smart Irrigation Control</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>Main Water Pump</h4>
                <p style={{ margin: 0, color: '#777' }}>Soil moisture is currently at 42% (Optimal).</p>
              </div>
              <button onClick={() => handleFeatureClick('Pump Switch')} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Turn Pump ON</button>
            </div>
          </div>
        )}

        {/* VIEW 5: AI INSIGHTS */}
        {activeTab === 'ai' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px' }}>🤖 FarmFlow AI Analysis</h3>
            <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>Weekly Insight Report generated:</p>
              <ul style={{ color: '#555', lineHeight: '1.8' }}>
                <li>Yield forecast indicates a 12% increase if watering schedules are shifted to 5:00 AM.</li>
                <li>Nitrogen levels in Sector 2 are dropping. Recommended to apply Urea by Thursday.</li>
                <li>Market conditions suggest holding wheat sales for 2 weeks to maximize profit.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;