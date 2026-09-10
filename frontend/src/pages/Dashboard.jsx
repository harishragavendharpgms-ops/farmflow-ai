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

import './Dashboard.css';

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

const getWeatherMeta = (code) => {
  if (code === 0) return { label: "Clear sky", icon: "☀️" };
  if (code > 0 && code < 4) return { label: "Partly cloudy", icon: "⛅" };
  if (code >= 45 && code < 50) return { label: "Foggy / Misty", icon: "🌫️" };
  if (code >= 50 && code < 80) return { label: "Rainy", icon: "🌧️" };
  if (code >= 80 && code < 90) return { label: "Showers", icon: "🌦️" };
  if (code >= 90) return { label: "Thunderstorm", icon: "⛈️" };

  return { label: "Clear", icon: "🌤️" };
};

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
    module: "Module",
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
    upcomingProcurements: "Upcoming Procurements",
    noActiveOrders: "No active orders at the moment.",
    aiAnalysis: "AI Analysis",
    aiReport: "Weekly Insight Report generated:",
    aiTip1:
      "Nitrogen levels in your fields may be dropping. Recommended to apply Urea by Thursday.",
    aiTip2:
      "Market conditions suggest holding wheat sales for 2 weeks to maximize profit.",
    aiTip3:
      "Weather analysis shows low risk of pests for the next 7 days.",
    helpTitle: "Help & Guide",
    helpIntro:
      "Welcome to FarmFlow AI! Here is how to use your dashboard:",
    helpProfile:
      "Profile: View your registered account details and status.",
    helpCrops:
      "My Crops: Add your harvested crops, enter the weight, and see the estimated live market value.",
    helpProcurement:
      "Procurement: View live fluctuating market rates. You can apply to sell your crops or buy farming supplies.",
    helpTrack:
      "Track Status: Monitor your VAO verification progress, assigned time slots, and direct benefit transfer (DBT) payouts.",
    helpAi:
      "AI Insights: Read weekly AI-generated advice to maximize your farm's profit and health."
  },

  hi: {
    navDashboard: "📊 डैशबोर्ड",
    navProfile: "👤 मेरी प्रोफ़ाइल",
    navCrops: "🌾 मेरी फसलें",
    navProcurement: "🛒 खरीद",
    navTrack: "📦 स्थिति ट्रैक करें",
    navAi: "🤖 एआई अंतर्दृष्टि",
    navHelp: "❓ सहायता",
    logout: "लॉग आउट",
    module: "मॉड्यूल",
    subtitle: "अपने स्मार्ट कृषि कार्यों को आसानी से प्रबंधित करें।",
    liveMarket: "लाइव मार्केट सक्रिय",
    userDetails: "उपयोगकर्ता विवरण",
    fullName: "पूरा नाम:",
    emailAddr: "ईमेल पता:",
    phoneNumber: "फ़ोन नंबर:",
    role: "भूमिका:",
    farmManager: "किसान",
    accountStatus: "खाता स्थिति:",
    verified: "सत्यापित 🟢",
    weather: "स्थानीय मौसम",
    pestAlert: "कीट चेतावनी",
    pestDesc: "आपके क्षेत्र में कोई सक्रिय खतरा नहीं पाया गया।",
    addCropTitle: "नई फसल इन्वेंटरी जोड़ें",
    selectCrop: "-- भारतीय फसल चुनें --",
    weightKg: "वजन (किलो)",
    addCropBtn: "फसल जोड़ें",
    myCropInventory: "मेरी फसल इन्वेंटरी",
    emptyInventory: "आपकी इन्वेंटरी वर्तमान में खाली है।",
    lockedRate: "लॉक्ड दर:",
    remove: "हटाएं",
    liveCropMarket: "लाइव फसल बाजार मूल्य",
    cropName: "फसल का नाम",
    pastRates: "पिछली दरें",
    liveRate: "लाइव दर और रुझान",
    action: "कार्रवाई",
    sellMarket: "बाजार में बेचें",
    procurementApp: "खरीद आवेदन",
    applyingFor: "इसके लिए आवेदन:",
    quantity: "मात्रा (किलो / बैग)",
    selectZone: "-- सक्रिय ज़ोन चुनें --",
    selectSubPlace: "-- उप-स्थान चुनें --",
    farmAddress: "विशिष्ट खेत का पता",
    pattaChitta: "पट्टा / चिट्टा दस्तावेज़ संख्या",
    uploadDoc:
      "पट्टा/चिट्टा अपलोड करें (JPG/PDF, Max 500KB)",
    confirmOrder: "VAO को सबमिट करें",
    cancel: "रद्द करें",
    upcomingProcurements: "आगामी खरीद",
    noActiveOrders: "इस समय कोई सक्रिय आदेश नहीं है।",
    aiAnalysis: "AI विश्लेषण",
    aiReport: "साप्ताहिक अंतर्दृष्टि रिपोर्ट जनरेट की गई:",
    aiTip1:
      "आपके खेतों में नाइट्रोजन का स्तर गिर सकता है। गुरुवार तक यूरिया लगाने की सलाह दी जाती है।",
    aiTip2:
      "बाजार की स्थिति अधिकतम लाभ के लिए गेहूं की बिक्री 2 सप्ताह तक रोकने का सुझाव देती है।",
    aiTip3:
      "मौसम विश्लेषण अगले 7 दिनों तक कीटों के कम जोखिम को दर्शाता है।",
    helpTitle: "सहायता और मार्गदर्शन",
    helpIntro:
      "FarmFlow AI में आपका स्वागत है! यहाँ बताया गया है कि अपने डैशबोर्ड का उपयोग कैसे करें:",
    helpProfile:
      "प्रोफ़ाइल: अपने पंजीकृत खाते का विवरण और स्थिति देखें।",
    helpCrops:
      "मेरी फसलें: अपनी काटी गई फसलें जोड़ें, वजन दर्ज करें, और अनुमानित लाइव बाजार मूल्य देखें।",
    helpProcurement:
      "खरीद: लाइव बाजार दरें देखें। आप अपनी फसल बेचने या कृषि आपूर्ति खरीदने के लिए आवेदन कर सकते हैं।",
    helpTrack:
      "स्थिति ट्रैक करें: अपने VAO सत्यापन, आवंटित स्लॉट और DBT भुगतान की निगरानी करें।",
    helpAi:
      "एआई अंतर्दृष्टि: अपने खेत के मुनाफे को अधिकतम करने के लिए एआई-जनित सलाह पढ़ें।"
  },

  ta: {
    navDashboard: "📊 டாஷ்போர்டு",
    navProfile: "👤 என் சுயவிவரம்",
    navCrops: "🌾 என் பயிர்கள்",
    navProcurement: "🛒 கொள்முதல்",
    navTrack: "📦 நிலை கண்காணிக்க",
    navAi: "🤖 AI ஆலோசனைகள்",
    navHelp: "❓ உதவி",
    logout: "வெளியேறு",
    module: "பிரிவு",
    subtitle: "உங்கள் பண்ணை செயல்பாடுகளை எளிதாக நிர்வகிக்கவும்.",
    liveMarket: "நேரடி சந்தை செயலில் உள்ளது",
    userDetails: "பயனர் விவரங்கள்",
    fullName: "முழு பெயர்:",
    emailAddr: "மின்னஞ்சல்:",
    phoneNumber: "தொலைபேசி எண்:",
    role: "பங்கு:",
    farmManager: "விவசாயி",
    accountStatus: "கணக்கு நிலை:",
    verified: "சரிபார்க்கப்பட்டது 🟢",
    weather: "உள்ளூர் வானிலை",
    pestAlert: "பூச்சி எச்சரிக்கை",
    pestDesc: "உங்கள் பகுதியில் எந்த அச்சுறுத்தலும் இல்லை.",
    addCropTitle: "புதிய பயிர் சேர்ப்பது",
    selectCrop: "-- இந்திய பயிரைத் தேர்ந்தெடுக்கவும் --",
    weightKg: "எடை (கிலோ)",
    addCropBtn: "பயிரைச் சேர்",
    myCropInventory: "என் பயிர் இருப்பு",
    emptyInventory: "உங்கள் இருப்பு காலியாக உள்ளது.",
    lockedRate: "பூட்டப்பட்ட விலை:",
    remove: "நீக்கு",
    liveCropMarket: "நேரடி பயிர் சந்தை விலைகள்",
    cropName: "பயிர் பெயர்",
    pastRates: "கடந்த விலைகள்",
    liveRate: "நேரடி விலை & போக்கு",
    action: "செயல்",
    sellMarket: "சந்தையில் விற்க",
    procurementApp: "கொள்முதல் விண்ணப்பம்",
    applyingFor: "விண்ணப்பிப்பது:",
    quantity: "அளவு (கிலோ / பைகள்)",
    selectZone: "-- மண்டலத்தைத் தேர்ந்தெடுக்கவும் --",
    selectSubPlace: "-- கிராமத்தைத் தேர்ந்தெடுக்கவும் --",
    farmAddress: "குறிப்பிட்ட பண்ணை முகவரி",
    pattaChitta: "பட்டா / சிட்டா ஆவண எண்",
    uploadDoc:
      "பட்டா/சிட்டாவை பதிவேற்றவும் (JPG/PDF, Max 500KB)",
    confirmOrder: "VAO க்கு சமர்ப்பிக்கவும்",
    cancel: "ரத்து செய்",
    upcomingProcurements: "வரவிருக்கும் கொள்முதல்",
    noActiveOrders: "தற்போது எந்த ஆர்டரும் இல்லை.",
    aiAnalysis: "AI பகுப்பாய்வு",
    aiReport: "வாராந்திர அறிக்கை:",
    aiTip1:
      "நைட்ரஜன் அளவுகள் குறையக்கூடும். வியாழக்கிழமைக்குள் யூரியா பயன்படுத்த பரிந்துரைக்கப்படுகிறது.",
    aiTip2:
      "லாபத்தை அதிகரிக்க கோதுமை விற்பனையை 2 வாரங்களுக்கு தாமதப்படுத்தவும்.",
    aiTip3:
      "அடுத்த 7 நாட்களுக்கு பூச்சிகள் தாக்கும் அபாயம் குறைவு.",
    helpTitle: "உதவி மற்றும் வழிகாட்டி",
    helpIntro:
      "FarmFlow AI-க்கு உங்களை வரவேற்கிறோம்! டாஷ்போர்டை எவ்வாறு பயன்படுத்துவது:",
    helpProfile:
      "சுயவிவரம்: உங்கள் கணக்கு விவரங்கள் மற்றும் நிலையைப் பார்க்கவும்.",
    helpCrops:
      "என் பயிர்கள்: உங்கள் அறுவடை பயிர்களைச் சேர்க்கவும், நேரடி சந்தை மதிப்பை அறியவும்.",
    helpProcurement:
      "கொள்முதல்: நேரடி சந்தை விலைகளை காணுங்கள். விற்க அல்லது வாங்க விண்ணப்பிக்கலாம்.",
    helpTrack:
      "நிலை கண்காணிக்க: VAO சரிபார்ப்பு, ஒதுக்கப்பட்ட நேரங்கள் மற்றும் DBT பரிமாற்றங்களை கண்காணிக்கவும்.",
    helpAi:
      "AI ஆலோசனைகள்: லாபத்தை அதிகரிக்க AI ஆலோசனைகளைப் படிக்கவும்."
  }
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const l = t[lang];

  const [marketRates, setMarketRates] = useState(initialRates);
  const [marketHistory, setMarketHistory] = useState(() =>
    generateInitialHistory(initialRates)
  );

  const [activeOrders, setActiveOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [vaoUsers, setVaoUsers] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [availableSubPlaces, setAvailableSubPlaces] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [latestNotification, setLatestNotification] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  const [weatherData, setWeatherData] = useState({
    temp: '--',
    condition: 'Fetching location weather...',
    locationName: 'Detecting location...',
    icon: '🌤️'
  });

  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const [myCrops, setMyCrops] = useState([]);

  const [orderingItem, setOrderingItem] = useState(null);

  const [orderDetails, setOrderDetails] = useState({
    zone: '',
    subPlace: '',
    address: '',
    quantity: '',
    pattaChitta: ''
  });

  const [pattaFile, setPattaFile] = useState(null);

  const [newCrop, setNewCrop] = useState({
    name: '',
    weightKg: ''
  });

  useEffect(() => {
    const savedUser =
      localStorage.getItem('farmflow_user') ||
      sessionStorage.getItem('farmflow_user');

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);

        if (parsed && parsed.email) {
          setUserProfile(parsed);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved user:", e);
      }
    }

    const demoUser = {
      name: "Rajesh Farmer",
      email: "rajesh@farmflow.com",
      phone: "9876543210",
      role: "farmer"
    };

    setUserProfile(demoUser);
    localStorage.setItem(
      'farmflow_user',
      JSON.stringify(demoUser)
    );
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setWeatherData({
        temp: 'N/A',
        condition: 'Geolocation is not supported.',
        locationName: 'Unavailable',
        icon: '📍'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto`
          );

          const weatherJson = await weatherRes.json();

          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );

          const geoJson = await geoRes.json();

          const locationString =
            geoJson.address?.city ||
            geoJson.address?.town ||
            geoJson.address?.village ||
            geoJson.address?.state ||
            "Your Location";

          const currentCode =
            weatherJson.current.weather_code;

          const meta = getWeatherMeta(currentCode);

          setWeatherData({
            temp: `${Math.round(
              weatherJson.current.temperature_2m
            )}°C`,
            condition: `${locationString}: ${meta.label}. Humidity: ${weatherJson.current.relative_humidity_2m}%`,
            locationName: locationString,
            icon: meta.icon
          });

          if (
            weatherJson.hourly &&
            weatherJson.hourly.time
          ) {
            const now = new Date();
            const currentHourNum = now.getHours();

            let startIndex =
              weatherJson.hourly.time.findIndex((time) => {
                const date = new Date(time);

                return (
                  date.getDate() === now.getDate() &&
                  date.getHours() === currentHourNum
                );
              });

            if (startIndex === -1) {
              startIndex = 0;
            }

            const next24Hours = [];

            for (
              let i = startIndex;
              i <
              Math.min(
                startIndex + 24,
                weatherJson.hourly.time.length
              );
              i++
            ) {
              const hourDate = new Date(
                weatherJson.hourly.time[i]
              );

              const timeLabel =
                i === startIndex
                  ? 'Now'
                  : hourDate.toLocaleTimeString([], {
                      hour: 'numeric',
                      hour12: true
                    });

              const code =
                weatherJson.hourly.weather_code[i];

              const hourMeta = getWeatherMeta(code);

              next24Hours.push({
                time: timeLabel,
                temp: `${Math.round(
                  weatherJson.hourly.temperature_2m[i]
                )}°C`,
                rainProb:
                  weatherJson.hourly
                    .precipitation_probability
                    ? weatherJson.hourly
                        .precipitation_probability[i]
                    : 0,
                icon: hourMeta.icon,
                label: hourMeta.label
              });
            }

            setHourlyForecast(next24Hours);
          }
        } catch (err) {
          console.error("Weather fetch failed", err);

          setWeatherData({
            temp: '--',
            condition: 'Unable to load live weather.',
            locationName: 'Weather Error',
            icon: '🌤️'
          });
        }
      },
      (error) => {
        console.warn(
          "Geolocation permission denied",
          error
        );

        setWeatherData({
          temp: 'N/A',
          condition:
            'Location permission denied. Enable GPS for live weather.',
          locationName: 'Location Disabled',
          icon: '📍'
        });
      }
    );
  }, []);

  useEffect(() => {
    const fetchVAOs = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', 'in', ['vao', 'officer'])
        );

        const querySnapshot = await getDocs(q);

        const usersList = querySnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

        setVaoUsers(usersList);

        const zones = usersList
          .map((v) => v.zone)
          .filter(Boolean);

        setAvailableZones([...new Set(zones)]);
      } catch (error) {
        console.error(
          "Error fetching locations:",
          error
        );
      }
    };

    fetchVAOs();
  }, []);

  const handleZoneChange = (zone) => {
    setOrderDetails((prev) => ({
      ...prev,
      zone,
      subPlace: ''
    }));

    const matchingUsers = vaoUsers.filter(
      (v) => v.zone === zone
    );

    const subPlaces = matchingUsers
      .map(
        (v) =>
          v.subPlace ||
          v.sub_place ||
          v.subZone ||
          v.sub_zone ||
          v.village ||
          v.location
      )
      .filter(Boolean);

    setAvailableSubPlaces([
      ...new Set(subPlaces)
    ]);
  };

  useEffect(() => {
    if (!userProfile.email) return;

    const userEmailLower =
      userProfile.email.toLowerCase();

    const qOrders = query(
      collection(db, 'orders'),
      where('userEmail', '==', userEmailLower)
    );

    const unsubOrders = onSnapshot(
      qOrders,
      async (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const updatedOrder = change.doc.data();

            setLatestNotification(
              `🔔 Update: Your ${updatedOrder.item} application status is now "${updatedOrder.status}"!`
            );

            setShowBanner(true);

            setTimeout(
              () => setShowBanner(false),
              7000
            );
          }
        });

        const ordersData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

        ordersData.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );

        for (const order of ordersData) {
          if (
            order.status === 'Procured' &&
            !order.inventoryDeducted
          ) {
            const matchingCrop = myCrops.find(
              (c) => c.name === order.item
            );

            if (matchingCrop) {
              const orderQty =
                parseFloat(order.quantity) || 0;

              const updatedWeight =
                matchingCrop.weightKg - orderQty;

              if (updatedWeight <= 0) {
                await deleteDoc(
                  doc(
                    db,
                    'crops',
                    matchingCrop.id
                  )
                );
              } else {
                await updateDoc(
                  doc(
                    db,
                    'crops',
                    matchingCrop.id
                  ),
                  {
                    weightKg: updatedWeight
                  }
                );
              }
            }

            await updateDoc(
              doc(db, 'orders', order.id),
              {
                inventoryDeducted: true
              }
            );
          }
        }

        setActiveOrders(ordersData);
      }
    );

    const qCrops = query(
      collection(db, 'crops'),
      where(
        'userEmail',
        '==',
        userEmailLower
      )
    );

    const unsubCrops = onSnapshot(
      qCrops,
      (snapshot) => {
        const cropsData = snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );

        setMyCrops(cropsData);
      }
    );

    return () => {
      unsubOrders();
      unsubCrops();
    };
  }, [userProfile.email, myCrops]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRates((prevRates) => {
        const newRates = {
          ...prevRates
        };

        const crops = Object.keys(newRates);

        const randomCrop =
          crops[
            Math.floor(
              Math.random() * crops.length
            )
          ];

        newRates[randomCrop] = Number(
          (
            newRates[randomCrop] *
            (1 +
              (Math.random() * 0.04 - 0.02))
          ).toFixed(2)
        );

        setMarketHistory((prev) => {
          const updated = {
            ...prev
          };

          updated[randomCrop] = [
            ...updated[randomCrop],
            newRates[randomCrop]
          ].slice(-15);

          return updated;
        });

        return newRates;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');

    navigate('/login');
  };

  const changeTab = (tab) => {
    setActiveTab(tab);

    if (tab !== 'procurement') {
      setOrderingItem(null);
    }

    setIsSidebarOpen(false);
  };

  const submitOrder = async (e) => {
    e.preventDefault();

    if (
      pattaFile &&
      pattaFile.size > 500 * 1024
    ) {
      alert(
        "File is too large! Please upload an image under 500KB."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let fileDataString = '';

      if (pattaFile) {
        const reader = new FileReader();

        fileDataString =
          await new Promise(
            (resolve, reject) => {
              reader.onload = () =>
                resolve(reader.result);

              reader.onerror = (error) =>
                reject(error);

              reader.readAsDataURL(
                pattaFile
              );
            }
          );
      }

      await addDoc(
        collection(db, 'orders'),
        {
          userName:
            userProfile.name || 'Unknown',

          userPhone:
            userProfile.phone || 'N/A',

          userEmail: userProfile.email
            ? userProfile.email.toLowerCase()
            : '',

          item: orderingItem,

          quantity:
            orderDetails.quantity,

          zone:
            orderDetails.zone,

          subPlace:
            orderDetails.subPlace,

          address:
            orderDetails.address,

          pattaChitta:
            orderDetails.pattaChitta,

          documentUrl:
            fileDataString,

          datetime:
            'TBD by Officer',

          status:
            'Pending VAO',

          inventoryDeducted:
            false,

          createdAt:
            new Date().toISOString()
        }
      );

      alert(
        `Success! Application sent to VAO in ${orderDetails.zone} (${orderDetails.subPlace}).`
      );

      setOrderingItem(null);

      setOrderDetails({
        zone: '',
        subPlace: '',
        address: '',
        quantity: '',
        pattaChitta: ''
      });

      setPattaFile(null);
    } catch (error) {
      console.error(error);
      alert(
        "Failed to submit order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();

    if (
      !newCrop.name ||
      !newCrop.weightKg ||
      !userProfile.email
    ) {
      return;
    }

    try {
      await addDoc(
        collection(db, 'crops'),
        {
          userEmail:
            userProfile.email.toLowerCase(),

          name:
            newCrop.name,

          weightKg:
            parseFloat(
              newCrop.weightKg
            ),

          ratePerKg:
            marketRates[
              newCrop.name
            ],

          createdAt:
            new Date().toISOString()
        }
      );

      setNewCrop({
        name: '',
        weightKg: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCrop = async (
    idToRemove
  ) => {
    try {
      await deleteDoc(
        doc(
          db,
          'crops',
          idToRemove
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const savedCropData =
    myCrops.find(
      (c) => c.name === orderingItem
    );

  const maxAvailableQuantity =
    savedCropData
      ? savedCropData.weightKg
      : undefined;

  const pageTitle = {
    dashboard: "Dashboard",
    profile: l.navProfile.substring(2),
    crops: l.navCrops.substring(2),
    procurement: l.navProcurement.substring(2),
    track: l.navTrack.substring(2),
    ai: l.navAi.substring(2),
    help: l.navHelp.substring(2)
  };

  const navItems = [
    {
      id: 'dashboard',
      label: l.navDashboard,
      icon: '📊'
    },
    {
      id: 'profile',
      label: l.navProfile,
      icon: '👤'
    },
    {
      id: 'crops',
      label: l.navCrops,
      icon: '🌾'
    },
    {
      id: 'procurement',
      label: l.navProcurement,
      icon: '🛒'
    },
    {
      id: 'track',
      label: l.navTrack,
      icon: '📦'
    },
    {
      id: 'ai',
      label: l.navAi,
      icon: '🤖'
    }
  ];

  return (
    <div className="dashboard-shell">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setIsSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar ${
          isSidebarOpen
            ? 'sidebar-open'
            : ''
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-icon">
            🌱
          </div>

          <div>
            <div className="brand-name">
              FarmFlow
            </div>

            <div className="brand-ai">
              AI FARM MANAGEMENT
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(userProfile.name ||
              'R')
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {userProfile.name ||
                'Farmer'}
            </strong>

            <span>
              {userProfile.email ||
                'FarmFlow User'}
            </span>
          </div>
        </div>

        <div className="sidebar-section-title">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${
                activeTab === item.id
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                changeTab(item.id)
              }
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              <span className="nav-label">
                {item.label.substring(2)}
              </span>

              {activeTab === item.id && (
                <span className="active-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-section-title sidebar-help-title">
          SUPPORT
        </div>

        <button
          type="button"
          className={`sidebar-nav-item ${
            activeTab === 'help'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            changeTab('help')
          }
        >
          <span className="nav-icon">
            ❓
          </span>

          <span className="nav-label">
            {l.navHelp.substring(2)}
          </span>

          {activeTab === 'help' && (
            <span className="active-indicator" />
          )}
        </button>

        <div className="sidebar-spacer" />

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <span>↪</span>
          {l.logout}
        </button>

        <div className="sidebar-footer">
          <span className="footer-dot" />
          FarmFlow AI v1.0
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="dashboard-main">

        {/* TOP HEADER */}
        <header className="dashboard-header">

          <div className="header-left">

            <button
              className="mobile-menu-button"
              onClick={() =>
                setIsSidebarOpen(
                  !isSidebarOpen
                )
              }
              type="button"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div>
              <div className="breadcrumb">
                FarmFlow AI
                <span>/</span>
                Dashboard
              </div>

              <h1>
                {pageTitle[activeTab]}
              </h1>

              <p>
                {l.subtitle}
              </p>
            </div>
          </div>

          <div className="header-right">

            <div className="language-switcher">
              {['en', 'hi', 'ta'].map(
                (language) => (
                  <button
                    key={language}
                    type="button"
                    className={
                      lang === language
                        ? 'language-active'
                        : ''
                    }
                    onClick={() =>
                      setLang(language)
                    }
                  >
                    {language.toUpperCase()}
                  </button>
                )
              )}
            </div>

            <div className="market-status">
              <span className="pulse-dot" />
              <span>
                {l.liveMarket}
              </span>
            </div>

            <div className="header-avatar">
              {(userProfile.name ||
                'R')
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        {/* NOTIFICATION */}
        {showBanner &&
          latestNotification && (
            <div className="notification-banner">
              <div className="notification-icon">
                🔔
              </div>

              <div className="notification-text">
                {latestNotification}
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowBanner(false)
                }
              >
                ×
              </button>
            </div>
          )}

        <div className="dashboard-content">

          {/* ================= HELP ================= */}
          {activeTab === 'help' && (
            <section className="content-section">

              <div className="page-intro-card">
                <div className="intro-icon">
                  ❓
                </div>

                <div>
                  <span className="eyebrow">
                    SUPPORT CENTER
                  </span>

                  <h2>
                    {l.helpTitle}
                  </h2>

                  <p>
                    {l.helpIntro}
                  </p>
                </div>
              </div>

              <div className="help-grid">

                {[
                  {
                    icon: '👤',
                    text: l.helpProfile
                  },
                  {
                    icon: '🌾',
                    text: l.helpCrops
                  },
                  {
                    icon: '🛒',
                    text: l.helpProcurement
                  },
                  {
                    icon: '📦',
                    text: l.helpTrack
                  },
                  {
                    icon: '🤖',
                    text: l.helpAi
                  }
                ].map(
                  (item, index) => (
                    <div
                      className="help-card"
                      key={index}
                    >
                      <div className="help-card-icon">
                        {item.icon}
                      </div>

                      <p>
                        {item.text}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* ================= PROFILE ================= */}
          {activeTab === 'profile' && (
            <section className="content-section">

              <div className="profile-hero">
                <div className="large-avatar">
                  {(userProfile.name ||
                    'R')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span className="eyebrow">
                    FARMER ACCOUNT
                  </span>

                  <h2>
                    {userProfile.name ||
                      'Rajesh Farmer'}
                  </h2>

                  <p>
                    {userProfile.email ||
                      'rajesh@farmflow.com'}
                  </p>
                </div>

                <div className="verified-badge">
                  ✓ Verified
                </div>
              </div>

              <div className="section-card">

                <div className="card-heading">
                  <div>
                    <span className="eyebrow">
                      ACCOUNT
                    </span>

                    <h3>
                      {l.userDetails}
                    </h3>
                  </div>

                  <span className="heading-icon">
                    👤
                  </span>
                </div>

                <div className="profile-details">

                  <div className="profile-detail">
                    <span>
                      {l.fullName}
                    </span>

                    <strong>
                      {userProfile.name ||
                        'Rajesh Farmer'}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.emailAddr}
                    </span>

                    <strong>
                      {userProfile.email ||
                        'rajesh@farmflow.com'}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.phoneNumber}
                    </span>

                    <strong>
                      {userProfile.phone ||
                        '9876543210'}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.role}
                    </span>

                    <strong>
                      {l.farmManager}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.accountStatus}
                    </span>

                    <strong className="status-success">
                      {l.verified}
                    </strong>
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* ================= DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <section className="content-section">

              {/* Welcome card */}
              <div className="welcome-banner">

                <div>
                  <span className="eyebrow">
                    FARM OVERVIEW
                  </span>

                  <h2>
                    Good day,{' '}
                    {(
                      userProfile.name ||
                      'Farmer'
                    ).split(' ')[0]}
                    ! 👋
                  </h2>

                  <p>
                    Here's your farm
                    activity at a glance.
                  </p>
                </div>

                <div className="welcome-illustration">
                  🌾
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon green">
                    🌾
                  </div>

                  <div>
                    <span>
                      Total Crops
                    </span>

                    <strong>
                      {myCrops.length}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    📦
                  </div>

                  <div>
                    <span>
                      Active Orders
                    </span>

                    <strong>
                      {activeOrders.length}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    💰
                  </div>

                  <div>
                    <span>
                      Market Crops
                    </span>

                    <strong>
                      {Object.keys(
                        marketRates
                      ).length}
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon purple">
                    🤖
                  </div>

                  <div>
                    <span>
                      AI Insights
                    </span>

                    <strong>
                      3
                    </strong>
                  </div>
                </div>

              </div>

              {/* Weather + Pest */}
              <div className="dashboard-two-column">

                <button
                  type="button"
                  className="weather-card"
                  onClick={() =>
                    setShowWeatherModal(true)
                  }
                >
                  <div className="card-top-line">

                    <div className="card-icon-large weather">
                      {weatherData.icon}
                    </div>

                    <span className="card-arrow">
                      →
                    </span>
                  </div>

                  <div className="weather-main">
                    <div>
                      <span className="eyebrow">
                        WEATHER
                      </span>

                      <h3>
                        {weatherData.temp}
                      </h3>
                    </div>
                  </div>

                  <p className="weather-location">
                    📍{' '}
                    {weatherData.locationName}
                  </p>

                  <p className="weather-description">
                    {weatherData.condition}
                  </p>

                  <div className="card-link">
                    View 24-hour forecast
                    <span>→</span>
                  </div>
                </button>

                <div className="pest-card">

                  <div className="card-top-line">

                    <div className="card-icon-large pest">
                      🐛
                    </div>

                    <span className="safe-badge">
                      SAFE
                    </span>
                  </div>

                  <span className="eyebrow">
                    FARM HEALTH
                  </span>

                  <h3>
                    {l.pestAlert}
                  </h3>

                  <p>
                    {l.pestDesc}
                  </p>

                  <div className="pest-status">
                    <span className="status-dot" />
                    No active threats
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="section-card">

                <div className="card-heading">

                  <div>
                    <span className="eyebrow">
                      RECENT ACTIVITY
                    </span>

                    <h3>
                      {l.upcomingProcurements}
                    </h3>
                  </div>

                  <div className="heading-icon">
                    📦
                  </div>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="empty-state">
                    <div>
                      📭
                    </div>

                    <h4>
                      No active orders
                    </h4>

                    <p>
                      {l.noActiveOrders}
                    </p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {activeOrders.map(
                      (order) => (
                        <div
                          key={order.id}
                          className="order-row"
                        >

                          <div className="order-main">

                            <div className="order-icon">
                              📦
                            </div>

                            <div>
                              <strong>
                                {order.item}
                              </strong>

                              <span>
                                {order.quantity}{' '}
                                Units •{' '}
                                {order.datetime}
                              </span>

                              <small>
                                📍{' '}
                                {order.zone ||
                                  'Zone'}{' '}
                                /{' '}
                                {order.subPlace ||
                                  'General'}
                              </small>
                            </div>
                          </div>

                          <span
                            className={`status-badge ${
                              order.status
                                ?.toLowerCase()
                                .includes(
                                  'vao'
                                )
                                ? 'status-purple'
                                : order.status ===
                                  'Approved'
                                ? 'status-green'
                                : order.status ===
                                  'Procured'
                                ? 'status-blue'
                                : order.status ===
                                  'Rejected'
                                ? 'status-red'
                                : 'status-orange'
                            }`}
                          >
                            {order.status}
                          </span>

                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

            </section>
          )}

          {/* ================= TRACK ================= */}
          {activeTab === 'track' && (
            <section className="content-section">

              <div className="page-intro-card track-intro">
                <div className="intro-icon">
                  📦
                </div>

                <div>
                  <span className="eyebrow">
                    PROCUREMENT TRACKER
                  </span>

                  <h2>
                    Real-Time Procurement
                  </h2>

                  <p>
                    Monitor applications,
                    verification, schedules
                    and DBT payment status.
                  </p>
                </div>
              </div>

              {activeOrders.length === 0 ? (
                <div className="section-card">
                  <div className="empty-state large">
                    <div>
                      📭
                    </div>

                    <h4>
                      No procurement
                      applications
                    </h4>

                    <p>
                      No active procurement
                      applications found
                      under your account.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="tracking-list">

                  {activeOrders.map(
                    (order) => (
                      <div
                        key={order.id}
                        className="tracking-card"
                      >

                        <div className="tracking-header">

                          <div>
                            <span className="eyebrow">
                              APPLICATION
                            </span>

                            <h3>
                              {order.item}
                            </h3>

                            <small>
                              ID: {order.id}
                            </small>
                          </div>

                          <span
                            className={`status-badge ${
                              order.status ===
                              'Procured'
                                ? 'status-green'
                                : order.status ===
                                  'Rejected'
                                ? 'status-red'
                                : 'status-orange'
                            }`}
                          >
                            {order.status ||
                              'Pending Verification'}
                          </span>
                        </div>

                        <div className="tracking-details">

                          <div className="tracking-info">

                            <div>
                              <span>
                                📍 Location
                              </span>

                              <strong>
                                {order.zone ||
                                  'N/A'}{' '}
                                /{' '}
                                {order.subPlace ||
                                  'General'}
                              </strong>
                            </div>

                            <div>
                              <span>
                                🏠 Address
                              </span>

                              <strong>
                                {order.address ||
                                  'N/A'}
                              </strong>
                            </div>

                            <div>
                              <span>
                                📅 Assigned Slot
                              </span>

                              <strong>
                                {order.datetime ||
                                  'TBD by Officer'}
                              </strong>
                            </div>
                          </div>

                          <div className="dbt-card">

                            <span>
                              💳 DBT PAYMENT
                            </span>

                            <strong>
                              {order.paymentStatus ||
                                'Awaiting Procurement Completion'}
                            </strong>

                            {order.payoutAmount && (
                              <b>
                                ₹
                                {
                                  order.payoutAmount
                                }{' '}
                                Credited
                              </b>
                            )}
                          </div>
                        </div>

                        <div className="timeline">

                          <div className="timeline-line" />

                          {[
                            {
                              label:
                                'Submitted',
                              active:
                                true
                            },
                            {
                              label:
                                'VAO Verified',
                              active:
                                order.status !==
                                'Pending VAO'
                            },
                            {
                              label:
                                'Slot Scheduled',
                              active:
                                order.datetime &&
                                order.datetime !==
                                  'TBD by Officer'
                            },
                            {
                              label:
                                'DBT Paid',
                              active:
                                order.status ===
                                'Procured'
                            }
                          ].map(
                            (
                              step,
                              index
                            ) => (
                              <div
                                key={index}
                                className={`timeline-step ${
                                  step.active
                                    ? 'active'
                                    : ''
                                }`}
                              >
                                <div className="timeline-dot">
                                  {step.active
                                    ? '✓'
                                    : index +
                                      1}
                                </div>

                                <span>
                                  {step.label}
                                </span>
                              </div>
                            )
                          )}

                        </div>
                      </div>
                    )
                  )}

                </div>
              )}
            </section>
          )}

          {/* ================= CROPS ================= */}
          {activeTab === 'crops' && (
            <section className="content-section">

              <div className="section-card">

                <div className="card-heading">
                  <div>
                    <span className="eyebrow">
                      INVENTORY
                    </span>

                    <h3>
                      {l.addCropTitle}
                    </h3>
                  </div>

                  <div className="heading-icon">
                    🌾
                  </div>
                </div>

                <form
                  onSubmit={handleAddCrop}
                  className="crop-form"
                >
                  <select
                    required
                    value={newCrop.name}
                    onChange={(e) =>
                      setNewCrop({
                        ...newCrop,
                        name: e.target.value
                      })
                    }
                  >
                    <option value="">
                      {l.selectCrop}
                    </option>

                    {Object.keys(
                      marketRates
                    ).map((crop) => (
                      <option
                        key={crop}
                        value={crop}
                      >
                        {crop} (₹
                        {marketRates[
                          crop
                        ].toFixed(2)}
                        /kg)
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={
                      l.weightKg
                    }
                    value={
                      newCrop.weightKg
                    }
                    onChange={(e) =>
                      setNewCrop({
                        ...newCrop,
                        weightKg:
                          e.target.value
                      })
                    }
                  />

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    <span>+</span>
                    {l.addCropBtn}
                  </button>
                </form>
              </div>

              <div className="section-card">

                <div className="card-heading">

                  <div>
                    <span className="eyebrow">
                      YOUR FARM
                    </span>

                    <h3>
                      {l.myCropInventory}
                    </h3>
                  </div>

                  <div className="inventory-count">
                    {myCrops.length}
                  </div>
                </div>

                {myCrops.length === 0 ? (
                  <div className="empty-state">
                    <div>
                      🌱
                    </div>

                    <h4>
                      Empty inventory
                    </h4>

                    <p>
                      {l.emptyInventory}
                    </p>
                  </div>
                ) : (
                  <div className="crop-grid">

                    {myCrops.map(
                      (crop) => (
                        <div
                          key={crop.id}
                          className="crop-card"
                        >

                          <div className="crop-card-top">

                            <div className="crop-symbol">
                              🌾
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteCrop(
                                  crop.id
                                )
                              }
                              className="delete-button"
                            >
                              ×
                            </button>
                          </div>

                          <h4>
                            {crop.name}
                          </h4>

                          <div className="crop-stat">
                            <span>
                              Weight
                            </span>

                            <strong>
                              {crop.weightKg}{' '}
                              kg
                            </strong>
                          </div>

                          <div className="crop-stat">
                            <span>
                              {l.lockedRate}
                            </span>

                            <strong>
                              ₹
                              {Number(
                                crop.ratePerKg
                              ).toFixed(2)}
                              /kg
                            </strong>
                          </div>

                          <div className="crop-value">
                            <span>
                              Estimated Value
                            </span>

                            <strong>
                              ₹
                              {(
                                crop.weightKg *
                                crop.ratePerKg
                              ).toLocaleString(
                                'en-IN'
                              )}
                            </strong>
                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= PROCUREMENT ================= */}
          {activeTab === 'procurement' &&
            !orderingItem && (
              <section className="content-section">

                <div className="page-intro-card market-intro">
                  <div className="intro-icon">
                    📈
                  </div>

                  <div>
                    <span className="eyebrow">
                      LIVE MARKET
                    </span>

                    <h2>
                      {l.liveCropMarket}
                    </h2>

                    <p>
                      Prices update
                      automatically every few
                      seconds.
                    </p>
                  </div>

                  <div className="live-indicator">
                    <span />
                    LIVE
                  </div>
                </div>

                <div className="section-card market-table-card">

                  <div className="market-table-wrapper">
                    <table className="market-table">

                      <thead>
                        <tr>
                          <th>
                            {l.cropName}
                          </th>

                          <th>
                            {l.pastRates}
                          </th>

                          <th>
                            {l.liveRate}
                          </th>

                          <th>
                            {l.action}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {Object.keys(
                          marketRates
                        ).map((crop) => {

                          const history =
                            marketHistory[
                              crop
                            ] || [];

                          const p1 =
                            history.length >
                            1
                              ? history[
                                  history.length -
                                    2
                                ].toFixed(2)
                              : '-';

                          const p2 =
                            history.length >
                            2
                              ? history[
                                  history.length -
                                    3
                                ].toFixed(2)
                              : '-';

                          const isCropSaved =
                            myCrops.some(
                              (c) =>
                                c.name ===
                                crop
                            );

                          const trendUp =
                            history.length >
                              1 &&
                            history[
                              history.length -
                                1
                            ] >=
                              history[
                                history.length -
                                  2
                              ];

                          return (
                            <tr key={crop}>

                              <td>
                                <div className="table-crop-name">
                                  <span>
                                    🌾
                                  </span>

                                  <strong>
                                    {crop}
                                  </strong>
                                </div>
                              </td>

                              <td>
                                <div className="past-rates">
                                  <span>
                                    ₹{p1}
                                  </span>

                                  <span>
                                    ₹{p2}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div className="live-price">

                                  <div>
                                    <strong
                                      className={
                                        trendUp
                                          ? 'price-up'
                                          : 'price-down'
                                      }
                                    >
                                      ₹
                                      {marketRates[
                                        crop
                                      ].toFixed(
                                        2
                                      )}
                                    </strong>

                                    <small>
                                      {trendUp
                                        ? '↑ Rising'
                                        : '↓ Falling'}
                                    </small>
                                  </div>

                                  <Sparkline
                                    data={
                                      history
                                    }
                                  />
                                </div>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  disabled={
                                    !isCropSaved
                                  }
                                  onClick={() =>
                                    setOrderingItem(
                                      crop
                                    )
                                  }
                                  className={`sell-button ${
                                    isCropSaved
                                      ? ''
                                      : 'disabled'
                                  }`}
                                >
                                  {isCropSaved
                                    ? l.sellMarket
                                    : 'Add Crop First'}
                                </button>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>

                    </table>
                  </div>
                </div>
              </section>
            )}

          {/* ================= ORDER FORM ================= */}
          {activeTab === 'procurement' &&
            orderingItem && (
              <section className="content-section">

                <div className="form-page">

                  <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                      setOrderingItem(
                        null
                      )
                    }
                  >
                    ← Back to Market
                  </button>

                  <div className="order-form-card">

                    <div className="order-form-header">

                      <div className="form-icon">
                        🛒
                      </div>

                      <div>
                        <span className="eyebrow">
                          PROCUREMENT
                        </span>

                        <h2>
                          {l.procurementApp}
                        </h2>

                        <p>
                          {l.applyingFor}{' '}
                          <strong>
                            {orderingItem}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={
                        submitOrder
                      }
                      className="order-form"
                    >

                      <div className="form-field">
                        <label>
                          {l.quantity}
                        </label>

                        <input
                          type="number"
                          min="1"
                          max={
                            maxAvailableQuantity
                          }
                          required
                          placeholder={
                            maxAvailableQuantity
                              ? `Maximum ${maxAvailableQuantity} kg`
                              : l.quantity
                          }
                          value={
                            orderDetails.quantity
                          }
                          onChange={(e) =>
                            setOrderDetails({
                              ...orderDetails,
                              quantity:
                                e.target.value
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>
                          Active Zone
                        </label>

                        <select
                          required
                          value={
                            orderDetails.zone
                          }
                          onChange={(e) =>
                            handleZoneChange(
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            {
                              l.selectZone
                            }
                          </option>

                          {availableZones.length ===
                          0 ? (
                            <option
                              value=""
                              disabled
                            >
                              No active zones
                              found
                            </option>
                          ) : (
                            availableZones.map(
                              (zone) => (
                                <option
                                  key={zone}
                                  value={zone}
                                >
                                  {zone}
                                </option>
                              )
                            )
                          )}
                        </select>
                      </div>

                      <div className="form-field">
                        <label>
                          Village /
                          Sub-place
                        </label>

                        <select
                          required
                          value={
                            orderDetails.subPlace
                          }
                          onChange={(e) =>
                            setOrderDetails({
                              ...orderDetails,
                              subPlace:
                                e.target.value
                            })
                          }
                        >
                          <option value="">
                            {
                              l.selectSubPlace
                            }
                          </option>

                          {availableSubPlaces.map(
                            (sub) => (
                              <option
                                key={sub}
                                value={sub}
                              >
                                {sub}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="form-field">
                        <label>
                          Farm Address
                        </label>

                        <input
                          type="text"
                          required
                          placeholder={
                            l.farmAddress
                          }
                          value={
                            orderDetails.address
                          }
                          onChange={(e) =>
                            setOrderDetails({
                              ...orderDetails,
                              address:
                                e.target.value
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>
                          Patta / Chitta
                          Number
                        </label>

                        <input
                          type="text"
                          required
                          placeholder={
                            l.pattaChitta
                          }
                          value={
                            orderDetails.pattaChitta
                          }
                          onChange={(e) =>
                            setOrderDetails({
                              ...orderDetails,
                              pattaChitta:
                                e.target.value
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>
                          {l.uploadDoc}
                        </label>

                        <div className="file-input-wrapper">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            required
                            onChange={(e) =>
                              setPattaFile(
                                e.target
                                  .files?.[0] ||
                                  null
                              )
                            }
                          />

                          <span>
                            📎 Choose document
                          </span>
                        </div>

                        {pattaFile && (
                          <small className="selected-file">
                            Selected:{' '}
                            {
                              pattaFile.name
                            }
                          </small>
                        )}
                      </div>

                      <div className="form-actions">

                        <button
                          type="submit"
                          disabled={
                            isSubmitting
                          }
                          className="primary-button large"
                        >
                          {isSubmitting
                            ? 'Processing...'
                            : `✓ ${l.confirmOrder}`}
                        </button>

                        <button
                          type="button"
                          disabled={
                            isSubmitting
                          }
                          onClick={() =>
                            setOrderingItem(
                              null
                            )
                          }
                          className="secondary-button"
                        >
                          {l.cancel}
                        </button>

                      </div>
                    </form>
                  </div>
                </div>
              </section>
            )}

          {/* ================= AI ================= */}
          {activeTab === 'ai' && (
            <section className="content-section">

              <div className="ai-hero">

                <div className="ai-hero-icon">
                  🤖
                </div>

                <div>
                  <span className="eyebrow">
                    FARMFLOW INTELLIGENCE
                  </span>

                  <h2>
                    {l.aiAnalysis}
                  </h2>

                  <p>
                    Smart recommendations
                    designed to help improve
                    your farm decisions.
                  </p>
                </div>
              </div>

              <div className="ai-report-card">

                <div className="ai-report-header">
                  <div>
                    <span className="eyebrow">
                      WEEKLY REPORT
                    </span>

                    <h3>
                      {l.aiReport}
                    </h3>
                  </div>

                  <div className="ai-status">
                    ● AI Generated
                  </div>
                </div>

                <div className="ai-insights">

                  <div className="ai-insight green">
                    <div>
                      🌱
                    </div>

                    <p>
                      {l.aiTip1}
                    </p>
                  </div>

                  <div className="ai-insight blue">
                    <div>
                      📈
                    </div>

                    <p>
                      {l.aiTip2}
                    </p>
                  </div>

                  <div className="ai-insight orange">
                    <div>
                      🌦️
                    </div>

                    <p>
                      {l.aiTip3}
                    </p>
                  </div>

                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      {/* ================= WEATHER MODAL ================= */}
      {showWeatherModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowWeatherModal(false)
          }
        >
          <div
            className="weather-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span className="eyebrow">
                  LIVE WEATHER
                </span>

                <h2>
                  📍{' '}
                  {weatherData.locationName}
                </h2>

                <div className="modal-current-weather">

                  <span className="modal-weather-icon">
                    {weatherData.icon}
                  </span>

                  <strong>
                    {weatherData.temp}
                  </strong>

                  <span>
                    {weatherData.condition
                      .split(':')[1]
                      ?.split('.')[0] ||
                      ''}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowWeatherModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="forecast-heading">
              <span className="eyebrow">
                HOURLY FORECAST
              </span>

              <h3>
                Next 24 Hours
              </h3>
            </div>

            <div className="forecast-scroll">

              {hourlyForecast.length ===
              0 ? (
                <div className="forecast-loading">
                  Loading hourly forecast...
                </div>
              ) : (
                hourlyForecast.map(
                  (hour, idx) => (
                    <div
                      key={idx}
                      className={`forecast-item ${
                        idx === 0
                          ? 'forecast-now'
                          : ''
                      }`}
                    >
                      <span className="forecast-time">
                        {hour.time}
                      </span>

                      <span className="forecast-icon">
                        {hour.icon}
                      </span>

                      <strong>
                        {hour.temp}
                      </strong>

                      <small>
                        💧{' '}
                        {hour.rainProb ||
                          0}
                        %
                      </small>
                    </div>
                  )
                )
              )}
            </div>

            <div className="modal-footer">

              <div>
                <span className="weather-condition">
                  {weatherData.condition}
                </span>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowWeatherModal(
                    false
                  )
                }
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;