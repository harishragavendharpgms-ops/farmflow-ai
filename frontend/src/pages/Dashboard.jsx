import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Simulated farming supplies for procurement
const farmingSupplies = {
  "Urea Fertilizer (45kg Bag)": 266.50,
  "Premium Wheat Seeds (40kg)": 3500.00
};

const initialRates = {
  "Rice (Paddy)": 22.50, "Wheat": 25.00, "Maize (Corn)": 20.00,
  "Cotton": 70.00, "Sugarcane": 3.15, "Soybean": 46.00,
  "Mustard": 52.00, "Bajra (Pearl Millet)": 24.50, "Groundnut": 65.00,
  "Tur (Pigeon Pea)": 110.00, "Onion": 28.00, "Potato": 18.00
};

// Generate fake historical data so the graphs aren't empty on load
const generateInitialHistory = (rates) => {
  const history = {};
  Object.keys(rates).forEach(crop => {
    let current = rates[crop];
    const pastRates = [];
    for(let i=0; i<10; i++) {
      current = current * (1 + ((Math.random() * 0.06) - 0.03));
      pastRates.unshift(current); 
    }
    pastRates.push(rates[crop]); 
    history[crop] = pastRates;
  });
  return history;
};

// MINI GRAPH COMPONENT (No external libraries needed!)
const Sparkline = ({ data }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const isUp = data[data.length - 1] >= data[data.length - 2];
  const color = isUp ? '#4caf50' : '#f44336'; // Green if up, Red if down
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 80;
    const y = 24 - ((val - min) / range) * 20 - 2; 
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 80 24" style={{ width: '70px', height: '24px', overflow: 'visible' }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// TRANSLATIONS
const t = {
  en: {
    navDashboard: "📊 Dashboard", navProfile: "👤 My Profile", navCrops: "🌾 My Crops", navProcurement: "🛒 Procurement", navAi: "🤖 AI Insights", navHelp: "❓ Help", logout: "Log Out",
    module: "Module", subtitle: "Manage your smart farm operations seamlessly.", liveMarket: "Live Market Active",
    userDetails: "User Details", fullName: "Full Name:", emailAddr: "Email Address:", role: "Role:", farmManager: "Farm Manager", accountStatus: "Account Status:", verified: "Verified 🟢", editProfile: "Edit Profile Information",
    weather: "🌤️ Weather", weatherDesc: "Clear skies expected. 10% rain chance.", pestAlert: "🐛 Pest Alert", pestDesc: "No active threats detected in your area.",
    addCropTitle: "➕ Add New Crop Inventory", selectCrop: "-- Select Major Indian Crop --", weightKg: "Weight (KGs)", addCropBtn: "Add Crop", myCropInventory: "🌾 My Crop Inventory", emptyInventory: "Your inventory is currently empty.", lockedRate: "Locked Rate:", remove: "Remove",
    liveCropMarket: "🌾 Live Crop Market Prices", cropName: "Crop Name", liveRate: "Live Rate & Trend", action: "Action", sellMarket: "Sell to Market", farmingSuppliesTitle: "🛒 Farming Supplies (Buy)", itemName: "Item Name", currentPrice: "Current Price", buySupplies: "Buy Supplies",
    procurementApp: "Procurement Application", applyingFor: "Applying for:", quantity: "Quantity (KGs / Bags)", farmLocation: "Farm Location", prefDateTime: "Preferred Date & Time", confirmOrder: "Confirm Order", cancel: "Cancel",
    aiAnalysis: "🤖 FarmFlow AI Analysis", aiReport: "Weekly Insight Report generated:", aiTip1: "Nitrogen levels in your fields may be dropping. Recommended to apply Urea by Thursday.", aiTip2: "Market conditions suggest holding wheat sales for 2 weeks to maximize profit.", aiTip3: "Weather analysis shows low risk of pests for the next 7 days.",
    helpTitle: "Help & Guide", helpIntro: "Welcome to FarmFlow AI! Here is how to use your dashboard:", helpProfile: "Profile: View your registered account details and status.", helpCrops: "My Crops: Add your harvested crops, enter the weight, and see the estimated live market value.", helpProcurement: "Procurement: View live fluctuating market rates. You can apply to sell your crops or buy farming supplies.", helpAi: "AI Insights: Read weekly AI-generated advice to maximize your farm's profit and health."
  },
  // (Assuming identical translation objects for 'hi' and 'ta' as your previous code to save space, but kept structure identical)
  hi: { navDashboard: "📊 डैशबोर्ड", navProfile: "👤 मेरी प्रोफ़ाइल", navCrops: "🌾 मेरी फसलें", navProcurement: "🛒 खरीद", navAi: "🤖 एआई अंतर्दृष्टि", navHelp: "❓ सहायता", logout: "लॉग आउट", module: "मॉड्यूल", subtitle: "अपने स्मार्ट कृषि कार्यों को आसानी से प्रबंधित करें।", liveMarket: "लाइव मार्केट सक्रिय", userDetails: "उपयोगकर्ता विवरण", fullName: "पूरा नाम:", emailAddr: "ईमेल पता:", role: "भूमिका:", farmManager: "खेत प्रबंधक", accountStatus: "खाता स्थिति:", verified: "सत्यापित 🟢", editProfile: "प्रोफ़ाइल जानकारी संपादित करें", weather: "🌤️ मौसम", weatherDesc: "आसमान साफ रहने की उम्मीद है। बारिश की 10% संभावना।", pestAlert: "🐛 कीट चेतावनी", pestDesc: "आपके क्षेत्र में कोई सक्रिय खतरा नहीं पाया गया।", addCropTitle: "➕ नई फसल इन्वेंटरी जोड़ें", selectCrop: "-- भारतीय फसल चुनें --", weightKg: "वजन (किलो)", addCropBtn: "फसल जोड़ें", myCropInventory: "🌾 मेरी फसल इन्वेंटरी", emptyInventory: "आपकी इन्वेंटरी वर्तमान में खाली है।", lockedRate: "लॉक्ड दर:", remove: "हटाएं", liveCropMarket: "🌾 लाइव फसल बाजार मूल्य", cropName: "फसल का नाम", liveRate: "लाइव दर और रुझान", action: "कार्रवाई", sellMarket: "बाजार में बेचें", farmingSuppliesTitle: "🛒 कृषि आपूर्ति (खरीदें)", itemName: "वस्तु का नाम", currentPrice: "वर्तमान मूल्य", buySupplies: "आपूर्ति खरीदें", procurementApp: "खरीद आवेदन", applyingFor: "इसके लिए आवेदन:", quantity: "मात्रा (किलो / बैग)", farmLocation: "खेत का स्थान", prefDateTime: "पसंदीदा तिथि और समय", confirmOrder: "ऑर्डर की पुष्टि करें", cancel: "रद्द करें", aiAnalysis: "🤖 FarmFlow AI विश्लेषण", aiReport: "साप्ताहिक अंतर्दृष्टि रिपोर्ट जनरेट की गई:", aiTip1: "आपके खेतों में नाइट्रोजन का स्तर गिर सकता है। गुरुवार तक यूरिया लगाने की सलाह दी जाती है।", aiTip2: "बाजार की स्थिति अधिकतम लाभ के लिए गेहूं की बिक्री 2 सप्ताह तक रोकने का सुझाव देती है।", aiTip3: "मौसम विश्लेषण अगले 7 दिनों तक कीटों के कम जोखिम को दर्शाता है।", helpTitle: "सहायता और मार्गदर्शन", helpIntro: "FarmFlow AI में आपका स्वागत है! यहाँ बताया गया है कि अपने डैशबोर्ड का उपयोग कैसे करें:", helpProfile: "प्रोफ़ाइल: अपने पंजीकृत खाते का विवरण और स्थिति देखें।", helpCrops: "मेरी फसलें: अपनी काटी गई फसलें जोड़ें, वजन दर्ज करें, और अनुमानित लाइव बाजार मूल्य देखें।", helpProcurement: "खरीद: लाइव बाजार दरें देखें। आप अपनी फसल बेचने या कृषि आपूर्ति खरीदने के लिए आवेदन कर सकते हैं।", helpAi: "एआई अंतर्दृष्टि: अपने खेत के मुनाफे को अधिकतम करने के लिए एआई-जनित सलाह पढ़ें।" },
  ta: { navDashboard: "📊 டாஷ்போர்டு", navProfile: "👤 என் சுயவிவரம்", navCrops: "🌾 என் பயிர்கள்", navProcurement: "🛒 கொள்முதல்", navAi: "🤖 AI ஆலோசனைகள்", navHelp: "❓ உதவி", logout: "வெளியேறு", module: "பிரிவு", subtitle: "உங்கள் பண்ணை செயல்பாடுகளை எளிதாக நிர்வகிக்கவும்.", liveMarket: "நேரடி சந்தை செயலில் உள்ளது", userDetails: "பயனர் விவரங்கள்", fullName: "முழு பெயர்:", emailAddr: "மின்னஞ்சல்:", role: "பங்கு:", farmManager: "பண்ணை மேலாளர்", accountStatus: "கணக்கு நிலை:", verified: "சரிபார்க்கப்பட்டது 🟢", editProfile: "சுயவிவரத்தைத் திருத்துக", weather: "🌤️ வானிலை", weatherDesc: "தெளிவான வானம். 10% மழை வாய்ப்பு.", pestAlert: "🐛 பூச்சி எச்சரிக்கை", pestDesc: "உங்கள் பகுதியில் எந்த அச்சுறுத்தலும் இல்லை.", addCropTitle: "➕ புதிய பயிர் சேர்ப்பது", selectCrop: "-- இந்திய பயிரைத் தேர்ந்தெடுக்கவும் --", weightKg: "எடை (கிலோ)", addCropBtn: "பயிரைச் சேர்", myCropInventory: "🌾 என் பயிர் இருப்பு", emptyInventory: "உங்கள் இருப்பு காலியாக உள்ளது.", lockedRate: "பூட்டப்பட்ட விலை:", remove: "நீக்கு", liveCropMarket: "🌾 நேரடி பயிர் சந்தை விலைகள்", cropName: "பயிர் பெயர்", liveRate: "நேரடி விலை & போக்கு", action: "செயல்", sellMarket: "சந்தையில் விற்க", farmingSuppliesTitle: "🛒 விவசாய பொருட்கள் (வாங்க)", itemName: "பொருள் பெயர்", currentPrice: "தற்போதைய விலை", buySupplies: "வாங்கு", procurementApp: "கொள்முதல் விண்ணப்பம்", applyingFor: "விண்ணப்பிப்பது:", quantity: "அளவு (கிலோ / பைகள்)", farmLocation: "பண்ணை இடம்", prefDateTime: "தேதி மற்றும் நேரம்", confirmOrder: "உறுதி செய்", cancel: "ரத்து செய்", aiAnalysis: "🤖 FarmFlow AI பகுப்பாய்வு", aiReport: "வாராந்திர அறிக்கை:", aiTip1: "நைட்ரஜன் அளவுகள் குறையக்கூடும். வியாழக்கிழமைக்குள் யூரியா பயன்படுத்த பரிந்துரைக்கப்படுகிறது.", aiTip2: "லாபத்தை அதிகரிக்க கோதுமை விற்பனையை 2 வாரங்களுக்கு தாமதப்படுத்தவும்.", aiTip3: "அடுத்த 7 நாட்களுக்கு பூச்சிகள் தாக்கும் அபாயம் குறைவு.", helpTitle: "உதவி மற்றும் வழிகாட்டி", helpIntro: "FarmFlow AI-க்கு உங்களை வரவேற்கிறோம்! டாஷ்போர்டை எவ்வாறு பயன்படுத்துவது:", helpProfile: "சுயவிவரம்: உங்கள் கணக்கு விவரங்கள் மற்றும் நிலையைப் பார்க்கவும்.", helpCrops: "என் பயிர்கள்: உங்கள் அறுவடை பயிர்களைச் சேர்க்கவும், நேரடி சந்தை மதிப்பை அறியவும்.", helpProcurement: "கொள்முதல்: நேரடி சந்தை விலைகளை காணுங்கள். விற்க அல்லது வாங்க விண்ணப்பிக்கலாம்.", helpAi: "AI ஆலோசனைகள்: லாபத்தை அதிகரிக்க AI ஆலோசனைகளைப் படியுங்கள்." }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('en'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const l = t[lang];

  const [marketRates, setMarketRates] = useState(initialRates);
  const [marketHistory, setMarketHistory] = useState(() => generateInitialHistory(initialRates));

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRates(prevRates => {
        const newRates = { ...prevRates };
        const crops = Object.keys(newRates);
        const randomCrop = crops[Math.floor(Math.random() * crops.length)];
        const changePercent = (Math.random() * 0.04) - 0.02; 
        let newPrice = newRates[randomCrop] * (1 + changePercent);
        newRates[randomCrop] = Number(newPrice.toFixed(2));
        
        // Update the graph history
        setMarketHistory(prevHistory => {
          const updatedHistory = { ...prevHistory };
          const cropHistory = [...updatedHistory[randomCrop]];
          cropHistory.push(newRates[randomCrop]);
          if (cropHistory.length > 15) cropHistory.shift(); // Keep only the last 15 points
          updatedHistory[randomCrop] = cropHistory;
          return updatedHistory;
        });

        return newRates;
      });
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  const [userProfile, setUserProfile] = useState({ name: 'Farmer', email: '' });
  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
  }, []);

  const [orderingItem, setOrderingItem] = useState(null);
  const [orderDetails, setOrderDetails] = useState({ location: '', datetime: '', quantity: '' });
  const [myCrops, setMyCrops] = useState([]);
  const [newCrop, setNewCrop] = useState({ name: '', weightKg: '' });

  const handleLogout = () => { localStorage.removeItem('farmflow_user'); navigate('/login'); };

  const submitOrder = (e) => {
    e.preventDefault();
    alert(`Success! Application submitted for ${orderDetails.quantity}kg of ${orderingItem}.`);
    setOrderingItem(null); 
    setOrderDetails({ location: '', datetime: '', quantity: '' });
  };

  const handleAddCrop = (e) => {
    e.preventDefault();
    if (!newCrop.name || !newCrop.weightKg) return;
    const cropEntry = { id: Date.now(), name: newCrop.name, weightKg: parseFloat(newCrop.weightKg), ratePerKg: marketRates[newCrop.name] };
    setMyCrops([...myCrops, cropEntry]);
    setNewCrop({ name: '', weightKg: '' }); 
  };

  const handleDeleteCrop = (idToRemove) => setMyCrops(myCrops.filter(c => c.id !== idToRemove));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* COLLAPSIBLE SIDEBAR */}
      <div style={{ 
          width: isSidebarOpen ? '250px' : '0px', 
          padding: isSidebarOpen ? '30px 20px' : '30px 0px',
          opacity: isSidebarOpen ? 1 : 0,
          overflow: 'hidden', 
          transition: 'all 0.3s ease',
          backgroundColor: '#1e392a', 
          color: 'white', 
          display: 'flex', 
          flexDirection: 'column',
          whiteSpace: 'nowrap'
        }}>
        <h2 style={{ color: '#4caf50', margin: '0 0 40px 0', fontSize: '24px' }}>🌱 FarmFlow AI</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
          <div onClick={() => {setActiveTab('dashboard'); setOrderingItem(null);}} style={{ color: activeTab === 'dashboard' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navDashboard}</div>
          <div onClick={() => {setActiveTab('profile'); setOrderingItem(null);}} style={{ color: activeTab === 'profile' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navProfile}</div>
          <div onClick={() => {setActiveTab('crops'); setOrderingItem(null);}} style={{ color: activeTab === 'crops' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'crops' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navCrops}</div>
          <div onClick={() => setActiveTab('procurement')} style={{ color: activeTab === 'procurement' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'procurement' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navProcurement}</div>
          <div onClick={() => {setActiveTab('ai'); setOrderingItem(null);}} style={{ color: activeTab === 'ai' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'ai' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navAi}</div>
          <div onClick={() => {setActiveTab('help'); setOrderingItem(null);}} style={{ color: activeTab === 'help' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'help' ? 'bold' : 'normal', cursor: 'pointer', marginTop: '20px', borderTop: '1px solid #2e4d3a', paddingTop: '20px' }}>{l.navHelp}</div>
        </nav>
        <button onClick={handleLogout} style={{ padding: '12px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{l.logout}</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '40px', transition: 'all 0.3s ease' }}>
        
        {/* GLOBAL HEADER WITH TOGGLE AND LANGUAGE SELECTOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #e0e0e0', paddingBottom: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              style={{ fontSize: '30px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#2c3e50', padding: '0', display: 'flex', alignItems: 'center' }}
            >
              ☰
            </button>
            
            <div>
              <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '32px' }}>
                {activeTab === 'profile' ? l.navProfile.substring(2) : activeTab === 'help' ? l.navHelp.substring(2) : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} {l.module}
              </h1>
              <p style={{ color: '#7f8c8d', fontSize: '16px', margin: '8px 0 0 0' }}>{l.subtitle}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px', backgroundColor: 'white', padding: '5px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <button onClick={() => setLang('en')} style={{ padding: '5px 10px', backgroundColor: lang === 'en' ? '#2196f3' : 'transparent', color: lang === 'en' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>EN</button>
              <button onClick={() => setLang('hi')} style={{ padding: '5px 10px', backgroundColor: lang === 'hi' ? '#2196f3' : 'transparent', color: lang === 'hi' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>HI</button>
              <button onClick={() => setLang('ta')} style={{ padding: '5px 10px', backgroundColor: lang === 'ta' ? '#2196f3' : 'transparent', color: lang === 'ta' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>TA</button>
            </div>

            <div style={{ padding: '10px 20px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontWeight: 'bold', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'green', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
              {l.liveMarket}
            </div>
          </div>
        </div>

        {/* HELP PAGE */}
        {activeTab === 'help' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
            <h2 style={{ color: '#2e7d32', margin: '0 0 20px 0', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>{l.helpTitle}</h2>
            <div style={{ fontSize: '18px', color: '#444', lineHeight: '1.8' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '20px', fontSize: '20px' }}>{l.helpIntro}</p>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpProfile}</li>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpCrops}</li>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpProcurement}</li>
                <li style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpAi}</li>
              </ul>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{l.userDetails}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>{l.fullName}</span><span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{userProfile.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>{l.emailAddr}</span><span style={{ color: '#333' }}>{userProfile.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>{l.role}</span><span style={{ color: '#333' }}>{l.farmManager}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#555' }}>{l.accountStatus}</span><span style={{ color: 'green', fontWeight: 'bold' }}>{l.verified}</span>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>{l.weather}</h3><p>{l.weatherDesc}</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>{l.pestAlert}</h3><p>{l.pestDesc}</p>
            </div>
          </div>
        )}

        {/* MY CROPS VIEW */}
        {activeTab === 'crops' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>{l.addCropTitle}</h3>
              <form onSubmit={handleAddCrop} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <select required value={newCrop.name} onChange={(e) => setNewCrop({...newCrop, name: e.target.value})} style={{ padding: '10px', flexGrow: 1, minWidth: '200px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <option value="">{l.selectCrop}</option>
                  {Object.keys(marketRates).map(crop => <option key={crop} value={crop}>{crop} (₹{marketRates[crop].toFixed(2)}/kg)</option>)}
                </select>
                <input type="number" min="1" required placeholder={l.weightKg} value={newCrop.weightKg} onChange={(e) => setNewCrop({...newCrop, weightKg: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', minWidth: '150px' }} />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{l.addCropBtn}</button>
              </form>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px' }}>{l.myCropInventory}</h3>
              {myCrops.length === 0 ? <p style={{ fontStyle: 'italic', color: '#777' }}>{l.emptyInventory}</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {myCrops.map(crop => (
                    <div key={crop.id} style={{ padding: '20px', borderLeft: '4px solid #4caf50', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32', fontSize: '20px' }}>{crop.name}</h4>
                      <p style={{ margin: '5px 0' }}><strong>{l.weightKg}:</strong> {crop.weightKg} kgs</p>
                      <p style={{ margin: '5px 0' }}><strong>{l.lockedRate}</strong> ₹{crop.ratePerKg.toFixed(2)} / kg</p>
                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '18px' }}>₹{(crop.weightKg * crop.ratePerKg).toLocaleString('en-IN')}</strong>
                        <button onClick={() => handleDeleteCrop(crop.id)} style={{ padding: '6px 12px', backgroundColor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{l.remove}</button>
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
              <h3 style={{ marginBottom: '20px' }}>{l.liveCropMarket}</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid #eee' }}><th style={{ padding: '15px 10px' }}>{l.cropName}</th><th style={{ padding: '15px 10px' }}>{l.liveRate}</th><th style={{ padding: '15px 10px' }}>{l.action}</th></tr></thead>
                <tbody>
                  {Object.keys(marketRates).map(crop => (
                    <tr key={crop} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px 10px' }}><strong>{crop}</strong></td>
                      
                      {/* NEW LIVE RATE AND MINI GRAPH COLUMN */}
                      <td style={{ padding: '15px 10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: '#2e7d32', fontWeight: 'bold', minWidth: '90px' }}>₹{marketRates[crop].toFixed(2)} / kg</span>
                        <Sparkline data={marketHistory[crop]} />
                      </td>
                      
                      <td style={{ padding: '15px 10px' }}><button onClick={() => setOrderingItem(crop)} style={{ padding: '8px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{l.sellMarket}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>{l.farmingSuppliesTitle}</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '2px solid #eee' }}><th style={{ padding: '15px 10px' }}>{l.itemName}</th><th style={{ padding: '15px 10px' }}>{l.currentPrice}</th><th style={{ padding: '15px 10px' }}>{l.action}</th></tr></thead>
                <tbody>
                  {Object.keys(farmingSupplies).map(supply => (
                    <tr key={supply} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px 10px' }}><strong>{supply}</strong></td>
                      <td style={{ padding: '15px 10px' }}>₹{farmingSupplies[supply].toFixed(2)}</td>
                      <td style={{ padding: '15px 10px' }}><button onClick={() => setOrderingItem(supply)} style={{ padding: '8px 15px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{l.buySupplies}</button></td>
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
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>{l.procurementApp}</h3>
            <p style={{ color: '#777', marginBottom: '20px' }}>{l.applyingFor} <strong style={{ color: '#2e7d32', fontSize: '18px' }}>{orderingItem}</strong></p>
            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input type="number" required placeholder={l.quantity} value={orderDetails.quantity} onChange={(e) => setOrderDetails({...orderDetails, quantity: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              <input type="text" required placeholder={l.farmLocation} value={orderDetails.location} onChange={(e) => setOrderDetails({...orderDetails, location: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flexGrow: 1, padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{l.confirmOrder}</button>
                <button type="button" onClick={() => setOrderingItem(null)} style={{ padding: '12px', backgroundColor: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{l.cancel}</button>
              </div>
            </form>
          </div>
        )}

        {/* AI INSIGHTS VIEW */}
        {activeTab === 'ai' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '20px' }}>{l.aiAnalysis}</h3>
            <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>{l.aiReport}</p>
              <ul style={{ color: '#555', lineHeight: '1.8' }}>
                <li>{l.aiTip1}</li>
                <li>{l.aiTip2}</li>
                <li>{l.aiTip3}</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;