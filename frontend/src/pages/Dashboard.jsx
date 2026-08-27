import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Simulated farming supplies for procurement
const farmingSupplies = {
  "Urea Fertilizer (45kg Bag)": 266.50,
  "Premium Wheat Seeds (40kg)": 3500.00
};

// Help Page Translations
const translations = {
  en: {
    title: "Help & Guide",
    intro: "Welcome to FarmFlow AI! Here is how to use your dashboard:",
    profile: "Profile: View your registered account details and status.",
    crops: "My Crops: Add your harvested crops, enter the weight, and see the estimated live market value.",
    procurement: "Procurement: View live fluctuating market rates. You can apply to sell your crops or buy farming supplies like fertilizers.",
    ai: "AI Insights: Read weekly AI-generated advice to maximize your farm's profit and health."
  },
  hi: {
    title: "सहायता और मार्गदर्शन",
    intro: "FarmFlow AI में आपका स्वागत है! यहाँ बताया गया है कि अपने डैशबोर्ड का उपयोग कैसे करें:",
    profile: "प्रोफ़ाइल: अपने पंजीकृत खाते का विवरण और स्थिति देखें।",
    crops: "मेरी फसलें: अपनी काटी गई फसलें जोड़ें, वजन दर्ज करें, और अनुमानित लाइव बाजार मूल्य देखें।",
    procurement: "खरीद (Procurement): लाइव बाजार दरें देखें। आप अपनी फसल बेचने या उर्वरक जैसी कृषि आपूर्ति खरीदने के लिए आवेदन कर सकते हैं।",
    ai: "एआई अंतर्दृष्टि (AI Insights): अपने खेत के मुनाफे और स्वास्थ्य को अधिकतम करने के लिए साप्ताहिक एआई-जनित सलाह पढ़ें।"
  },
  ta: {
    title: "உதவி மற்றும் வழிகாட்டி",
    intro: "FarmFlow AI-க்கு உங்களை வரவேற்கிறோம்! டாஷ்போர்டை எவ்வாறு பயன்படுத்துவது என்பது இங்கே:",
    profile: "சுயவிவரம்: உங்கள் பதிவு செய்யப்பட்ட கணக்கு விவரங்கள் மற்றும் நிலையைப் பார்க்கவும்.",
    crops: "என் பயிர்கள்: உங்கள் அறுவடை பயிர்களைச் சேர்க்கவும், எடையை உள்ளிடவும், மற்றும் நேரடி சந்தை மதிப்பை அறியவும்.",
    procurement: "கொள்முதல்: நேரடி சந்தை விலைகளை காணுங்கள். உங்கள் பயிர்களை விற்க அல்லது விவசாய பொருட்களை வாங்க விண்ணப்பிக்கலாம்.",
    ai: "AI ஆலோசனைகள்: உங்கள் பண்ணையின் லாபத்தை அதிகரிக்க வாராந்திர AI-அடிப்படையிலான ஆலோசனைகளைப் படியுங்கள்."
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [helpLang, setHelpLang] = useState('en'); // Default language is English
  
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
        const crops = Object.keys(newRates);
        const randomCrop = crops[Math.floor(Math.random() * crops.length)];
        const changePercent = (Math.random() * 0.04) - 0.02; 
        let newPrice = newRates[randomCrop] * (1 + changePercent);
        newRates[randomCrop] = Number(newPrice.toFixed(2));
        return newRates;
      });
    }, 4000); 

    return () => clearInterval(interval);
  }, []);

  // USER PROFILE
  const [userProfile, setUserProfile] = useState({ name: 'Farmer', email: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
  }, []);

  const [orderingItem, setOrderingItem] = useState(null);
  const [orderDetails, setOrderDetails] = useState({ location: '', datetime: '', quantity: '' });
  
  // CROP TRACKING (Removed Sector)
  const [myCrops, setMyCrops] = useState([]);
  const [newCrop, setNewCrop] = useState({ name: '', weightKg: '' });

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
    if (!newCrop.name || !newCrop.weightKg) return alert("Please fill in crop details.");
    
    const cropEntry = {
      id: Date.now(),
      name: newCrop.name,
      weightKg: parseFloat(newCrop.weightKg),
      ratePerKg: marketRates[newCrop.name]
    };
    setMyCrops([...myCrops, cropEntry]);
    setNewCrop({ name: '', weightKg: '' }); 
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
          <div onClick={() => {setActiveTab('help'); setOrderingItem(null);}} style={{ color: activeTab === 'help' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'help' ? 'bold' : 'normal', cursor: 'pointer', marginTop: '20px', borderTop: '1px solid #2e4d3a', paddingTop: '20px' }}>❓ Help / सहायता</div>
        </nav>
        <button onClick={handleLogout} style={{ padding: '12px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '32px' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
            </h1>
            <p style={{ color: '#7f8c8d', fontSize: '16px', marginTop: '8px' }}>
              Manage your smart farm operations seamlessly.
            </p>
          </div>
          <div style={{ padding: '10px 20px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontWeight: 'bold', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'green', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
            Live Market Active
          </div>
        </div>

        {/* HELP PAGE WITH MULTI-LANGUAGE SUPPORT */}
        {activeTab === 'help' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
              <h2 style={{ color: '#2e7d32', margin: 0 }}>{translations[helpLang].title}</h2>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setHelpLang('en')} style={{ padding: '8px 15px', backgroundColor: helpLang === 'en' ? '#2196f3' : '#f0f0f0', color: helpLang === 'en' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>English</button>
                <button onClick={() => setHelpLang('hi')} style={{ padding: '8px 15px', backgroundColor: helpLang === 'hi' ? '#2196f3' : '#f0f0f0', color: helpLang === 'hi' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>हिन्दी (Hindi)</button>
                <button onClick={() => setHelpLang('ta')} style={{ padding: '8px 15px', backgroundColor: helpLang === 'ta' ? '#2196f3' : '#f0f0f0', color: helpLang === 'ta' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>தமிழ் (Tamil)</button>
              </div>
            </div>

            <div style={{ fontSize: '18px', color: '#444', lineHeight: '1.8' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '20px', fontSize: '20px' }}>{translations[helpLang].intro}</p>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{translations[helpLang].profile}</li>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{translations[helpLang].crops}</li>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{translations[helpLang].procurement}</li>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{translations[helpLang].ai}</li>
              </ul>
            </div>
          </div>
        )}

        {/* DETAILED PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>User Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>Full Name:</span>
                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{userProfile.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>Email Address:</span>
                <span style={{ color: '#333' }}>{userProfile.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>Role:</span>
                <span style={{ color: '#333' }}>Farm Manager</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>Account Status:</span>
                <span style={{ color: 'green', fontWeight: 'bold' }}>Verified 🟢</span>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>🌤️ Weather</h3>
              <p>Clear skies expected. 10% rain chance.</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>🐛 Pest Alert</h3>
              <p>No active threats detected in your area.</p>
            </div>
          </div>
        )}

        {/* MY CROPS VIEW (Sector removed) */}
        {activeTab === 'crops' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>➕ Add New Crop Inventory</h3>
              <form onSubmit={handleAddCrop} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <select required value={newCrop.name} onChange={(e) => setNewCrop({...newCrop, name: e.target.value})} style={{ padding: '10px', flexGrow: 1, minWidth: '200px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <option value="">-- Select Major Indian Crop --</option>
                  {Object.keys(marketRates).map(crop => (
                    <option key={crop} value={crop}>{crop} (₹{marketRates[crop].toFixed(2)}/kg)</option>
                  ))}
                </select>
                <input type="number" min="1" required placeholder="Weight (KGs)" value={newCrop.weightKg} onChange={(e) => setNewCrop({...newCrop, weightKg: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', minWidth: '150px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Add Crop</button>
              </form>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>🌾 My Crop Inventory</h3>
              {myCrops.length === 0 ? <p style={{ fontStyle: 'italic', color: '#777' }}>Your inventory is currently empty.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {myCrops.map(crop => (
                    <div key={crop.id} style={{ padding: '20px', borderLeft: '4px solid #4caf50', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32', fontSize: '20px' }}>{crop.name}</h4>
                      <p style={{ margin: '5px 0' }}><strong>Weight:</strong> {crop.weightKg} kgs</p>
                      <p style={{ margin: '5px 0' }}><strong>Locked Rate:</strong> ₹{crop.ratePerKg.toFixed(2)} / kg</p>
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '18px' }}>₹{(crop.weightKg * crop.ratePerKg).toLocaleString('en-IN')}</strong>
                        <button onClick={() => handleDeleteCrop(crop.id)} style={{ padding: '6px 12px', backgroundColor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Remove</button>
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
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid #eee' }}><th style={{ padding: '15px 10px' }}>Crop Name</th><th style={{ padding: '15px 10px' }}>Live Rate</th><th style={{ padding: '15px 10px' }}>Action</th></tr></thead>
                <tbody>
                  {Object.keys(marketRates).map(crop => (
                    <tr key={crop} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px 10px' }}><strong>{crop}</strong></td>
                      <td style={{ padding: '15px 10px', color: '#2e7d32', fontWeight: 'bold' }}>₹{marketRates[crop].toFixed(2)} / kg</td>
                      <td style={{ padding: '15px 10px' }}><button onClick={() => setOrderingItem(crop)} style={{ padding: '8px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Sell to Market</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>🛒 Farming Supplies (Buy)</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '15px 10px' }}>Item Name</th>
                    <th style={{ padding: '15px 10px' }}>Current Price</th>
                    <th style={{ padding: '15px 10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(farmingSupplies).map(supply => (
                    <tr key={supply} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px 10px' }}><strong>{supply}</strong></td>
                      <td style={{ padding: '15px 10px' }}>₹{farmingSupplies[supply].toFixed(2)}</td>
                      <td style={{ padding: '15px 10px' }}>
                        <button onClick={() => setOrderingItem(supply)} style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Buy Supplies</button>
                      </td>
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
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Procurement Application</h3>
            <p style={{ color: '#777', marginBottom: '20px' }}>Applying for: <strong style={{ color: '#2e7d32', fontSize: '18px' }}>{orderingItem}</strong></p>
            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input type="number" required placeholder="Quantity (KGs / Bags)" value={orderDetails.quantity} onChange={(e) => setOrderDetails({...orderDetails, quantity: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              <input type="text" required placeholder="Farm Location" value={orderDetails.location} onChange={(e) => setOrderDetails({...orderDetails, location: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flexGrow: 1, padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Order</button>
                <button type="button" onClick={() => setOrderingItem(null)} style={{ padding: '12px', backgroundColor: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* AI INSIGHTS VIEW */}
        {activeTab === 'ai' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px' }}>🤖 FarmFlow AI Analysis</h3>
            <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>Weekly Insight Report generated:</p>
              <ul style={{ color: '#555', lineHeight: '1.8' }}>
                <li>Nitrogen levels in your fields may be dropping based on historical weather. Recommended to apply Urea by Thursday.</li>
                <li>Market conditions suggest holding wheat sales for 2 weeks to maximize profit based on current trends.</li>
                <li>Weather analysis shows low risk of pests for the next 7 days.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;