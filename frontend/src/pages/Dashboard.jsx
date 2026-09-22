import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import './Dashboard.css';

// Original Crop Rates
const initialRates = {
  "Rice (Paddy)": 22.50,
  "Wheat": 25.00,
  "Maize (Corn)": 20.00,
  "Cotton": 70.00,
  "Sugarcane": 3.15,
  "Soybean": 46.00,
  "Mustard": 52.00,
  "Bajra (Pearl Millet)": 24.50,
  "Groundnut": 65.00,
  "Tur (Pigeon Pea)": 110.00,
  "Onion": 28.00,
  "Potato": 18.00
};

const cropTranslations = {
  "Rice (Paddy)": { en: "Rice (Paddy)", hi: "चावल (धान)", ta: "அரிசி (நெல்)" },
  "Wheat": { en: "Wheat", hi: "गेहूं", ta: "கோதுமை" },
  "Maize (Corn)": { en: "Maize (Corn)", hi: "मक्का", ta: "மக்காச்சோளம்" },
  "Cotton": { en: "Cotton", hi: "कपास", ta: "பருத்தி" },
  "Sugarcane": { en: "Sugarcane", hi: "गन्ना", ta: "கரும்பு" },
  "Soybean": { en: "Soybean", hi: "सोयाबीन", ta: "சோயாபீன்" },
  "Mustard": { en: "Mustard", hi: "सरसों", ta: "கடுகு" },
  "Bajra (Pearl Millet)": { en: "Bajra (Pearl Millet)", hi: "बाजरा", ta: "கம்பு" },
  "Groundnut": { en: "Groundnut", hi: "मूंगफली", ta: "நிலக்கடலை" },
  "Tur (Pigeon Pea)": { en: "Tur (Pigeon Pea)", hi: "अरहर (तुअर)", ta: "துவரம் பருப்பு" },
  "Onion": { en: "Onion", hi: "प्याज", ta: "வெங்காயம்" },
  "Potato": { en: "Potato", hi: "आलू", ta: "உருளைக்கிழங்கு" }
};

const generateInitialHistory = (rates) => {
  const history = {};
  Object.keys(rates).forEach((crop) => {
    let current = rates[crop];
    const pastRates = [];
    for (let i = 0; i < 10; i++) {
      current = current * (1 + ((Math.random() * 0.06) - 0.03));
      pastRates.unshift(current);
    }
    pastRates.push(rates[crop]);
    history[crop] = pastRates;
  });
  return history;
};

// SVG Sparkline
const Sparkline = ({ data }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const isUp = data[data.length - 1] >= data[data.length - 2];

  const points = data
    .map(
      (val, i) =>
        `${(i / (data.length - 1)) * 80},${
          24 - ((val - min) / range) * 20 - 2
        }`
    )
    .join(' ');

  return (
    <svg
      viewBox="0 0 80 24"
      className={`sparkline ${isUp ? 'sparkline-up' : 'sparkline-down'}`}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const getWeatherMeta = (code, isNight = false) => {
  if (code === 0) return isNight ? { label: "Clear night", icon: "🌙" } : { label: "Clear sky", icon: "☀️" };
  if (code > 0 && code < 4) return isNight ? { label: "Partly cloudy", icon: "☁️" } : { label: "Partly cloudy", icon: "⛅" };
  if (code >= 45 && code < 50) return { label: "Foggy / Misty", icon: "🌫️" };
  if (code >= 50 && code < 80) return { label: "Rainy", icon: "🌧️" };
  if (code >= 80 && code < 90) return { label: "Showers", icon: "🌦️" };
  if (code >= 90) return { label: "Thunderstorm", icon: "⛈️" };
  return isNight ? { label: "Clear", icon: "🌙" } : { label: "Clear", icon: "🌤️" };
};

const generate24HourFallbackForecast = () => {
  const now = new Date();
  const list = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getTime() + i * 3600 * 1000);
    const hour = d.getHours();
    const isNight = hour >= 19 || hour < 6;
    const temp = Math.round(28 + 4 * Math.sin(((hour - 9) * Math.PI) / 12));
    let icon = isNight ? '🌙' : '☀️';
    let label = isNight ? 'Clear Night' : 'Clear Sky';
    if (!isNight && hour >= 6 && hour < 9) {
      icon = '🌅';
      label = 'Pleasant Morning';
    } else if (!isNight && hour >= 12 && hour <= 16) {
      icon = '🌤️';
      label = 'Sunny & Warm';
    }
    const timeFormatted = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    list.push({
      time: i === 0 ? 'Now' : timeFormatted,
      day: d.toLocaleDateString([], { weekday: 'short' }),
      temp: `${temp}°C`,
      icon,
      condition: label
    });
  }
  return list;
};

// Original Translations Preserved
const t = {
  en: {
    navDashboard: "📊 Dashboard",
    navProfile: "👤 My Profile",
    navCrops: "🌾 My Crops",
    navProcurement: "🛒 Procurement",
    navTrack: "📦 Track Status",
    navAi: "🤖 AI Insights",
    navHelp: "❓ Help",
    logout: "Log Out",
    subtitle: "Manage your smart farm operations seamlessly.",
    liveMarket: "Live Market Active",
    userDetails: "User Details",
    fullName: "Full Name:",
    emailAddr: "Email Address:",
    phoneNumber: "Phone Number:",
    role: "Role:",
    farmManager: "Farmer",
    accountStatus: "Account Status:",
    verified: "Verified 🟢",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    changePhoto: "Change Photo",
    removePhoto: "Remove Photo",
    jurisdictionZone: "Jurisdiction Zone:",
    villageSubPlace: "Village / Mandi Sub-Place:",
    farmLocationAddress: "Farm Location / Address:",
    weather: "Local Weather",
    pestAlert: "Pest Alert",
    pestDesc: "No active threats detected in your area.",
    addCropTitle: "Add New Crop Inventory",
    selectCrop: "-- Select Major Indian Crop --",
    weightKg: "Weight (KGs)",
    addCropBtn: "Add Crop",
    myCropInventory: "My Crop Inventory",
    emptyInventory: "Your inventory is currently empty.",
    lockedRate: "Locked Rate:",
    remove: "Remove",
    liveCropMarket: "Live Crop Market Prices",
    cropName: "Crop Name",
    pastRates: "Past Rates",
    liveRate: "Live Rate & Trend",
    action: "Action",
    sellMarket: "Sell to Market",
    procurementApp: "Procurement Application",
    applyingFor: "Applying for:",
    quantity: "Quantity (KGs / Bags)",
    selectZone: "-- Select Active Zone --",
    selectSubPlace: "-- Select Sub-Place / Village --",
    farmAddress: "Specific Farm Address",
    pattaChitta: "Patta / Chitta Document Number",
    uploadDoc: "Upload Patta/Chitta (JPG/PDF, Max 500KB)",
    confirmOrder: "Submit to VAO",
    cancel: "Cancel",
    upcomingProcurements: "Upcoming Procurements & Gate Passes",
    noActiveOrders: "No active orders at the moment.",
    aiAnalysis: "AI Analysis",
    aiReport: "Weekly Insight Report generated:",
    aiTip1: "Nitrogen levels in your fields may be dropping. Recommended to apply Urea by Thursday.",
    aiTip2: "Market conditions suggest holding wheat sales for 2 weeks to maximize profit.",
    aiTip3: "Weather analysis shows low risk of pests for the next 7 days.",
    helpTitle: "Help & Guide",
    helpIntro: "Welcome to FarmFlow AI! Here is how to use your dashboard:",
    helpProfile: "Profile: View your registered account details and status.",
    helpCrops: "My Crops: Add your harvested crops, enter weight, and monitor live estimated market values.",
    helpProcurement: "Procurement: View live fluctuating market rates and apply to sell crops through VAO verification.",
    helpTrack: "Track Status: Monitor your VAO verification progress, download official Gate Passes, and track DBT payouts.",
    helpAi: "AI Insights: Read weekly AI-generated advice to maximize your farm's profit and health."
  },
  ta: {
    navDashboard: "📊 டாஷ்போர்டு",
    navProfile: "👤 என் சுயவிவரம்",
    navCrops: "🌾 என் பயிர்கள்",
    navProcurement: "🛒 கொள்முதல்",
    navTrack: "📦 நிலை கண்காணிப்பு",
    navAi: "🤖 AI ஆலோசனைகள்",
    navHelp: "❓ உதவி",
    logout: "வெளியேறு",
    subtitle: "உங்கள் ஸ்மார்ட் பண்ணை செயல்பாடுகளை எளிதாக நிர்வகிக்கவும்.",
    liveMarket: "நேரடி சந்தை செயல்பாட்டில்",
    userDetails: "பயனர் விவரங்கள்",
    fullName: "முழு பெயர்:",
    emailAddr: "மின்னஞ்சல்:",
    phoneNumber: "தொலைபேசி எண்:",
    role: "பங்கு:",
    farmManager: "விவசாயி",
    accountStatus: "கணக்கு நிலை:",
    verified: "சரிபார்க்கப்பட்டது 🟢",
    editProfile: "சுயவிவரத்தைத் திருத்து",
    saveChanges: "மாற்றங்களைச் சேமிக்கவும்",
    changePhoto: "புகைப்படத்தை மாற்றவும்",
    removePhoto: "புகைப்படத்தை நீக்கு",
    jurisdictionZone: "அதிகார வரம்பு மண்டலம்:",
    villageSubPlace: "கிராமம் / துணை இடம்:",
    farmLocationAddress: "பண்ணை முகவரி:",
    weather: "உள்ளூர் வானிலை",
    pestAlert: "பூச்சி எச்சரிக்கை",
    pestDesc: "உங்கள் பகுதியில் செயலில் உள்ள அச்சுறுத்தல்கள் இல்லை.",
    addCropTitle: "புதிய பயிரை சேர்க்கவும்",
    selectCrop: "-- இந்திய பயிரைத் தேர்ந்தெடுக்கவும் --",
    weightKg: "எடை (கிலோ)",
    addCropBtn: "பயிரைச் சேர்க்கவும்",
    myCropInventory: "என் பயிர் இருப்பு",
    emptyInventory: "உங்கள் இருப்பு தற்போது காலியாக உள்ளது.",
    lockedRate: "பூட்டப்பட்ட விலை:",
    remove: "நீக்கு",
    liveCropMarket: "நேரடி பயிர் சந்தை விலைகள்",
    cropName: "பயிர் பெயர்",
    pastRates: "கடந்த விலைகள்",
    liveRate: "நேரடி விலை & போக்கு",
    action: "செயல்",
    sellMarket: "சந்தையில் விற்கவும்",
    procurementApp: "கொள்முதல் விண்ணப்பம்",
    applyingFor: "இதற்கான விண்ணப்பம்:",
    quantity: "அளவு (கிலோ / பைகள்)",
    selectZone: "-- செயலில் உள்ள மண்டலத்தைத் தேர்ந்தெடுக்கவும் --",
    selectSubPlace: "-- கிராமம் / துணை இடத்தைத் தேர்ந்தெடுக்கவும் --",
    farmAddress: "குறிப்பிட்ட பண்ணை முகவரி",
    pattaChitta: "பட்டா / சிட்டா ஆவண எண்",
    uploadDoc: "பட்டா/சிட்டாவை பதிவேற்றவும் (JPG/PDF, அதிகபட்சம் 500KB)",
    confirmOrder: "VAO-க்கு சமர்ப்பிக்கவும்",
    cancel: "ரத்து செய்",
    upcomingProcurements: "வரவிருக்கும் கொள்முதல்கள்",
    noActiveOrders: "தற்போது செயலில் உள்ள ஆர்டர்கள் இல்லை.",
    aiAnalysis: "AI பகுப்பாய்வு",
    aiReport: "வாராந்திர நுண்ணறிவு அறிக்கை:",
    aiTip1: "உங்கள் வயல்களில் நைட்ரஜன் அளவு குறையக்கூடும். வியாழக்கிழமைக்குள் யூரியா பயன்படுத்த பரிந்துரைக்கப்படுகிறது.",
    aiTip2: "லாபத்தை அதிகரிக்க கோதுமை விற்பனையை 2 வாரங்கள் தாமதப்படுத்த சந்தை நிலைமைகள் பரிந்துரைக்கின்றன.",
    aiTip3: "அடுத்த 7 நாட்களில் பூச்சி தாக்குதல் அபாயம் குறைவாக இருக்கும் என வானிலை பகுப்பாய்வு காட்டுகிறது.",
    helpTitle: "உதவி மற்றும் வழிகாட்டி",
    helpIntro: "FarmFlow AI-க்கு வரவேற்கிறோம்! உங்கள் டாஷ்போர்டை பயன்படுத்துவது எப்படி:",
    helpProfile: "சுயவிவரம்: உங்கள் பதிவு செய்யப்பட்ட கணக்கு விவரங்களையும் நிலையையும் பார்க்கவும்.",
    helpCrops: "என் பயிர்கள்: அறுவடை பயிர்களைச் சேர்த்து, எடையைப் பதிவு செய்து, நேரடி சந்தை மதிப்பைப் பார்க்கவும்.",
    helpProcurement: "கொள்முதல்: நேரடி சந்தை விலைகளைப் பார்த்து, பயிர்களை விற்க விண்ணப்பிக்கவும்.",
    helpTrack: "நிலை கண்காணிப்பு: VAO சரிபார்ப்பு, கேட் பாஸ் மற்றும் DBT கட்டணங்களை கண்காணிக்கவும்.",
    helpAi: "AI ஆலோசனைகள்: பண்ணை லாபம் மற்றும் ஆரோக்கியத்தை மேம்படுத்த AI ஆலோசனைகளைப் படிக்கவும்."
  },
  hi: {
    navDashboard: "📊 डैशबोर्ड",
    navProfile: "👤 मेरी प्रोफ़ाइल",
    navCrops: "🌾 मेरी फसलें",
    navProcurement: "🛒 खरीद",
    navTrack: "📦 स्थिति ट्रैक करें",
    navAi: "🤖 AI अंतर्दृष्टि",
    navHelp: "❓ सहायता",
    logout: "लॉग आउट",
    subtitle: "अपने स्मार्ट फार्म संचालन को आसानी से प्रबंधित करें।",
    liveMarket: "लाइव मार्केट सक्रिय",
    userDetails: "उपयोगकर्ता विवरण",
    fullName: "पूरा नाम:",
    emailAddr: "ईमेल पता:",
    phoneNumber: "फ़ोन नंबर:",
    role: "भूमिका:",
    farmManager: "किसान",
    accountStatus: "खाता स्थिति:",
    verified: "सत्यापित 🟢",
    editProfile: "प्रोफ़ाइल संपादित करें",
    saveChanges: "परिवर्तन सहेजें",
    changePhoto: "फ़ोटो बदलें",
    removePhoto: "फ़ोटो हटाएं",
    jurisdictionZone: "अधिकार क्षेत्र ज़ोन:",
    villageSubPlace: "गांव / उप-स्थान:",
    farmLocationAddress: "खेत का पता:",
    weather: "स्थानीय मौसम",
    pestAlert: "कीट चेतावनी",
    pestDesc: "आपके क्षेत्र में कोई सक्रिय खतरा नहीं मिला।",
    addCropTitle: "नई फसल इन्वेंटरी जोड़ें",
    selectCrop: "-- प्रमुख भारतीय फसल चुनें --",
    weightKg: "वजन (किग्रा)",
    addCropBtn: "फसल जोड़ें",
    myCropInventory: "मेरी फसल इन्वेंटरी",
    emptyInventory: "आपकी इन्वेंटरी अभी खाली है।",
    lockedRate: "लॉक की गई दर:",
    remove: "हटाएं",
    liveCropMarket: "लाइव फसल बाजार मूल्य",
    cropName: "फसल का नाम",
    pastRates: "पिछली दरें",
    liveRate: "लाइव दर और रुझान",
    action: "कार्रवाई",
    sellMarket: "बाजार में बेचें",
    procurementApp: "खरीद आवेदन",
    applyingFor: "इसके लिए आवेदन:",
    quantity: "मात्रा (किग्रा / बैग)",
    selectZone: "-- सक्रिय ज़ोन चुनें --",
    selectSubPlace: "-- गांव / उप-स्थान चुनें --",
    farmAddress: "विशिष्ट खेत का पता",
    pattaChitta: "पट्टा / चिट्टा दस्तावेज़ संख्या",
    uploadDoc: "पट्टा/चिट्टा अपलोड करें (JPG/PDF, अधिकतम 500KB)",
    confirmOrder: "VAO को भेजें",
    cancel: "रद्द करें",
    upcomingProcurements: "आगामी खरीद",
    noActiveOrders: "अभी कोई सक्रिय आदेश नहीं है।",
    aiAnalysis: "AI विश्लेषण",
    aiReport: "साप्ताहिक अंतर्दृष्टि रिपोर्ट तैयार:",
    aiTip1: "आपके खेतों में नाइट्रोजन का स्तर कम हो सकता है। गुरुवार तक यूरिया डालने की सलाह है।",
    aiTip2: "बाजार की स्थिति लाभ बढ़ाने के लिए गेहूं की बिक्री 2 सप्ताह रोकने का सुझाव देती है।",
    aiTip3: "मौसम विश्लेषण अगले 7 दिनों में कीटों के कम जोखिम को दर्शाता है।",
    helpTitle: "सहायता और मार्गदर्शिका",
    helpIntro: "FarmFlow AI में आपका स्वागत है! अपना डैशबोर्ड इस्तेमाल करने का तरीका यहां है:",
    helpProfile: "प्रोफ़ाइल: अपने पंजीकृत खाते का विवरण और स्थिति देखें।",
    helpCrops: "मेरी फसलें: फसल जोड़ें, वजन दर्ज करें और लाइव बाजार मूल्य देखें।",
    helpProcurement: "खरीद: लाइव दरें देखें और फसल बेचने के लिए VAO सत्यापन को आवेदन करें।",
    helpTrack: "स्थिति ट्रैक करें: VAO सत्यापन, गेट पास और DBT भुगतान की निगरानी करें।",
    helpAi: "AI अंतर्दृष्टि: खेत के लाभ और स्वास्थ्य के लिए AI की सलाह पढ़ें।"
  }
};

const Dashboard = () => {
  const navigate = useNavigate();

  // Active Tab: Original names
  const [activeTab, setActiveTab] = useState(
    window.location.hash.replace('#', '') || 'dashboard'
  );
  const [lang, setLang] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const l = t[lang] || t.en;
  const getCropName = (cropKey) => cropTranslations[cropKey]?.[lang] || cropKey;

  // Market Rates & History
  const [marketRates, setMarketRates] = useState(initialRates);
  const [marketHistory, setMarketHistory] = useState(() =>
    generateInitialHistory(initialRates)
  );

  // User Profile & Edit States
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved =
        localStorage.getItem('farmflow_user') ||
        sessionStorage.getItem('farmflow_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return {
            name: parsed.name || 'Farmer',
            email: parsed.email,
            phone: parsed.phone || '',
            role: parsed.role || 'farmer',
            zone: parsed.zone || '',
            subPlace: parsed.subPlace || '',
            address: parsed.address || '',
            photoUrl: parsed.photoUrl || ''
          };
        }
      }
    } catch (e) {
      console.error("Error reading saved user:", e);
    }
    return {
      name: '',
      email: '',
      phone: '',
      role: 'farmer',
      zone: '',
      subPlace: '',
      address: '',
      photoUrl: ''
    };
  });
  const [userDocId, setUserDocId] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: '',
    zone: '',
    subPlace: '',
    address: '',
    photoUrl: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Orders & Crops
  const [activeOrders, setActiveOrders] = useState([]);
  const [myCrops, setMyCrops] = useState([]);
  const [orderingItem, setOrderingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Locations / VAO
  const [vaoUsers, setVaoUsers] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [availableSubPlaces, setAvailableSubPlaces] = useState([]);

  // Notifications banner
  const [latestNotification, setLatestNotification] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  // Weather State
  const [weatherData, setWeatherData] = useState({
    temp: '29°C',
    condition: 'Sunny • Humidity 60%',
    locationName: 'Local Field',
    icon: '🌤️'
  });
  const [hourlyForecast, setHourlyForecast] = useState(generate24HourFallbackForecast);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  // Reschedule Modal
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedOrderForReschedule, setSelectedOrderForReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00 AM - 11:00 AM');

  // Order Details Form
  const [orderDetails, setOrderDetails] = useState({
    zone: '',
    subPlace: '',
    address: '',
    quantity: '',
    pattaChitta: ''
  });
  const [pattaFile, setPattaFile] = useState(null);

  // New Crop Form
  const [newCrop, setNewCrop] = useState({
    name: '',
    weightKg: ''
  });

  // Handle hash change for browser history
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      const validTabs = ['dashboard', 'profile', 'crops', 'procurement', 'track', 'ai', 'help'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load Saved User & Enforce Authentication
  useEffect(() => {
    const savedUser =
      localStorage.getItem('farmflow_user') ||
      sessionStorage.getItem('farmflow_user');

    if (!savedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);
      if (parsed && parsed.email) {
        setUserProfile((prev) => ({ ...prev, ...parsed }));
        if (parsed.id || parsed.uid) {
          setUserDocId(parsed.id || parsed.uid);
        }
      } else {
        navigate('/login');
      }
    } catch (e) {
      console.error("Error parsing saved user:", e);
      navigate('/login');
    }
  }, [navigate]);

  // Geolocation & Live Weather
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const res = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code&timezone=auto`
            );
            const data = await res.json();
            const meta = getWeatherMeta(data.current.weather_code);
            setWeatherData({
              temp: `${Math.round(data.current.temperature_2m)}°C`,
              condition: `${meta.label}. Humidity: ${data.current.relative_humidity_2m}%`,
              locationName: 'Local Field',
              icon: meta.icon
            });

            if (data.hourly && data.hourly.time) {
              const now = new Date();
              // Find the hourly index matching the user's current local hour
              let startIdx = data.hourly.time.findIndex((t) => {
                const dt = new Date(t);
                return (
                  dt.getFullYear() === now.getFullYear() &&
                  dt.getMonth() === now.getMonth() &&
                  dt.getDate() === now.getDate() &&
                  dt.getHours() === now.getHours()
                );
              });

              // Fallback if exact local hour match wasn't found
              if (startIdx === -1) {
                let minDiff = Infinity;
                startIdx = 0;
                for (let i = 0; i < data.hourly.time.length; i++) {
                  const diff = Math.abs(new Date(data.hourly.time[i]).getTime() - now.getTime());
                  if (diff < minDiff) {
                    minDiff = diff;
                    startIdx = i;
                  }
                }
              }

              const nextHours = [];
              const endIdx = Math.min(startIdx + 24, data.hourly.time.length);
              for (let i = startIdx; i < endIdx; i++) {
                const d = new Date(data.hourly.time[i]);
                const hour = d.getHours();
                const isNight = hour >= 19 || hour < 6;
                const hMeta = getWeatherMeta(data.hourly.weather_code[i], isNight);
                const timeFormatted = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });

                nextHours.push({
                  time: i === startIdx ? 'Now' : timeFormatted,
                  day: d.toLocaleDateString([], { weekday: 'short' }),
                  temp: `${Math.round(data.hourly.temperature_2m[i])}°C`,
                  icon: hMeta.icon,
                  condition: hMeta.label
                });
              }
              setHourlyForecast(nextHours);
            }
          } catch (e) {
            console.error("Weather error:", e);
          }
        },
        () => console.warn("GPS disabled")
      );
    }
  }, []);

  // Fetch VAO Locations
  useEffect(() => {
    const fetchVAOs = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', 'in', ['vao', 'officer'])
        );
        const snap = await getDocs(q);
        const usersList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setVaoUsers(usersList);
        const zones = usersList.map((v) => v.zone).filter(Boolean);
        setAvailableZones([...new Set(zones)]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVAOs();
  }, []);

  const handleZoneChange = (zone) => {
    setOrderDetails((prev) => ({ ...prev, zone, subPlace: '' }));
    const matching = vaoUsers.filter((v) => v.zone === zone);
    const subPlaces = matching.map((v) => v.subPlace || v.sub_place || v.village).filter(Boolean);
    setAvailableSubPlaces([...new Set(subPlaces)]);
  };

  // Listen to Firestore Orders, Crops & User Profile
  useEffect(() => {
    if (!userProfile.email) return;
    const emailLower = userProfile.email.toLowerCase();

    const qOrders = query(
      collection(db, 'orders'),
      where('userEmail', '==', emailLower)
    );

    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const ordersData = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        token: d.data().token || `PDC-${d.id.slice(-6).toUpperCase()}`
      }));
      ordersData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setActiveOrders(ordersData);
    });

    const qCrops = query(
      collection(db, 'crops'),
      where('userEmail', '==', emailLower)
    );

    const unsubCrops = onSnapshot(qCrops, (snap) => {
      const cropsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyCrops(cropsData);
    });

    const qUser = query(
      collection(db, 'users'),
      where('email', '==', emailLower)
    );

    const unsubUser = onSnapshot(qUser, (snap) => {
      if (!snap.empty) {
        const uDoc = snap.docs[0];
        const uData = uDoc.data();
        setUserDocId(uDoc.id);
        setUserProfile((prev) => {
          const merged = {
            ...prev,
            ...uData,
            id: uDoc.id,
            name: uData.name || prev.name,
            phone: uData.phone || prev.phone,
            photoUrl: uData.photoUrl || prev.photoUrl || '',
            zone: uData.zone || prev.zone || '',
            subPlace: uData.subPlace || prev.subPlace || '',
            address: uData.address || prev.address || ''
          };

          try {
            const saved = localStorage.getItem('farmflow_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              localStorage.setItem('farmflow_user', JSON.stringify({ ...parsed, ...merged }));
            }
          } catch (e) {}

          return merged;
        });
      }
    });

    return () => {
      unsubOrders();
      unsubCrops();
      unsubUser();
    };
  }, [userProfile.email]);

  // Profile Edit Handlers
  const handleStartEditProfile = () => {
    setProfileFormData({
      name: userProfile.name || '',
      phone: userProfile.phone || '',
      zone: userProfile.zone || '',
      subPlace: userProfile.subPlace || '',
      address: userProfile.address || '',
      photoUrl: userProfile.photoUrl || ''
    });
    setIsEditingProfile(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 300;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setProfileFormData((prev) => ({
          ...prev,
          photoUrl: compressed
        }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileFormData((prev) => ({
      ...prev,
      photoUrl: ''
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileFormData.name.trim()) {
      alert('Please enter your full name.');
      return;
    }

    const rawPhone = profileFormData.phone.trim();
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    if (cleanPhone && cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (cleanPhone) {
        const phoneVariants = [cleanPhone, `+91${cleanPhone}`, `+91 ${cleanPhone}`, rawPhone];
        const uniqueVariants = [...new Set(phoneVariants.filter(Boolean))];
        const qPhone = query(collection(db, 'users'), where('phone', 'in', uniqueVariants));
        const phoneSnap = await getDocs(qPhone);

        const isDuplicate = phoneSnap.docs.some(
          (d) => d.id !== userDocId && d.data().email?.toLowerCase() !== userProfile.email.toLowerCase()
        );

        if (isDuplicate) {
          setIsSavingProfile(false);
          alert('This phone number is already registered to another account. Please use a unique phone number.');
          return;
        }
      }

      const updatedFields = {
        name: profileFormData.name.trim(),
        phone: cleanPhone || rawPhone,
        zone: profileFormData.zone.trim(),
        subPlace: profileFormData.subPlace.trim(),
        address: profileFormData.address.trim(),
        photoUrl: profileFormData.photoUrl || ''
      };

      if (userDocId) {
        await updateDoc(doc(db, 'users', userDocId), updatedFields);
      } else {
        const q = query(collection(db, 'users'), where('email', '==', userProfile.email.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(doc(db, 'users', snap.docs[0].id), updatedFields);
          setUserDocId(snap.docs[0].id);
        } else {
          const newDoc = await addDoc(collection(db, 'users'), {
            ...updatedFields,
            email: userProfile.email.toLowerCase(),
            role: 'farmer',
            createdAt: new Date().toISOString()
          });
          setUserDocId(newDoc.id);
        }
      }

      setUserProfile((prev) => ({
        ...prev,
        ...updatedFields
      }));

      try {
        const saved = localStorage.getItem('farmflow_user');
        const currentSaved = saved ? JSON.parse(saved) : {};
        localStorage.setItem('farmflow_user', JSON.stringify({ ...currentSaved, ...updatedFields }));
      } catch (err) {}

      setIsEditingProfile(false);
      alert('Profile updated successfully! ✨');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile changes: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Live Market Fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRates((prev) => {
        const newRates = { ...prev };
        const crops = Object.keys(newRates);
        const rand = crops[Math.floor(Math.random() * crops.length)];
        newRates[rand] = Number((newRates[rand] * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2));

        setMarketHistory((hist) => {
          const upd = { ...hist };
          upd[rand] = [...(upd[rand] || []), newRates[rand]].slice(-15);
          return upd;
        });
        return newRates;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const changeTab = (tab) => {
    window.location.hash = tab;
    setActiveTab(tab);
    if (tab !== 'procurement') setOrderingItem(null);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

  // Add Crop to Inventory
  const handleAddCrop = async (e) => {
    e.preventDefault();
    if (!newCrop.name || !newCrop.weightKg || !userProfile.email) return;

    try {
      await addDoc(collection(db, 'crops'), {
        userEmail: userProfile.email.toLowerCase(),
        name: newCrop.name,
        weightKg: parseFloat(newCrop.weightKg),
        ratePerKg: marketRates[newCrop.name] || 25,
        createdAt: new Date().toISOString()
      });
      setNewCrop({ name: '', weightKg: '' });
      alert('Crop added to inventory successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCrop = async (id) => {
    try {
      await deleteDoc(doc(db, 'crops', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Procurement Application to VAO
  const submitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileDataString = '';
      if (pattaFile) {
        const reader = new FileReader();
        fileDataString = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(pattaFile);
        });
      }

      const generatedToken = 'PDC-' + Math.floor(100000 + Math.random() * 900000);

      await addDoc(collection(db, 'orders'), {
        token: generatedToken,
        userName: userProfile.name || 'Farmer',
        userPhone: userProfile.phone || 'N/A',
        userEmail: userProfile.email ? userProfile.email.toLowerCase() : '',
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

      alert(`Application sent successfully to VAO in ${orderDetails.zone} (${orderDetails.subPlace})! Assigned Token: ${generatedToken}`);
      setOrderingItem(null);
      setOrderDetails({ zone: '', subPlace: '', address: '', quantity: '', pattaChitta: '' });
      setPattaFile(null);
      changeTab('track');
    } catch (err) {
      console.error(err);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // EXTRA FEATURE: Download Gate Pass PDF
  const handleDownloadPass = (order) => {
    try {
      const pdf = new jsPDF();
      pdf.setFillColor(21, 128, 61);
      pdf.rect(0, 0, 210, 26, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FARMFLOW AI - OFFICIAL MANDI GATE PASS', 105, 12, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Smart Agriculture Procurement & Verification System', 105, 20, { align: 'center' });

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TOKEN: ${order.token}`, 20, 42);
      pdf.setFontSize(10);
      pdf.setTextColor(22, 163, 74);
      pdf.text(`STATUS: ${order.status}`, 155, 42);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 46, 190, 46);

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Farmer Name:', 20, 58);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${order.userName} (+91 ${order.userPhone})`, 75, 58);

      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Procurement Zone:', 20, 70);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${order.zone || 'General'} (${order.subPlace || 'Main Mandi'})`, 75, 70);

      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Crop & Quantity:', 20, 82);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${order.item} (${order.quantity} KGs/Qtl)`, 75, 82);

      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Allocated Slot:', 20, 94);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${order.datetime || 'TBD by Officer'}`, 75, 94);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 102, 190, 102);

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Present this QR gate pass at the weighbridge counter for priority entry.', 105, 112, { align: 'center' });

      pdf.save(`GatePass_${order.token}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  // EXTRA FEATURE: Request Reschedule
  const handleConfirmReschedule = async () => {
    if (!selectedOrderForReschedule || !rescheduleDate) {
      alert('Please select a preferred reschedule date.');
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', selectedOrderForReschedule.id), {
        rescheduleRequested: true,
        preferredRescheduleDate: rescheduleDate,
        preferredRescheduleTime: rescheduleTime
      });
      alert('Reschedule request submitted to the Procurement Officer!');
      setShowRescheduleModal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to request reschedule.');
    }
  };

  // Calculate Total Inventory Value
  const totalInventoryWeight = myCrops.reduce((acc, c) => acc + (c.weightKg || 0), 0);
  const totalInventoryValue = myCrops.reduce((acc, c) => acc + ((c.weightKg || 0) * (marketRates[c.name] || c.ratePerKg || 25)), 0);

  // Original Navigation Items
  const navItems = [
    { id: 'dashboard', label: l.navDashboard, icon: '📊' },
    { id: 'profile', label: l.navProfile, icon: '👤' },
    { id: 'crops', label: l.navCrops, icon: '🌾' },
    { id: 'procurement', label: l.navProcurement, icon: '🛒' },
    { id: 'track', label: l.navTrack, icon: '📦' },
    { id: 'ai', label: l.navAi, icon: '🤖' },
    { id: 'help', label: l.navHelp, icon: '❓' }
  ];

  return (
    <div className="v-dash-shell">
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="v-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Original FarmFlow AI Menu Restored) */}
      <aside className={`v-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="v-sidebar-brand">
          <div className="v-brand-leaf">🌱</div>
          <div className="v-brand-text">
            <strong>FarmFlow <span>AI</span></strong>
            <small>SMART AGRICULTURE</small>
          </div>
        </div>

        <nav className="v-sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`v-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => changeTab(item.id)}
            >
              <span className="v-nav-icon">{item.icon}</span>
              <span>{item.label.substring(2)}</span>
            </button>
          ))}
        </nav>

        <div className="v-sidebar-bottom">
          <button
            type="button"
            className="v-bottom-btn"
            onClick={() => setShowWeatherModal(true)}
          >
            <span>🌤️</span> {l.weather}
          </button>
          <button
            type="button"
            className="v-bottom-btn v-logout-btn"
            onClick={handleLogout}
          >
            <span>🚪</span> {l.logout}
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="v-main-content">
        {/* TOP NAVBAR */}
        <header className="v-top-header">
          <div className="v-header-left">
            <button
              type="button"
              className="v-mobile-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
            <div className="v-header-title">
              <h2>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'profile' && l.navProfile.substring(2)}
                {activeTab === 'crops' && l.navCrops.substring(2)}
                {activeTab === 'procurement' && l.navProcurement.substring(2)}
                {activeTab === 'track' && l.navTrack.substring(2)}
                {activeTab === 'ai' && l.navAi.substring(2)}
                {activeTab === 'help' && l.navHelp.substring(2)}
              </h2>
            </div>
          </div>

          <div className="v-header-right">
            <div className="v-live-badge">
              <span className="pulse-dot" />
              <span>{l.liveMarket}</span>
            </div>

            <div className="v-dash-lang">
              {['en', 'hi', 'ta'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={lang === item ? 'active' : ''}
                  onClick={() => setLang(item)}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>

            <div
              className="v-user-avatar-badge"
              onClick={() => changeTab('profile')}
            >
              <div className="v-avatar-circle">
                {userProfile.photoUrl ? (
                  <img
                    src={userProfile.photoUrl}
                    alt={userProfile.name}
                    className="v-avatar-nav-img"
                  />
                ) : (
                  userProfile.name?.charAt(0)?.toUpperCase() || 'F'
                )}
              </div>
              <div className="v-avatar-info">
                <span className="v-user-name">{userProfile.name}</span>
                <small className="v-user-id">{l.farmManager}</small>
              </div>
            </div>
          </div>
        </header>

        {/* TAB 1: DASHBOARD (Multi-Column Layout with Quick-Access Side Columns) */}
        {activeTab === 'dashboard' && (
          <div className="v-tab-dashboard">
            {/* Hero Greeting Card */}
            <div className="v-hero-greeting-card">
              <div>
                <h1>Good Morning, {userProfile.name} 🌾</h1>
                <p>{l.subtitle}</p>
              </div>
              <div className="v-hero-actions">
                <button
                  type="button"
                  className="v-primary-action-btn"
                  onClick={() => changeTab('procurement')}
                >
                  + Sell to Market
                </button>
                <button
                  type="button"
                  className="v-secondary-action-btn"
                  onClick={() => changeTab('track')}
                >
                  🎟️ Gate Passes
                </button>
              </div>
            </div>

            {/* 4 Modern Metric Cards */}
            <div className="v-kpi-grid">
              <div className="v-kpi-card">
                <div className="v-kpi-label">TOTAL CROPS INVENTORY</div>
                <div className="v-kpi-value text-green">{totalInventoryWeight} KGs</div>
              </div>
              <div className="v-kpi-card">
                <div className="v-kpi-label">ESTIMATED ASSET VALUE</div>
                <div className="v-kpi-value">₹{Math.round(totalInventoryValue).toLocaleString('en-IN')}</div>
              </div>
              <div className="v-kpi-card">
                <div className="v-kpi-label">ACTIVE APPLICATIONS</div>
                <div className="v-kpi-value">{activeOrders.length} Applications</div>
              </div>
              <div className="v-kpi-card" onClick={() => setShowWeatherModal(true)} style={{ cursor: 'pointer' }}>
                <div className="v-kpi-label">LOCAL WEATHER (CLICK 12H)</div>
                <div className="v-kpi-value" style={{ fontSize: '1.25rem' }}>{weatherData.icon} {weatherData.temp}</div>
              </div>
            </div>

            {/* TWO-COLUMN DASHBOARD WORKSPACE */}
            <div className="v-dashboard-two-col-layout">
              {/* LEFT / MAIN COLUMN */}
              <div className="v-dash-main-col">
                {/* Active Application / Gate Pass Card */}
                <div className="v-active-booking-card">
                  <div className="v-card-top-row">
                    <div>
                      <span className="v-card-subtitle">LATEST PROCUREMENT APPLICATION</span>
                      <h3 className="v-card-token">
                        {activeOrders[0] ? activeOrders[0].token : 'No Active Booking'}
                      </h3>
                    </div>
                    {activeOrders[0] && (
                      <span
                        className={`pill-badge ${
                          activeOrders[0].status === 'Procured'
                            ? 'pill-badge-green'
                            : activeOrders[0].status === 'VAO Verified'
                            ? 'pill-badge-blue'
                            : 'pill-badge-yellow'
                        }`}
                      >
                        {activeOrders[0].status}
                      </span>
                    )}
                  </div>

                  {activeOrders[0] ? (
                    <div className="v-booking-specs-grid">
                      <div className="v-spec-item">
                        <small>CROP & VOLUME</small>
                        <strong>🌾 {activeOrders[0].item} ({activeOrders[0].quantity} KGs)</strong>
                      </div>
                      <div className="v-spec-item">
                        <small>MANDI ZONE</small>
                        <strong>📍 {activeOrders[0].zone} {activeOrders[0].subPlace ? `• ${activeOrders[0].subPlace}` : ''}</strong>
                      </div>
                      <div className="v-spec-item">
                        <small>SLOT SCHEDULE</small>
                        <strong>⏰ {activeOrders[0].datetime || 'Awaiting Officer Allotment'}</strong>
                      </div>
                      <div className="v-spec-item">
                        <small>PATTA / CHITTA</small>
                        <strong>📄 {activeOrders[0].pattaChitta || 'Submitted'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="v-no-orders-prompt">
                      <p>
                        You haven't submitted any crop procurement applications yet. Click <b>"Sell to Market"</b> below to book your slot at the nearest mandi.
                      </p>
                    </div>
                  )}

                  <div className="v-booking-actions-row">
                    <button
                      type="button"
                      className="v-link-btn"
                      onClick={() => changeTab('track')}
                    >
                      View full application timeline →
                    </button>
                    {activeOrders[0] && (
                      <button
                        type="button"
                        className="v-mini-pdf-btn"
                        onClick={() => handleDownloadGatePass(activeOrders[0])}
                      >
                        📥 Download Gate Pass PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Live Market Rates Table */}
                <div className="v-table-card">
                  <div className="v-table-card-header">
                    <div>
                      <h4>{l.liveCropMarket}</h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                        Real-time APMC Mandi rates with fluctuating trendlines
                      </p>
                    </div>
                    <button
                      type="button"
                      className="v-view-all-link"
                      onClick={() => changeTab('procurement')}
                    >
                      View All Crops →
                    </button>
                  </div>

                  <div className="v-table-responsive">
                    <table className="v-clean-table">
                      <thead>
                        <tr>
                          <th>{l.cropName}</th>
                          <th>{l.pastRates}</th>
                          <th>{l.liveRate}</th>
                          <th>{l.action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(initialRates).slice(0, 4).map((crop) => (
                          <tr key={crop}>
                            <td>
                              <b>{getCropName(crop)}</b>
                            </td>
                            <td style={{ width: '120px' }}>
                              <Sparkline data={marketHistory[crop]} />
                            </td>
                            <td>
                              <b>₹{marketRates[crop]?.toFixed(2)}</b> / Kg
                            </td>
                            <td>
                              <button
                                type="button"
                                className="v-btn-procure-action"
                                onClick={() => {
                                  setOrderingItem(crop);
                                  changeTab('procurement');
                                }}
                              >
                                {l.sellMarket}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT / SIDE COLUMN (FRONT-FACING WIDGETS) */}
              <div className="v-dash-side-col">
                {/* WIDGET 1: MANDI LIVE QUEUE STATUS */}
                <div className="v-side-widget v-live-queue-widget">
                  <div className="v-side-widget-header">
                    <div className="v-side-title-row">
                      <span className="v-lq-pulse" />
                      <strong>MANDI LIVE QUEUE</strong>
                    </div>
                    <span className="v-side-chip green">Gate #2 Active</span>
                  </div>

                  <div className="v-side-lq-body">
                    <div className="v-side-lq-metric">
                      <small>NOW WEIGHING</small>
                      <h3>
                        {activeOrders[0]?.status === 'Processing'
                          ? activeOrders[0].token
                          : 'PDC-A004'}
                      </h3>
                    </div>
                    <div className="v-side-lq-metric">
                      <small>PEOPLE AHEAD</small>
                      <h3>0 Ahead</h3>
                    </div>
                  </div>

                  <div className="v-side-lq-meta">
                    <div>⏱️ <b>Avg. Wait:</b> ~12 mins</div>
                    <div>📍 <b>Yard:</b> {activeOrders[0]?.zone ? `${activeOrders[0].zone} APMC` : 'Central Mandi'}</div>
                  </div>

                  <button
                    type="button"
                    className="v-side-widget-btn"
                    onClick={() => changeTab('track')}
                  >
                    Check Live Status →
                  </button>
                </div>

                {/* WIDGET 2: WEATHER & MICROCLIMATE ADVISORY */}
                <div className="v-side-widget v-weather-widget">
                  <div className="v-side-widget-header">
                    <div className="v-side-title-row">
                      <span>🌤️</span>
                      <strong>WEATHER & ADVISORY</strong>
                    </div>
                    <span className="v-side-chip blue">{weatherData.temp}</span>
                  </div>

                  <div className="v-side-weather-body">
                    <div className="v-weather-current-row">
                      <span className="v-weather-big-icon">{weatherData.icon}</span>
                      <div>
                        <strong>{weatherData.condition}</strong>
                        <small>Field Location: {weatherData.locationName}</small>
                      </div>
                    </div>
                    <div className="v-weather-tip-box">
                      <span>🌾 <b>Agri Note:</b> Clear sunny skies. Optimal condition for harvesting & open-yard grain drying.</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="v-side-widget-btn outline"
                    onClick={() => setShowWeatherModal(true)}
                  >
                    View 24-Hour Forecast →
                  </button>
                </div>

                {/* WIDGET 3: AI SMART HARVEST ADVISORY */}
                <div className="v-side-widget v-ai-widget">
                  <div className="v-side-widget-header">
                    <div className="v-side-title-row">
                      <span>🤖</span>
                      <strong>AI SMART ADVISORY</strong>
                    </div>
                    <span className="v-side-chip purple">Trending Up ▲</span>
                  </div>

                  <div className="v-side-ai-content">
                    <p>
                      <b>Paddy (Kuruvai):</b> Mandi rate is up <b>+3.8%</b> this week. Recommended to lock your procurement application early.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="v-side-widget-btn"
                    onClick={() => changeTab('ai')}
                  >
                    Open AI Insights →
                  </button>
                </div>

                {/* WIDGET 4: MY CROPS INVENTORY SUMMARY */}
                <div className="v-side-widget v-stock-widget">
                  <div className="v-side-widget-header">
                    <div className="v-side-title-row">
                      <span>🌾</span>
                      <strong>MY HARVEST STOCK</strong>
                    </div>
                    <span className="v-side-chip green">{totalInventoryWeight} KG</span>
                  </div>

                  <div className="v-side-stock-list">
                    {myCrops.length === 0 ? (
                      <p className="v-empty-stock-text">
                        No crops added yet. Add crops to estimate asset value.
                      </p>
                    ) : (
                      myCrops.slice(0, 3).map((crop) => (
                        <div key={crop.id} className="v-side-stock-item">
                          <div>
                            <strong>{crop.name}</strong>
                            <small>{crop.weightKg} kg</small>
                          </div>
                          <span>₹{((crop.weightKg || 0) * (marketRates[crop.name] || crop.ratePerKg || 25)).toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="v-side-widget-btn outline"
                    onClick={() => changeTab('crops')}
                  >
                    Manage Inventory →
                  </button>
                </div>

                {/* WIDGET 5: KISAN SUPPORT & HELPLINE */}
                <div className="v-side-widget v-support-widget">
                  <div className="v-side-widget-header">
                    <div className="v-side-title-row">
                      <span>📞</span>
                      <strong>TOLL-FREE SUPPORT</strong>
                    </div>
                    <span className="v-side-chip yellow">24x7</span>
                  </div>
                  <div className="v-side-support-body">
                    <h3>1800-425-166</h3>
                    <small>Official Mandi Assistance & Grievances</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="v-tab-profile">
            {!isEditingProfile ? (
              <div className="v-profile-card">
                <div className="v-profile-top">
                  <div className="v-p-avatar-wrap">
                    <div className="v-p-avatar">
                      {userProfile.photoUrl ? (
                        <img
                          src={userProfile.photoUrl}
                          alt={userProfile.name}
                          className="v-profile-img"
                        />
                      ) : (
                        userProfile.name?.charAt(0)?.toUpperCase() || 'F'
                      )}
                    </div>
                  </div>
                  <div className="v-profile-title-block">
                    <h2>{userProfile.name}</h2>
                    <div className="v-profile-tags">
                      <span className="pill-badge pill-badge-green">{l.verified}</span>
                      <span className="pill-badge pill-badge-blue">🌾 {l.farmManager}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="v-edit-profile-btn"
                    onClick={handleStartEditProfile}
                  >
                    ✏️ {l.editProfile || 'Edit Profile'}
                  </button>
                </div>

                <div className="v-profile-section-title">{l.userDetails}</div>
                <div className="v-profile-grid">
                  <div className="v-pg-item">
                    <small>{l.fullName}</small>
                    <strong>{userProfile.name || 'Not provided'}</strong>
                  </div>
                  <div className="v-pg-item">
                    <small>{l.emailAddr}</small>
                    <strong>{userProfile.email}</strong>
                  </div>
                  <div className="v-pg-item">
                    <small>{l.phoneNumber}</small>
                    <strong>{userProfile.phone ? `+91 ${userProfile.phone}` : 'Not provided'}</strong>
                  </div>
                  <div className="v-pg-item">
                    <small>{l.role}</small>
                    <strong>{l.farmManager}</strong>
                  </div>
                  <div className="v-pg-item">
                    <small>{l.jurisdictionZone || 'Jurisdiction Zone'}</small>
                    <strong>{userProfile.zone || 'Central Mandi District'}</strong>
                  </div>
                  <div className="v-pg-item">
                    <small>{l.villageSubPlace || 'Village / Mandi Sub-Place'}</small>
                    <strong>{userProfile.subPlace || 'Main APMC Mandi'}</strong>
                  </div>
                  <div className="v-pg-item" style={{ gridColumn: 'span 2' }}>
                    <small>{l.farmLocationAddress || 'Farm Location / Address'}</small>
                    <strong>{userProfile.address || 'Survey No. 42/1A, Agricultural Belt'}</strong>
                  </div>
                  <div className="v-pg-item">
                    <small>{l.accountStatus}</small>
                    <strong>{l.verified}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="v-profile-card v-profile-edit-card">
                <div className="v-profile-top">
                  <div className="v-p-avatar-wrap">
                    <div className="v-p-avatar">
                      {profileFormData.photoUrl ? (
                        <img
                          src={profileFormData.photoUrl}
                          alt="Preview"
                          className="v-profile-img"
                        />
                      ) : (
                        profileFormData.name?.charAt(0)?.toUpperCase() || 'F'
                      )}
                    </div>
                    <div className="v-avatar-edit-controls">
                      <label className="v-avatar-upload-trigger">
                        📷 {l.changePhoto || 'Change Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {profileFormData.photoUrl && (
                        <button
                          type="button"
                          className="v-avatar-remove-btn"
                          onClick={handleRemovePhoto}
                        >
                          🗑️ {l.removePhoto || 'Remove Photo'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="v-profile-title-block">
                    <h2>{l.editProfile || 'Edit Profile'}</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      Update your personal details, phone number, location, and avatar.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="v-profile-edit-form">
                  <div className="v-profile-form-grid">
                    <div className="v-form-field">
                      <label>{l.fullName} *</label>
                      <input
                        type="text"
                        required
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="v-form-field">
                      <label>{l.emailAddr} (Read-only)</label>
                      <input
                        type="email"
                        disabled
                        value={userProfile.email}
                        style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                      />
                    </div>

                    <div className="v-form-field">
                      <label>{l.phoneNumber} *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit phone number"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                      />
                    </div>

                    <div className="v-form-field">
                      <label>{l.jurisdictionZone || 'Jurisdiction District / Zone'}</label>
                      <input
                        type="text"
                        placeholder="e.g. Trichy"
                        value={profileFormData.zone}
                        onChange={(e) => setProfileFormData({ ...profileFormData, zone: e.target.value })}
                      />
                    </div>

                    <div className="v-form-field">
                      <label>{l.villageSubPlace || 'Village / Mandi Sub-Place'}</label>
                      <input
                        type="text"
                        placeholder="e.g. Lalgudi Central / APMC Yard #2"
                        value={profileFormData.subPlace}
                        onChange={(e) => setProfileFormData({ ...profileFormData, subPlace: e.target.value })}
                      />
                    </div>

                    <div className="v-form-field" style={{ gridColumn: 'span 2' }}>
                      <label>{l.farmLocationAddress || 'Farm Location / Survey Address'}</label>
                      <input
                        type="text"
                        placeholder="e.g. SF No. 42/B, Green Field Belt"
                        value={profileFormData.address}
                        onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="v-profile-edit-actions">
                    <button
                      type="button"
                      className="v-btn-profile-cancel"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      {l.cancel || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="v-btn-profile-save"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? 'Saving Changes...' : (l.saveChanges || 'Save Changes ✓')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY CROPS (Inventory) */}
        {activeTab === 'crops' && (
          <div className="v-tab-booking">
            {/* Add Crop Card */}
            <div className="v-booking-card" style={{ maxWidth: '800px' }}>
              <div className="v-booking-card-head">
                <div className="head-icon">🌾</div>
                <div>
                  <h3>{l.addCropTitle}</h3>
                  <p>Record your harvest and lock in live market rates</p>
                </div>
              </div>

              <form onSubmit={handleAddCrop}>
                <div className="v-form-row">
                  <div className="v-form-field">
                    <label>{l.cropName}</label>
                    <select
                      required
                      value={newCrop.name}
                      onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })}
                    >
                      <option value="">{l.selectCrop}</option>
                      {Object.keys(initialRates).map((crop) => (
                        <option key={crop} value={crop}>
                          {getCropName(crop)} (₹{marketRates[crop]?.toFixed(2)}/Kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="v-form-field">
                    <label>{l.weightKg}</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500"
                      value={newCrop.weightKg}
                      onChange={(e) => setNewCrop({ ...newCrop, weightKg: e.target.value })}
                    />
                    {newCrop.name && newCrop.weightKg && (
                      <small style={{ marginTop: '5px', color: '#15803d', fontWeight: 700 }}>
                        Estimated Value: ₹{(parseFloat(newCrop.weightKg) * (marketRates[newCrop.name] || 0)).toLocaleString('en-IN')}
                      </small>
                    )}
                  </div>
                </div>

                <button type="submit" className="v-btn-green-step" style={{ maxWidth: '200px' }}>
                  + {l.addCropBtn}
                </button>
              </form>
            </div>

            {/* Inventory List */}
            <div className="v-table-card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <div className="v-table-card-header">
                <h4>{l.myCropInventory}</h4>
              </div>

              {myCrops.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>
                  {l.emptyInventory}
                </p>
              ) : (
                <div className="v-table-responsive">
                  <table className="v-clean-table">
                    <thead>
                      <tr>
                        <th>{l.cropName}</th>
                        <th>{l.weightKg}</th>
                        <th>{l.lockedRate}</th>
                        <th>TOTAL VALUE</th>
                        <th>{l.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myCrops.map((c) => (
                        <tr key={c.id}>
                          <td><b>{getCropName(c.name)}</b></td>
                          <td>{c.weightKg} Kg</td>
                          <td>₹{c.ratePerKg?.toFixed(2)}/Kg</td>
                          <td><b>₹{(c.weightKg * (c.ratePerKg || 25)).toLocaleString('en-IN')}</b></td>
                          <td>
                            <button
                              type="button"
                              className="v-btn-cancel-booking"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              onClick={() => handleDeleteCrop(c.id)}
                            >
                              {l.remove}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROCUREMENT (Market Prices & Sell Application to VAO) */}
        {activeTab === 'procurement' && (
          <div className="v-tab-dashboard">
            {/* Live Ticker Table */}
            <div className="v-table-card">
              <div className="v-table-card-header">
                <h4>{l.liveCropMarket}</h4>
              </div>
              <div className="v-table-responsive">
                <table className="v-clean-table">
                  <thead>
                    <tr>
                      <th>{l.cropName}</th>
                      <th>{l.pastRates}</th>
                      <th>{l.liveRate}</th>
                      <th>{l.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(initialRates).map((crop) => (
                      <tr key={crop}>
                        <td><b>{getCropName(crop)}</b></td>
                        <td style={{ width: '130px' }}>
                          <Sparkline data={marketHistory[crop]} />
                        </td>
                        <td>
                          <b>₹{marketRates[crop]?.toFixed(2)}</b> / Kg
                        </td>
                        <td>
                          <button
                            type="button"
                            className="v-btn-procure-action"
                            onClick={() => setOrderingItem(crop)}
                          >
                            {l.sellMarket}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Application Modal / Form when "Sell to Market" is clicked */}
            {orderingItem && (
              <div className="v-modal-overlay" onClick={() => setOrderingItem(null)}>
                <div className="v-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                  <div className="v-modal-header">
                    <h4>{l.procurementApp}</h4>
                    <button
                      type="button"
                      className="v-close-modal"
                      onClick={() => setOrderingItem(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <p className="v-modal-sub">
                    {l.applyingFor} <b>{getCropName(orderingItem)}</b> (@ ₹{marketRates[orderingItem]?.toFixed(2)}/Kg)
                  </p>

                  <form onSubmit={submitOrder}>
                    <div className="v-form-row">
                      <div className="v-form-field">
                        <label>{l.quantity}</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 50"
                          value={orderDetails.quantity}
                          onChange={(e) => setOrderDetails({ ...orderDetails, quantity: e.target.value })}
                        />
                      </div>
                      <div className="v-form-field">
                        <label>{l.selectZone}</label>
                        <select
                          required
                          value={orderDetails.zone}
                          onChange={(e) => handleZoneChange(e.target.value)}
                        >
                          <option value="">{l.selectZone}</option>
                          {availableZones.map((z) => (
                            <option key={z} value={z}>{z}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="v-form-field">
                      <label>{l.selectSubPlace}</label>
                      <select
                        required
                        value={orderDetails.subPlace}
                        onChange={(e) => setOrderDetails({ ...orderDetails, subPlace: e.target.value })}
                      >
                        <option value="">{l.selectSubPlace}</option>
                        {availableSubPlaces.map((sp) => (
                          <option key={sp} value={sp}>{sp}</option>
                        ))}
                      </select>
                    </div>

                    <div className="v-form-field">
                      <label>{l.farmAddress}</label>
                      <input
                        type="text"
                        required
                        placeholder="Village, Survey No, Landmark"
                        value={orderDetails.address}
                        onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })}
                      />
                    </div>

                    <div className="v-form-field">
                      <label>{l.pattaChitta}</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TN-PATTA-84920"
                        value={orderDetails.pattaChitta}
                        onChange={(e) => setOrderDetails({ ...orderDetails, pattaChitta: e.target.value })}
                      />
                    </div>

                    <div className="v-form-field">
                      <label>{l.uploadDoc}</label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        required
                        onChange={(e) => setPattaFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    {orderDetails.quantity && (
                      <div className="v-success-banner" style={{ margin: '12px 0' }}>
                        <span>💰 Estimated Payout: ₹{((parseFloat(orderDetails.quantity) || 0) * (marketRates[orderingItem] || 25)).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="v-modal-actions">
                      <button
                        type="button"
                        className="v-btn-modal-cancel"
                        onClick={() => setOrderingItem(null)}
                      >
                        {l.cancel}
                      </button>
                      <button
                        type="submit"
                        className="v-btn-modal-confirm"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : `✓ ${l.confirmOrder}`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TRACK STATUS (Orders, Gate Passes & Reschedule) */}
        {activeTab === 'track' && (
          <div className="v-tab-token">
            <div className="v-hero-greeting-card">
              <div>
                <h1>{l.upcomingProcurements}</h1>
                <p>Track land record verification by VAO, time slot allocation, and download official Gate Passes.</p>
              </div>
            </div>

            {activeOrders.length === 0 ? (
              <div className="v-empty-card">
                <div className="empty-icon">📦</div>
                <h3>{l.noActiveOrders}</h3>
                <p>Apply for crop procurement to track your verification and gate passes.</p>
                <button
                  type="button"
                  className="v-primary-action-btn"
                  onClick={() => changeTab('procurement')}
                >
                  + Apply for Procurement
                </button>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div key={order.id} className="v-gate-pass-card" style={{ marginBottom: '24px' }}>
                  <div className="v-qr-section">
                    <div className="v-qr-box">
                      <svg viewBox="0 0 120 120" width="120" height="120">
                        <rect width="120" height="120" fill="white" />
                        <rect x="10" y="10" width="30" height="30" fill="#0f172a" />
                        <rect x="15" y="15" width="20" height="20" fill="white" />
                        <rect x="20" y="20" width="10" height="10" fill="#0f172a" />
                        <rect x="80" y="10" width="30" height="30" fill="#0f172a" />
                        <rect x="85" y="15" width="20" height="20" fill="white" />
                        <rect x="90" y="20" width="10" height="10" fill="#0f172a" />
                        <rect x="10" y="80" width="30" height="30" fill="#0f172a" />
                        <rect x="15" y="85" width="20" height="20" fill="white" />
                        <rect x="20" y="90" width="10" height="10" fill="#0f172a" />
                        <rect x="50" y="20" width="20" height="10" fill="#0f172a" />
                        <rect x="50" y="50" width="20" height="20" fill="#0f172a" />
                        <rect x="80" y="50" width="30" height="10" fill="#0f172a" />
                      </svg>
                    </div>
                    {/* EXTRA FEATURE: Download Gate Pass PDF */}
                    <button
                      type="button"
                      className="v-download-pass-btn"
                      onClick={() => handleDownloadPass(order)}
                    >
                      📥 Download Gate Pass (PDF)
                    </button>
                  </div>

                  <div className="v-token-head">
                    <small>TOKEN IDENTIFIER</small>
                    <h2>{order.token}</h2>
                    <span
                      className={`pill-badge ${
                        order.status === 'Procured' || order.status === 'Completed'
                          ? 'pill-badge-green'
                          : order.status === 'VAO Verified'
                          ? 'pill-badge-blue'
                          : 'pill-badge-yellow'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="v-token-details-grid">
                    <div className="v-td-item">
                      <small>CROP ITEM</small>
                      <strong>{order.item} ({order.quantity} KGs/Qtl)</strong>
                    </div>
                    <div className="v-td-item">
                      <small>ZONE & VILLAGE</small>
                      <strong>{order.zone} ({order.subPlace})</strong>
                    </div>
                    <div className="v-td-item">
                      <small>SCHEDULED SLOT</small>
                      <strong>{order.datetime || 'TBD by Officer'}</strong>
                    </div>
                    <div className="v-td-item">
                      <small>PATTA / CHITTA DOC</small>
                      <strong>{order.pattaChitta || 'Submitted'}</strong>
                    </div>
                  </div>

                  <div className="v-token-actions">
                    <button
                      type="button"
                      className="v-btn-reschedule"
                      onClick={() => {
                        setSelectedOrderForReschedule(order);
                        setShowRescheduleModal(true);
                      }}
                    >
                      📅 Request Reschedule
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedOrderForReschedule && (
              <div className="v-modal-overlay">
                <div className="v-modal-card">
                  <div className="v-modal-header">
                    <h4>Request Slot Reschedule</h4>
                    <button
                      type="button"
                      className="v-close-modal"
                      onClick={() => setShowRescheduleModal(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <p className="v-modal-sub">
                    Token: <b>{selectedOrderForReschedule.token}</b>
                  </p>

                  <div className="v-form-field">
                    <label>Preferred Date</label>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Preferred Time Slot</label>
                    <select
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                    >
                      <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                    </select>
                  </div>

                  <div className="v-modal-actions">
                    <button
                      type="button"
                      className="v-btn-modal-cancel"
                      onClick={() => setShowRescheduleModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="v-btn-modal-confirm"
                      onClick={handleConfirmReschedule}
                    >
                      Send Reschedule Request
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AI INSIGHTS */}
        {activeTab === 'ai' && (
          <div className="v-tab-dashboard">
            <div className="v-hero-greeting-card">
              <div>
                <h1>🤖 {l.aiAnalysis}</h1>
                <p>{l.aiReport}</p>
              </div>
            </div>

            <div className="v-kpi-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="v-kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
                <div className="v-kpi-label">🌱 NITROGEN MANAGEMENT</div>
                <p style={{ fontSize: '0.95rem', margin: '6px 0', color: '#334155' }}>{l.aiTip1}</p>
              </div>

              <div className="v-kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
                <div className="v-kpi-label">📈 MARKET STRATEGY</div>
                <p style={{ fontSize: '0.95rem', margin: '6px 0', color: '#334155' }}>{l.aiTip2}</p>
              </div>

              <div className="v-kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div className="v-kpi-label">🌦️ PEST & WEATHER RISK</div>
                <p style={{ fontSize: '0.95rem', margin: '6px 0', color: '#334155' }}>{l.aiTip3}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: HELP & SUPPORT */}
        {activeTab === 'help' && (
          <div className="v-tab-help">
            <div className="v-help-card">
              <div className="v-help-head">
                <div className="help-icon">❓</div>
                <h3>{l.helpTitle}</h3>
                <p>{l.helpIntro}</p>
              </div>

              <div className="v-help-grid">
                <div className="v-help-box">
                  <span className="box-icon">📞</span>
                  <strong>Call Mandi Helpdesk</strong>
                  <p>1800-123-4567</p>
                  <small>(Toll Free Support)</small>
                </div>

                <div className="v-help-box">
                  <span className="box-icon">✉️</span>
                  <strong>Email Assistance</strong>
                  <p>support@farmflow.ai</p>
                  <small>Reply within 24 hours</small>
                </div>

                <div className="v-help-box">
                  <span className="box-icon">📄</span>
                  <strong>Official Guidelines</strong>
                  <p>Read APMC Rules</p>
                  <small>Find quick answers</small>
                </div>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'left', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px' }}>Dashboard Overview:</h4>
                <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '0.88rem', lineHeight: '1.8' }}>
                  <li><b>{l.helpCrops}</b></li>
                  <li><b>{l.helpProcurement}</b></li>
                  <li><b>{l.helpTrack}</b></li>
                  <li><b>{l.helpAi}</b></li>
                  <li><b>{l.helpProfile}</b></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* WEATHER MODAL */}
      {showWeatherModal && (
        <div className="v-modal-overlay" onClick={() => setShowWeatherModal(false)}>
          <div className="v-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="v-modal-header">
              <h4>📍 {weatherData.locationName} - {l.weather}</h4>
              <button
                type="button"
                className="v-close-modal"
                onClick={() => setShowWeatherModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '14px 0' }}>
              <span style={{ fontSize: '2.5rem' }}>{weatherData.icon}</span>
              <div>
                <h2 style={{ margin: 0 }}>{weatherData.temp}</h2>
                <p style={{ margin: 0, color: '#64748b' }}>{weatherData.condition}</p>
              </div>
            </div>

            <div style={{ margin: '16px 0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                24-Hour Hourly Forecast:
              </h5>
              <small style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                Next 24 Hours From Now
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px' }}>
              {hourlyForecast.map((h, i) => (
                <div
                  key={i}
                  style={{
                    background: i === 0 ? '#f0fdf4' : '#f8fafc',
                    border: i === 0 ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    textAlign: 'center',
                    minWidth: '78px',
                    flexShrink: 0
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: i === 0 ? '#15803d' : '#94a3b8', textTransform: 'uppercase' }}>
                    {h.day || 'Today'}
                  </div>
                  <small style={{ color: i === 0 ? '#166534' : '#475569', fontWeight: 600, display: 'block', margin: '2px 0' }}>
                    {h.time}
                  </small>
                  <div style={{ fontSize: '1.35rem', margin: '4px 0' }} title={h.condition || ''}>
                    {h.icon}
                  </div>
                  <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>{h.temp}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;