import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const initialRates = { "Rice (Paddy)": 22.50, "Wheat": 25.00, "Maize (Corn)": 20.00, "Cotton": 70.00, "Sugarcane": 3.15, "Soybean": 46.00, "Mustard": 52.00, "Bajra (Pearl Millet)": 24.50, "Groundnut": 65.00, "Tur (Pigeon Pea)": 110.00, "Onion": 28.00, "Potato": 18.00 };

const generateInitialHistory = (rates) => {
  const history = {};
  Object.keys(rates).forEach(crop => {
    let current = rates[crop];
    const pastRates = [];
    for(let i=0; i<10; i++) { current = current * (1 + ((Math.random() * 0.06) - 0.03)); pastRates.unshift(current); }
    pastRates.push(rates[crop]); history[crop] = pastRates;
  });
  return history;
};

const Sparkline = ({ data }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const isUp = data[data.length - 1] >= data[data.length - 2];
  const points = data.map((val, i) => `${(i / (data.length - 1)) * 80},${24 - ((val - min) / range) * 20 - 2}`).join(' ');
  return (
    <svg viewBox="0 0 80 24" style={{ width: '70px', height: '24px', overflow: 'visible' }}>
      <polyline fill="none" stroke={isUp ? '#4caf50' : '#f44336'} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const t = {
  en: { navDashboard: "📊 Dashboard", navProfile: "👤 My Profile", navCrops: "🌾 My Crops", navProcurement: "🛒 Procurement", navAi: "🤖 AI Insights", navHelp: "❓ Help", logout: "Log Out", module: "Module", subtitle: "Manage your smart farm operations seamlessly.", liveMarket: "Live Market Active", userDetails: "User Details", fullName: "Full Name:", emailAddr: "Email Address:", phoneNumber: "Phone Number:", role: "Role:", farmManager: "Farmer", accountStatus: "Account Status:", verified: "Verified 🟢", weather: "🌤️ Local Weather", pestAlert: "🐛 Pest Alert", pestDesc: "No active threats detected in your area.", addCropTitle: "➕ Add New Crop Inventory", selectCrop: "-- Select Major Indian Crop --", weightKg: "Weight (KGs)", addCropBtn: "Add Crop", myCropInventory: "🌾 My Crop Inventory", emptyInventory: "Your inventory is currently empty.", lockedRate: "Locked Rate:", remove: "Remove", liveCropMarket: "🌾 Live Crop Market Prices", cropName: "Crop Name", pastRates: "Past Rates", liveRate: "Live Rate & Trend", action: "Action", sellMarket: "Sell to Market", procurementApp: "Procurement Application", applyingFor: "Applying for:", quantity: "Quantity (KGs / Bags)", selectZone: "-- Select Active Zone --", selectSubPlace: "-- Select Sub-Place / Village --", farmAddress: "Specific Farm Address", pattaChitta: "Patta / Chitta Document Number", uploadDoc: "Upload Patta/Chitta (JPG/PDF, Max 500KB)", confirmOrder: "Submit to VAO", cancel: "Cancel", upcomingProcurements: "📦 Upcoming Procurements", noActiveOrders: "No active orders at the moment.", aiAnalysis: "🤖 AI Analysis", aiReport: "Weekly Insight Report generated:", aiTip1: "Nitrogen levels in your fields may be dropping. Recommended to apply Urea by Thursday.", aiTip2: "Market conditions suggest holding wheat sales for 2 weeks to maximize profit.", aiTip3: "Weather analysis shows low risk of pests for the next 7 days.", helpTitle: "Help & Guide", helpIntro: "Welcome to FarmFlow AI! Here is how to use your dashboard:", helpProfile: "Profile: View your registered account details and status.", helpCrops: "My Crops: Add your harvested crops, enter the weight, and see the estimated live market value.", helpProcurement: "Procurement: View live fluctuating market rates. You can apply to sell your crops or buy farming supplies.", helpAi: "AI Insights: Read weekly AI-generated advice to maximize your farm's profit and health." },
  hi: { navDashboard: "📊 डैशबोर्ड", navProfile: "👤 मेरी प्रोफ़ाइल", navCrops: "🌾 मेरी फसलें", navProcurement: "🛒 खरीद", navAi: "🤖 एआई अंतर्दृष्टि", navHelp: "❓ सहायता", logout: "लॉग आउट", module: "मॉड्यूल", subtitle: "अपने स्मार्ट कृषि कार्यों को आसानी से प्रबंधित करें।", liveMarket: "लाइव मार्केट सक्रिय", userDetails: "उपयोगकर्ता विवरण", fullName: "पूरा नाम:", emailAddr: "ईमेल पता:", phoneNumber: "फ़ोन नंबर:", role: "भूमिका:", farmManager: "किसान", accountStatus: "खाता स्थिति:", verified: "सत्यापित 🟢", weather: "🌤️ स्थानीय मौसम", pestAlert: "🐛 कीट चेतावनी", pestDesc: "आपके क्षेत्र में कोई सक्रिय खतरा नहीं पाया गया।", addCropTitle: "➕ नई फसल इन्वेंटरी जोड़ें", selectCrop: "-- भारतीय फसल चुनें --", weightKg: "वजन (किलो)", addCropBtn: "फसल जोड़ें", myCropInventory: "🌾 मेरी फसल इन्वेंटरी", emptyInventory: "आपकी इन्वेंटरी वर्तमान में खाली है।", lockedRate: "लॉक्ड दर:", remove: "हटाएं", liveCropMarket: "🌾 लाइव फसल बाजार मूल्य", cropName: "फसल का नाम", pastRates: "पिछली दरें", liveRate: "लाइव दर और रुझान", action: "कार्रवाई", sellMarket: "बाजार में बेचें", procurementApp: "खरीद आवेदन", applyingFor: "इसके लिए आवेदन:", quantity: "मात्रा (किलो / बैग)", selectZone: "-- सक्रिय ज़ोन चुनें --", selectSubPlace: "-- उप-स्थान चुनें --", farmAddress: "विशिष्ट खेत का पता", pattaChitta: "पट्टा / चिट्टा दस्तावेज़ संख्या", uploadDoc: "पट्टा/चिट्टा अपलोड करें (JPG/PDF, Max 500KB)", confirmOrder: "VAO को सबमिट करें", cancel: "रद्द करें", upcomingProcurements: "📦 आगामी खरीद", noActiveOrders: "इस समय कोई सक्रिय आदेश नहीं है।", aiAnalysis: "🤖 AI विश्लेषण", aiReport: "साप्ताहिक अंतर्दृष्टि रिपोर्ट जनरेट की गई:", aiTip1: "आपके खेतों में नाइट्रोजन का स्तर गिर सकता है। गुरुवार तक यूरिया लगाने की सलाह दी जाती है।", aiTip2: "बाजार की स्थिति अधिकतम लाभ के लिए गेहूं की बिक्री 2 सप्ताह तक रोकने का सुझाव देती है।", aiTip3: "मौसम विश्लेषण अगले 7 दिनों तक कीटों के कम जोखिम को दर्शाता है।", helpTitle: "सहायता और मार्गदर्शन", helpIntro: "FarmFlow AI में आपका स्वागत है! यहाँ बताया गया है कि अपने डैशबोर्ड का उपयोग कैसे करें:", helpProfile: "प्रोफ़ाइल: अपने पंजीकृत खाते का विवरण और स्थिति देखें।", helpCrops: "मेरी फसलें: अपनी काटी गई फसलें जोड़ें, वजन दर्ज करें, और अनुमानित लाइव बाजार मूल्य देखें।", helpProcurement: "खरीद: लाइव बाजार दरें देखें। आप अपनी फसल बेचने या कृषि आपूर्ति खरीदने के लिए आवेदन कर सकते हैं।", helpAi: "एआई अंतर्दृष्टि: अपने खेत के मुनाफे को अधिकतम करने के लिए एआई-जनित सलाह पढ़ें।" },
  ta: { navDashboard: "📊 டாஷ்போர்டு", navProfile: "👤 என் சுயவிவரம்", navCrops: "🌾 என் பயிர்கள்", navProcurement: "🛒 கொள்முதல்", navAi: "🤖 AI ஆலோசனைகள்", navHelp: "❓ உதவி", logout: "வெளியேறு", module: "பிரிவு", subtitle: "உங்கள் பண்ணை செயல்பாடுகளை எளிதாக நிர்வகிக்கவும்.", liveMarket: "நேரடி சந்தை செயலில் உள்ளது", userDetails: "பயனர் விவரங்கள்", fullName: "முழு பெயர்:", emailAddr: "மின்னஞ்சல்:", phoneNumber: "தொலைபேசி எண்:", role: "பங்கு:", farmManager: "விவசாயி", accountStatus: "கணக்கு நிலை:", verified: "சரிபார்க்கப்பட்டது 🟢", weather: "🌤️ உள்ளூர் வானிலை", pestAlert: "🐛 பூச்சி எச்சரிக்கை", pestDesc: "உங்கள் பகுதியில் எந்த அச்சுறுத்தலும் இல்லை.", addCropTitle: "➕ புதிய பயிர் சேர்ப்பது", selectCrop: "-- இந்திய பயிரைத் தேர்ந்தெடுக்கவும் --", weightKg: "எடை (கிலோ)", addCropBtn: "பயிரைச் சேர்", myCropInventory: "🌾 என் பயிர் இருப்பு", emptyInventory: "உங்கள் இருப்பு காலியாக உள்ளது.", lockedRate: "பூட்டப்பட்ட விலை:", remove: "நீக்கு", liveCropMarket: "🌾 நேரடி பயிர் சந்தை விலைகள்", cropName: "பயிர் பெயர்", pastRates: "கடந்த விலைகள்", liveRate: "நேரடி விலை & போக்கு", action: "செயல்", sellMarket: "சந்தையில் விற்க", procurementApp: "கொள்முதல் விண்ணப்பம்", applyingFor: "விண்ணப்பிப்பது:", quantity: "அளவு (கிலோ / பைகள்)", selectZone: "-- மண்டலத்தைத் தேர்ந்தெடுக்கவும் --", selectSubPlace: "-- கிராமத்தைத் தேர்ந்தெடுக்கவும் --", farmAddress: "குறிப்பிட்ட பண்ணை முகவரி", pattaChitta: "பட்டா / சிட்டா ஆவண எண்", uploadDoc: "பட்டா/சிட்டாவை பதிவேற்றவும் (JPG/PDF, Max 500KB)", confirmOrder: "VAO க்கு சமர்ப்பிக்கவும்", cancel: "ரத்து செய்", upcomingProcurements: "📦 வரவிருக்கும் கொள்முதல்", noActiveOrders: "தற்போது எந்த ஆர்டரும் இல்லை.", aiAnalysis: "🤖 AI பகுப்பாய்வு", aiReport: "வாராந்திர அறிக்கை:", aiTip1: "நைட்ரஜன் அளவுகள் குறையக்கூடும். வியாழக்கிழமைக்குள் யூரியா பயன்படுத்த பரிந்துரைக்கப்படுகிறது.", aiTip2: "லாபத்தை அதிகரிக்க கோதுமை விற்பனையை 2 வாரங்களுக்கு தாமதப்படுத்தவும்.", aiTip3: "அடுத்த 7 நாட்களுக்கு பூச்சிகள் தாக்கும் அபாயம் குறைவு.", helpTitle: "உதவி மற்றும் வழிகாட்டி", helpIntro: "FarmFlow AI-க்கு உங்களை வரவேற்கிறோம்! டாஷ்போர்டை எவ்வாறு பயன்படுத்துவது:", helpProfile: "சுயவிவரம்: உங்கள் கணக்கு விவரங்கள் மற்றும் நிலையைப் பார்க்கவும்.", helpCrops: "என் பயிர்கள்: உங்கள் அறுவடை பயிர்களைச் சேர்க்கவும், நேரடி சந்தை மதிப்பை அறியவும்.", helpProcurement: "கொள்முதல்: நேரடி சந்தை விலைகளை காணுங்கள். விற்க அல்லது வாங்க விண்ணப்பிக்கலாம்.", helpAi: "AI ஆலோசனைகள்: லாபத்தை அதிகரிக்க AI ஆலோசனைகளைப் படியுங்கள்." }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('en'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const l = t[lang];

  const [marketRates, setMarketRates] = useState(initialRates);
  const [marketHistory, setMarketHistory] = useState(() => generateInitialHistory(initialRates));
  const [activeOrders, setActiveOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', email: '', phone: '' });
  const [vaoUsers, setVaoUsers] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [availableSubPlaces, setAvailableSubPlaces] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weatherData, setWeatherData] = useState({ temp: '--', condition: 'Fetching location weather...', locationName: 'Detecting location...' });

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user') || sessionStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation`);
            const weatherJson = await weatherRes.json();
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const geoJson = await geoRes.json();
            const locationString = geoJson.address.city || geoJson.address.town || geoJson.address.village || geoJson.address.state || "Your Location";

            const code = weatherJson.current.weather_code;
            let conditionText = "Clear skies";
            if (code > 0 && code < 4) conditionText = "Partly cloudy";
            else if (code >= 45 && code < 50) conditionText = "Foggy / Misty";
            else if (code >= 50 && code < 80) conditionText = "Rain expected";
            else if (code >= 80) conditionText = "Heavy rain / Storms";

            setWeatherData({
              temp: `${weatherJson.current.temperature_2m}°C`,
              condition: `${locationString}: ${conditionText}. Humidity: ${weatherJson.current.relative_humidity_2m}%`,
              locationName: locationString
            });
          } catch (err) {
            setWeatherData({ temp: '--', condition: 'Unable to load live weather.', locationName: 'GPS Error' });
          }
        },
        (error) => {
          setWeatherData({ temp: 'N/A', condition: 'Location permission denied. Enable GPS to view local weather.', locationName: 'Location Disabled' });
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchVAOs = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', 'in', ['vao', 'officer']));
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVaoUsers(usersList);
        const zones = usersList.map(v => v.zone).filter(Boolean);
        setAvailableZones([...new Set(zones)]);
      } catch (error) { console.error("Error fetching locations: ", error); }
    };
    fetchVAOs();
  }, []);

  const handleZoneChange = (zone) => {
    setOrderDetails(prev => ({ ...prev, zone, subPlace: '' }));
    const matchingUsers = vaoUsers.filter(v => v.zone === zone);
    const subPlaces = matchingUsers.map(v => 
      v.subPlace || v.sub_place || v.subZone || v.sub_zone || v.village || v.location
    ).filter(Boolean);
    setAvailableSubPlaces([...new Set(subPlaces)]);
  };

  useEffect(() => {
    if (!userProfile.email) return;
    const qOrders = query(collection(db, 'orders'), where('userEmail', '==', userProfile.email));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setActiveOrders(ordersData);
    });
    const qCrops = query(collection(db, 'crops'), where('userEmail', '==', userProfile.email));
    const unsubCrops = onSnapshot(qCrops, (snapshot) => {
      const cropsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyCrops(cropsData);
    });
    return () => { unsubOrders(); unsubCrops(); };
  }, [userProfile.email]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRates(prevRates => {
        const newRates = { ...prevRates };
        const crops = Object.keys(newRates);
        const randomCrop = crops[Math.floor(Math.random() * crops.length)];
        newRates[randomCrop] = Number((newRates[randomCrop] * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2));
        setMarketHistory(prev => {
          const updated = { ...prev };
          updated[randomCrop] = [...updated[randomCrop], newRates[randomCrop]].slice(-15);
          return updated;
        });
        return newRates;
      });
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  const [orderingItem, setOrderingItem] = useState(null);
  const [orderDetails, setOrderDetails] = useState({ zone: '', subPlace: '', address: '', quantity: '', pattaChitta: '' });
  const [pattaFile, setPattaFile] = useState(null);
  const [myCrops, setMyCrops] = useState([]);
  const [newCrop, setNewCrop] = useState({ name: '', weightKg: '' });

  const handleLogout = () => { 
    localStorage.removeItem('farmflow_user'); 
    sessionStorage.removeItem('farmflow_user'); 
    navigate('/login'); 
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (pattaFile && pattaFile.size > 500 * 1024) {
      alert("File is too large! Please upload an image under 500KB.");
      return; 
    }
    setIsSubmitting(true);
    try {
      let fileDataString = '';
      if (pattaFile) {
        const reader = new FileReader();
        fileDataString = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(pattaFile);
        });
      }
      await addDoc(collection(db, 'orders'), {
        userName: userProfile.name || 'Unknown',
        userPhone: userProfile.phone || 'N/A',
        userEmail: userProfile.email,
        item: orderingItem, 
        quantity: orderDetails.quantity, 
        zone: orderDetails.zone, 
        subPlace: orderDetails.subPlace,
        address: orderDetails.address,
        pattaChitta: orderDetails.pattaChitta,
        documentUrl: fileDataString, 
        datetime: 'TBD by Officer', 
        status: 'Pending VAO', 
        createdAt: new Date().toISOString()
      });
      alert(`Success! Application sent to VAO in ${orderDetails.zone} (${orderDetails.subPlace}).`);
      setOrderingItem(null); 
      setOrderDetails({ zone: '', subPlace: '', address: '', quantity: '', pattaChitta: '' });
      setPattaFile(null);
    } catch (error) {
      alert("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    if (!newCrop.name || !newCrop.weightKg) return;
    try {
      await addDoc(collection(db, 'crops'), {
        userEmail: userProfile.email,
        name: newCrop.name,
        weightKg: parseFloat(newCrop.weightKg),
        ratePerKg: marketRates[newCrop.name],
        createdAt: new Date().toISOString()
      });
      setNewCrop({ name: '', weightKg: '' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteCrop = async (idToRemove) => {
    try { await deleteDoc(doc(db, 'crops', idToRemove)); } catch (err) { console.error(err); }
  };

  const savedCropData = myCrops.find(c => c.name === orderingItem);
  const maxAvailableQuantity = savedCropData ? savedCropData.weightKg : undefined;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', sans-serif", position: 'relative', overflowX: 'hidden' }}>
      
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 99 }} />
      )}

      <div style={{ position: window.innerWidth <= 768 ? 'fixed' : 'relative', zIndex: 100, height: '100vh', width: isSidebarOpen ? '260px' : '0px', padding: isSidebarOpen ? '30px 20px' : '30px 0px', opacity: isSidebarOpen ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s ease', backgroundColor: '#1e392a', color: 'white', display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap', boxShadow: isSidebarOpen ? '5px 0 15px rgba(0,0,0,0.3)' : 'none' }}>
        <h2 style={{ color: '#4caf50', margin: '0 0 40px 0', fontSize: '24px' }}>🌱 FarmFlow AI</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
          <div onClick={() => {setActiveTab('dashboard'); setOrderingItem(null); setIsSidebarOpen(false);}} style={{ color: activeTab === 'dashboard' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navDashboard}</div>
          <div onClick={() => {setActiveTab('profile'); setOrderingItem(null); setIsSidebarOpen(false);}} style={{ color: activeTab === 'profile' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navProfile}</div>
          <div onClick={() => {setActiveTab('crops'); setOrderingItem(null); setIsSidebarOpen(false);}} style={{ color: activeTab === 'crops' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'crops' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navCrops}</div>
          <div onClick={() => {setActiveTab('procurement'); setIsSidebarOpen(false);}} style={{ color: activeTab === 'procurement' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'procurement' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navProcurement}</div>
          <div onClick={() => {setActiveTab('ai'); setOrderingItem(null); setIsSidebarOpen(false);}} style={{ color: activeTab === 'ai' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'ai' ? 'bold' : 'normal', cursor: 'pointer' }}>{l.navAi}</div>
          <div onClick={() => {setActiveTab('help'); setOrderingItem(null); setIsSidebarOpen(false);}} style={{ color: activeTab === 'help' ? '#fff' : '#a0b2a6', fontWeight: activeTab === 'help' ? 'bold' : 'normal', cursor: 'pointer', marginTop: '20px', borderTop: '1px solid #2e4d3a', paddingTop: '20px' }}>{l.navHelp}</div>
        </nav>
        <button onClick={handleLogout} style={{ padding: '12px', backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{l.logout}</button>
      </div>

      <div style={{ flexGrow: 1, padding: '20px', maxWidth: '100%', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ fontSize: '28px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#2c3e50', padding: '0', display: 'flex', alignItems: 'center' }}>☰</button>
            <div>
              <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '26px' }}>{activeTab === 'profile' ? l.navProfile.substring(2) : activeTab === 'help' ? l.navHelp.substring(2) : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} {l.module}</h1>
              <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '5px 0 0 0' }}>{l.subtitle}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '5px', backgroundColor: 'white', padding: '4px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <button onClick={() => setLang('en')} style={{ padding: '4px 8px', backgroundColor: lang === 'en' ? '#2196f3' : 'transparent', color: lang === 'en' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>EN</button>
              <button onClick={() => setLang('hi')} style={{ padding: '4px 8px', backgroundColor: lang === 'hi' ? '#2196f3' : 'transparent', color: lang === 'hi' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>HI</button>
              <button onClick={() => setLang('ta')} style={{ padding: '4px 8px', backgroundColor: lang === 'ta' ? '#2196f3' : 'transparent', color: lang === 'ta' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>TA</button>
            </div>
            <div style={{ padding: '8px 15px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '30px', fontWeight: 'bold', border: '1px solid #c8e6c9', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'green', borderRadius: '50%' }}></span>{l.liveMarket}
            </div>
          </div>
        </div>

        {activeTab === 'help' && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#2e7d32', margin: '0 0 15px 0', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>{l.helpTitle}</h2>
            <div style={{ fontSize: '16px', color: '#444', lineHeight: '1.6' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '15px', fontSize: '18px' }}>{l.helpIntro}</p>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpProfile}</li>
                <li style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpCrops}</li>
                <li style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpProcurement}</li>
                <li style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>{l.helpAi}</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{l.userDetails}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{l.fullName}</span><span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{userProfile.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{l.emailAddr}</span><span style={{ color: '#333', wordBreak: 'break-all' }}>{userProfile.email}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{l.phoneNumber}</span><span style={{ color: '#333' }}>{userProfile.phone || 'Not Provided'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{l.role}</span><span style={{ color: '#333' }}>{l.farmManager}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}><span style={{ fontWeight: 'bold', color: '#555' }}>{l.accountStatus}</span><span style={{ color: 'green', fontWeight: 'bold' }}>{l.verified}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{l.weather} ({weatherData.temp})</h3>
                <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.5' }}>{weatherData.condition}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{l.pestAlert}</h3>
                <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>{l.pestDesc}</p>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>{l.upcomingProcurements}</h3>
              {activeOrders.length === 0 ? (<p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>{l.noActiveOrders}</p>) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeOrders.map(order => (
                    <div key={order.id} style={{ 
                      padding: '12px', 
                      borderLeft: `4px solid ${order.status.includes('VAO') ? '#9c27b0' : order.status === 'Approved' ? '#4caf50' : order.status === 'Procured' ? '#2196f3' : order.status === 'Rejected' ? '#f44336' : '#ff9800'}`, 
                      backgroundColor: '#f9f9f9', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '10px' 
                    }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '16px', color: '#2c3e50' }}>{order.item}</strong>
                        <span style={{ color: '#555', fontSize: '13px' }}>{order.quantity} Units • {order.datetime}</span>
                        <span style={{ display: 'block', color: '#2e7d32', fontSize: '12px', marginTop: '3px', fontWeight: 'bold' }}>📍 {order.zone} / {order.subPlace || 'General'} ({order.address})</span>
                      </div>
                      <span style={{ 
                        padding: '4px 10px', 
                        backgroundColor: order.status.includes('VAO') ? '#f3e5f5' : order.status === 'Approved' ? '#e8f5e9' : order.status === 'Procured' ? '#e3f2fd' : order.status === 'Rejected' ? '#ffebee' : '#fff3cd', 
                        color: order.status.includes('VAO') ? '#7b1fa2' : order.status === 'Approved' ? '#2e7d32' : order.status === 'Procured' ? '#1976d2' : order.status === 'Rejected' ? '#c62828' : '#856404', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 'bold' 
                      }}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'crops' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{l.addCropTitle}</h3>
              <form onSubmit={handleAddCrop} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select required value={newCrop.name} onChange={(e) => setNewCrop({...newCrop, name: e.target.value})} style={{ padding: '10px', flexGrow: 1, minWidth: '180px', border: '1px solid #ddd', borderRadius: '6px' }}>
                  <option value="">{l.selectCrop}</option>
                  {Object.keys(marketRates).map(crop => <option key={crop} value={crop}>{crop} (₹{marketRates[crop].toFixed(2)}/kg)</option>)}
                </select>
                <input type="number" min="1" required placeholder={l.weightKg} value={newCrop.weightKg} onChange={(e) => setNewCrop({...newCrop, weightKg: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '130px' }} />
                <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>{l.addCropBtn}</button>
              </form>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{l.myCropInventory}</h3>
              {myCrops.length === 0 ? <p style={{ fontStyle: 'italic', color: '#777', margin: 0 }}>{l.emptyInventory}</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
                  {myCrops.map(crop => (
                    <div key={crop.id} style={{ padding: '15px', borderLeft: '4px solid #4caf50', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '18px' }}>{crop.name}</h4>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{l.weightKg}:</strong> {crop.weightKg} kgs</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{l.lockedRate}</strong> ₹{crop.ratePerKg.toFixed(2)} / kg</p>
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '16px' }}>₹{(crop.weightKg * crop.ratePerKg).toLocaleString('en-IN')}</strong>
                        <button onClick={() => handleDeleteCrop(crop.id)} style={{ padding: '5px 10px', backgroundColor: '#ffebee', color: '#d32f2f', border: '1px solid #ffcdd2', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>{l.remove}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'procurement' && !orderingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', overflowX: 'auto' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{l.liveCropMarket}</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '450px' }}>
                <thead><tr style={{ borderBottom: '2px solid #eee' }}><th style={{ padding: '12px 8px', fontSize: '14px' }}>{l.cropName}</th><th style={{ padding: '12px 8px', fontSize: '14px' }}>{l.pastRates}</th><th style={{ padding: '12px 8px', fontSize: '14px' }}>{l.liveRate}</th><th style={{ padding: '12px 8px', fontSize: '14px' }}>{l.action}</th></tr></thead>
                <tbody>
                  {Object.keys(marketRates).map(crop => {
                    const history = marketHistory[crop] || [];
                    const p1 = history.length > 1 ? history[history.length - 2].toFixed(2) : '-';
                    const p2 = history.length > 2 ? history[history.length - 3].toFixed(2) : '-';
                    const isCropSaved = myCrops.some(c => c.name === crop);
                    return (
                    <tr key={crop} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}><strong>{crop}</strong></td>
                      <td style={{ padding: '12px 8px', color: '#7f8c8d', fontSize: '13px' }}>₹{p1} <span style={{ color: '#ccc' }}>|</span> ₹{p2}</td>
                      <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '13px', minWidth: '70px' }}>₹{marketRates[crop].toFixed(2)}</span><Sparkline data={history} /></td>
                      <td style={{ padding: '12px 8px' }}>
                        <button disabled={!isCropSaved} onClick={() => setOrderingItem(crop)} style={{ padding: '6px 12px', backgroundColor: isCropSaved ? '#4caf50' : '#e0e0e0', color: isCropSaved ? 'white' : '#999', border: 'none', borderRadius: '4px', cursor: isCropSaved ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '12px' }}>{l.sellMarket}</button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'procurement' && orderingItem && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', maxWidth: '500px', margin: '0 auto' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '8px', fontSize: '18px' }}>{l.procurementApp}</h3>
            <p style={{ color: '#777', marginBottom: '15px', fontSize: '14px' }}>{l.applyingFor} <strong style={{ color: '#2e7d32', fontSize: '16px' }}>{orderingItem}</strong></p>
            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="number" required max={maxAvailableQuantity} placeholder={maxAvailableQuantity ? `${l.quantity} (Max: ${maxAvailableQuantity}kg)` : l.quantity} value={orderDetails.quantity} onChange={(e) => setOrderDetails({...orderDetails, quantity: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
              <select required value={orderDetails.zone} onChange={(e) => handleZoneChange(e.target.value)} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
                <option value="">{l.selectZone}</option>
                {availableZones.length === 0 ? <option value="" disabled>No active zones found.</option> : availableZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
              </select>
              <select required value={orderDetails.subPlace} onChange={(e) => setOrderDetails({...orderDetails, subPlace: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
                <option value="">{l.selectSubPlace}</option>
                {availableSubPlaces.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
              <input type="text" required placeholder={l.farmAddress} value={orderDetails.address} onChange={(e) => setOrderDetails({...orderDetails, address: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
              <input type="text" required placeholder={l.pattaChitta} value={orderDetails.pattaChitta} onChange={(e) => setOrderDetails({...orderDetails, pattaChitta: e.target.value})} style={{ padding: '10px', border: '1px solid #2e7d32', borderRadius: '6px', fontSize: '14px', backgroundColor: '#f1f8e9' }} />
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '13px', fontWeight: 'bold' }}>{l.uploadDoc}</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={(e) => setPattaFile(e.target.files[0])} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', width: '100%', boxSizing: 'border-box', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={isSubmitting} style={{ flexGrow: 1, padding: '12px', backgroundColor: isSubmitting ? '#999' : '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                  {isSubmitting ? 'Processing...' : l.confirmOrder}
                </button>
                <button type="button" disabled={isSubmitting} onClick={() => setOrderingItem(null)} style={{ padding: '12px', backgroundColor: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>{l.cancel}</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{l.aiAnalysis}</h3>
            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{l.aiReport}</p>
              <ul style={{ color: '#555', lineHeight: '1.6', fontSize: '14px', paddingLeft: '20px', margin: 0 }}>
                <li>{l.aiTip1}</li><li>{l.aiTip2}</li><li>{l.aiTip3}</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;