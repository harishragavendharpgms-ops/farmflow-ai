import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Simulated farming supplies for procurement (kept static for simplicity)
const farmingSupplies = {
  "Urea Fertilizer (45kg Bag)": 266.50,
  "Premium Wheat Seeds (40kg)": 3500.00
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // LIVE MARKET STATE
  const [marketRates, setMarketRates] = useState({
    "Rice (Paddy)": 22.50, "Wheat": 25.00, "Maize (Corn)": 20.00,
    "Cotton": 70.00, "Sugarcane": 3.15, "Soybean": 46.00,
    "Mustard": 52.00, "Bajra (Pearl Millet)": 24.50, "Groundnut": 65.00,
    "Tur (Pigeon Pea)": 110.00, "Onion": 28.00, "Potato": 18.00
  });

  // THE SIMULATION ENGINE: Fluctuates prices every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRates(prevRates => {
        const newRates = { ...prevRates };
        // Pick a random crop to update so it looks organic
        const crops = Object.keys(newRates);
        const randomCrop = crops[Math.floor(Math.random() * crops.length)];
        
        // Fluctuate price by a random amount between -2% and +2%
        const changePercent = (Math.random() * 0.04) - 0.02; 
        let newPrice = newRates[randomCrop] * (1 + changePercent);
        
        newRates[randomCrop] = Number(newPrice.toFixed(2));
        return newRates;
      });
    }, 4000); 

    return () => clearInterval(interval); // Cleanup when user leaves page
  }, []);

  const [userProfile, setUserProfile] = useState({ name: 'Farmer', email: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
  }, []);

  const [orderingItem, setOrderingItem] = useState(null);
  const [orderDetails, setOrderDetails] = useState({ location: '', datetime: '', quantity: '' });
  const [myCrops, setMyCrops] = useState([]);
  const [newCrop, setNewCrop] = useState({ name: '', weightKg: '', sector: '' });

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user'); 
    navigate('/login');
  };

  const submitOrder = (e) => {
    e.preventDefault();
    alert(`Success! Procurement application submitted for ${orderDetails.quantity}kg of ${orderingItem} at ${orderDetails.location}.`);
    setOrderingItem(null); 
    setOrderDetails({ location: '', datetime: '', quantity: '' });
  };

  const handleAddCrop = (e) => {
    e.preventDefault();
    if (!newCrop.name || !newCrop.weightKg || !newCrop.sector) return alert("Please fill details.");
    
    const cropEntry = {
      id: Date.now(),
      name: newCrop.name,
      weightKg: parseFloat(newCrop.weightKg),
      sector: newCrop.sector,
      ratePerKg: marketRates[newCrop.name] // Locks in the price at the exact moment they add it
    };
    setMyCrops([...myCrops, cropEntry]);
    setNewCrop({ name: '', weightKg: '', sector: '' }); 
  };

  const handleDeleteCrop = (idToRemove) => setMyCrops(myCrops.filter(crop => crop.id !== idToRemove));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '250px', backgroundColor: '#1e392a', color: 'white', padding: '30px 20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#4caf50', margin: '0 0 40px 0', fontSize: '24px' }}>🌱 FarmFlow AI</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
          <div onClick={() => {setActiveTab('dashboard'); setOrderingItem(null);}} style={{ color: activeTab === 'dashboard' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', cursor: 'pointer' }}>📊 Dashboard</div>
          <div onClick={() => {setActiveTab('profile'); setOrderingItem(null);}} style={{ color: activeTab === 'profile' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', cursor: 'pointer' }}>👤 My Profile</div>
          <div onClick={() => {setActiveTab('crops'); setOrderingItem(null);}} style={{ color: activeTab === 'crops' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'crops' ? 'bold' : 'normal', cursor: 'pointer' }}>🌾 My Crops</div>
          <div onClick={() => setActiveTab('procurement')} style={{ color: activeTab === 'procurement' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'procurement' ? 'bold' : 'normal', cursor: 'pointer' }}>🛒 Procurement</div>
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
          <div style={{ padding: '10px 20px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontWeight: 'bold', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'green', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
            Live Market Active
          </div>
        </div>

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>User Details</h3>
            <p><strong>Name:</strong> {userProfile.name}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>🌤️ Weather</h3>
              <p>Clear skies expected. 10% rain chance.</p>
            </div>
          </div>
        )}

        {/* MY CROPS VIEW */}
        {activeTab === 'crops' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>➕ Add New Crop Inventory</h3>
              <form onSubmit={handleAddCrop} style={{ display: 'flex', gap: '15px' }}>
                <select required value={newCrop.name} onChange={(e) => setNewCrop({...newCrop, name: e.target.value})} style={{ padding: '10px', flexGrow: 1 }}>
                  <option value="">-- Select Major Indian Crop --</option>
                  {Object.keys(marketRates).map(crop => (
                    <option key={crop} value={crop}>{crop} (₹{marketRates[crop].toFixed(2)}/kg)</option>
                  ))}
                </select>
                <input type="number" min="1" required placeholder="Weight (KGs)" value={newCrop.weightKg} onChange={(e) => setNewCrop({...newCrop, weightKg: e.target.value})} style={{ padding: '10px' }} />
                <input type="text" required placeholder="Sector" value={newCrop.sector} onChange={(e) => setNewCrop({...newCrop, sector: e.target.value})} style={{ padding: '10px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px' }}>Add Crop</button>
              </form>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>🌾 My Crop Inventory</h3>
              {myCrops.length === 0 ? <p>Your inventory is empty.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {myCrops.map(crop => (
                    <div key={crop.id} style={{ padding: '20px', borderLeft: '4px solid #4caf50', backgroundColor: '#fafafa' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>{crop.name}</h4>
                      <p><strong>Weight:</strong> {crop.weightKg} kgs</p>
                      <p><strong>Locked Rate:</strong> ₹{crop.ratePerKg.toFixed(2)} / kg</p>
                      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '18px' }}>₹{(crop.weightKg * crop.ratePerKg).toLocaleString('en-IN')}</strong>
                        <button onClick={() => handleDeleteCrop(crop.id)} style={{ color: 'red' }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROCUREMENT VIEW */}
        {activeTab === 'procurement' && !orderingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>🌾 Live Crop Market Prices</h3>
              <table style={{ width: '100%', textAlign: 'left' }}>
                <thead><tr><th>Crop Name</th><th>Live Rate</th><th>Action</th></tr></thead>
                <tbody>
                  {Object.keys(marketRates).map(crop => (
                    <tr key={crop}>
                      <td style={{ padding: '15px 0' }}><strong>{crop}</strong></td>
                      <td style={{ padding: '15px 0', color: '#2e7d32', fontWeight: 'bold' }}>₹{marketRates[crop].toFixed(2)} / kg</td>
                      <td><button onClick={() => setOrderingItem(crop)} style={{ padding: '8px 15px', backgroundColor: '#4caf50', color: 'white', borderRadius: '4px' }}>Sell to Market</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROCUREMENT FORM */}
        {activeTab === 'procurement' && orderingItem && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px' }}>
            <h3>Procurement Application: {orderingItem}</h3>
            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input type="number" required placeholder="Quantity (KGs)" value={orderDetails.quantity} onChange={(e) => setOrderDetails({...orderDetails, quantity: e.target.value})} style={{ padding: '10px' }} />
              <input type="text" required placeholder="Farm Location" value={orderDetails.location} onChange={(e) => setOrderDetails({...orderDetails, location: e.target.value})} style={{ padding: '10px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flexGrow: 1, padding: '12px', backgroundColor: '#2e7d32', color: 'white' }}>Confirm Order</button>
                <button type="button" onClick={() => setOrderingItem(null)} style={{ padding: '12px', backgroundColor: '#ccc' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* AI INSIGHTS VIEW */}
        {activeTab === 'ai' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
            <h3>🤖 FarmFlow AI Analysis</h3>
            <p>Market conditions suggest holding wheat sales for 2 weeks to maximize profit based on current trends.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;