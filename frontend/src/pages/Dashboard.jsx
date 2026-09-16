import React, { useEffect, useState } from 'react';
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
  doc
} from 'firebase/firestore';
import './Dashboard.css';

/* =========================================================
   ICONS
   Using Unicode escapes prevents emoji encoding problems.
========================================================= */

const ICON = {
  leaf: '\u{1F331}',
  chart: '\u{1F4CA}',
  user: '\u{1F464}',
  crop: '\u{1F33E}',
  cart: '\u{1F6D2}',
  box: '\u{1F4E6}',
  robot: '\u{1F916}',
  help: '\u2753',
  weather: '\u{1F324}',
  partly: '\u26C5',
  fog: '\u{1F32B}',
  rain: '\u{1F327}',
  shower: '\u{1F326}',
  storm: '\u26C8',
  money: '\u{1F4B0}',
  bug: '\u{1F41B}',
  pin: '\u{1F4CD}',
  house: '\u{1F3E0}',
  calendar: '\u{1F4C5}',
  card: '\u{1F4B3}',
  clip: '\u{1F4CE}',
  spark: '\u2726',
  check: '\u2713',
  close: '\u00D7',
  arrow: '\u2192',
  back: '\u2190',
  up: '\u2191',
  down: '\u2193',
  bell: '\u{1F514}',
  logout: '\u21AA',
  empty: '\u{1F4ED}',
  wave: '\u{1F44B}'
};

/* =========================================================
   MARKET RATES
========================================================= */

const initialRates = {
  'Rice (Paddy)': 22.5,
  Wheat: 25,
  'Maize (Corn)': 20,
  Cotton: 70,
  Sugarcane: 3.15,
  Soybean: 46,
  Mustard: 52,
  'Bajra (Pearl Millet)': 24.5,
  Groundnut: 65,
  'Tur (Pigeon Pea)': 110,
  'Moong Dal': 95,
  'Gingelly (Sesame)': 118,
  Onion: 28,
  Potato: 18
};

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
  en: {
    dashboard: 'Dashboard',
    profile: 'My Profile',
    crops: 'My Crops',
    procurement: 'Procurement',
    track: 'Track Status',
    ai: 'AI Insights',
    help: 'Help',
    logout: 'Log Out',

    subtitle: 'Manage your smart farm operations seamlessly.',
    liveMarket: 'Live Market Active',

    userDetails: 'User Details',
    fullName: 'Full Name:',
    emailAddr: 'Email Address:',
    phoneNumber: 'Phone Number:',
    role: 'Role:',
    farmer: 'Farmer',
    accountStatus: 'Account Status:',
    verified: 'Verified',

    weather: 'Local Weather',
    pestAlert: 'Pest Alert',
    pestDesc: 'No active threats detected in your area.',

    addCropTitle: 'Add New Crop Inventory',
    selectCrop: '-- Select Major Indian Crop --',
    weightKg: 'Weight (KGs)',
    addCropBtn: 'Add Crop',
    myCropInventory: 'My Crop Inventory',
    emptyInventory: 'Your inventory is currently empty.',
    lockedRate: 'Locked Rate:',
    remove: 'Remove',

    liveCropMarket: 'Live Crop Market Prices',
    cropName: 'Crop Name',
    pastRates: 'Past Rates',
    liveRate: 'Live Rate & Trend',
    action: 'Action',
    sellMarket: 'Sell to Market',

    procurementApp: 'Procurement Application',
    applyingFor: 'Applying for:',
    quantity: 'Quantity (KGs)',
    selectZone: '-- Select Active Zone --',
    selectSubPlace: '-- Select Sub-Place / Village --',
    farmAddress: 'Specific Farm Address',
    pattaChitta: 'Patta / Chitta Document Number',
    uploadDoc: 'Upload Patta/Chitta (JPG/PNG/PDF, Max 500KB)',
    confirmOrder: 'Submit to VAO',
    cancel: 'Cancel',

    upcomingProcurements: 'Upcoming Procurements',
    noActiveOrders: 'No active orders at the moment.',

    aiAnalysis: 'AI Analysis',
    aiReport: 'Weekly Insight Report',

    helpTitle: 'Help & Guide',
    helpIntro:
      'Welcome to FarmFlow AI! Here is how to use your dashboard:',
    helpProfile:
      'Profile: View your registered account details and status.',
    helpCrops:
      'My Crops: Add harvested crops, enter weight, and see estimated market value.',
    helpProcurement:
      'Procurement: View live market rates and submit applications to sell crops.',
    helpTrack:
      'Track Status: Monitor VAO verification, assigned slots, and DBT payment status.',
    helpAi:
      'AI Insights: Read weekly AI-generated recommendations for your farm.'
  },

  hi: {
    dashboard: 'डैशबोर्ड',
    profile: 'मेरी प्रोफ़ाइल',
    crops: 'मेरी फसलें',
    procurement: 'खरीद',
    track: 'स्थिति ट्रैक करें',
    ai: 'एआई अंतर्दृष्टि',
    help: 'सहायता',
    logout: 'लॉग आउट',

    subtitle: 'अपने स्मार्ट कृषि कार्यों को आसानी से प्रबंधित करें।',
    liveMarket: 'लाइव मार्केट सक्रिय',

    userDetails: 'उपयोगकर्ता विवरण',
    fullName: 'पूरा नाम:',
    emailAddr: 'ईमेल पता:',
    phoneNumber: 'फ़ोन नंबर:',
    role: 'भूमिका:',
    farmer: 'किसान',
    accountStatus: 'खाता स्थिति:',
    verified: 'सत्यापित',

    weather: 'स्थानीय मौसम',
    pestAlert: 'कीट चेतावनी',
    pestDesc: 'आपके क्षेत्र में कोई सक्रिय खतरा नहीं पाया गया।',

    addCropTitle: 'नई फसल इन्वेंटरी जोड़ें',
    selectCrop: '-- भारतीय फसल चुनें --',
    weightKg: 'वजन (किलो)',
    addCropBtn: 'फसल जोड़ें',
    myCropInventory: 'मेरी फसल इन्वेंटरी',
    emptyInventory: 'आपकी इन्वेंटरी वर्तमान में खाली है।',
    lockedRate: 'लॉक्ड दर:',
    remove: 'हटाएं',

    liveCropMarket: 'लाइव फसल बाजार मूल्य',
    cropName: 'फसल का नाम',
    pastRates: 'पिछली दरें',
    liveRate: 'लाइव दर और रुझान',
    action: 'कार्रवाई',
    sellMarket: 'बाजार में बेचें',

    procurementApp: 'खरीद आवेदन',
    applyingFor: 'इसके लिए आवेदन:',
    quantity: 'मात्रा (किलो)',
    selectZone: '-- सक्रिय ज़ोन चुनें --',
    selectSubPlace: '-- उप-स्थान / गांव चुनें --',
    farmAddress: 'विशिष्ट खेत का पता',
    pattaChitta: 'पट्टा / चिट्टा दस्तावेज़ संख्या',
    uploadDoc:
      'पट्टा/चिट्टा अपलोड करें (JPG/PNG/PDF, अधिकतम 500KB)',
    confirmOrder: 'VAO को सबमिट करें',
    cancel: 'रद्द करें',

    upcomingProcurements: 'आगामी खरीद',
    noActiveOrders: 'इस समय कोई सक्रिय आदेश नहीं है।',

    aiAnalysis: 'एआई विश्लेषण',
    aiReport: 'साप्ताहिक अंतर्दृष्टि रिपोर्ट',

    helpTitle: 'सहायता और मार्गदर्शन',
    helpIntro:
      'FarmFlow AI में आपका स्वागत है! यहाँ बताया गया है कि डैशबोर्ड का उपयोग कैसे करें:',
    helpProfile:
      'प्रोफ़ाइल: अपने पंजीकृत खाते का विवरण और स्थिति देखें।',
    helpCrops:
      'मेरी फसलें: फसल जोड़ें, वजन दर्ज करें और अनुमानित बाजार मूल्य देखें।',
    helpProcurement:
      'खरीद: लाइव बाजार दरें देखें और फसल बेचने के लिए आवेदन करें।',
    helpTrack:
      'स्थिति ट्रैक करें: VAO सत्यापन, स्लॉट और DBT भुगतान की निगरानी करें।',
    helpAi:
      'एआई अंतर्दृष्टि: अपने खेत के लिए साप्ताहिक एआई सिफारिशें पढ़ें।'
  },

  ta: {
    dashboard: 'டாஷ்போர்டு',
    profile: 'என் சுயவிவரம்',
    crops: 'என் பயிர்கள்',
    procurement: 'கொள்முதல்',
    track: 'நிலை கண்காணிக்க',
    ai: 'AI ஆலோசனைகள்',
    help: 'உதவி',
    logout: 'வெளியேறு',

    subtitle: 'உங்கள் பண்ணை செயல்பாடுகளை எளிதாக நிர்வகிக்கவும்.',
    liveMarket: 'நேரடி சந்தை செயலில் உள்ளது',

    userDetails: 'பயனர் விவரங்கள்',
    fullName: 'முழு பெயர்:',
    emailAddr: 'மின்னஞ்சல்:',
    phoneNumber: 'தொலைபேசி எண்:',
    role: 'பங்கு:',
    farmer: 'விவசாயி',
    accountStatus: 'கணக்கு நிலை:',
    verified: 'சரிபார்க்கப்பட்டது',

    weather: 'உள்ளூர் வானிலை',
    pestAlert: 'பூச்சி எச்சரிக்கை',
    pestDesc: 'உங்கள் பகுதியில் எந்த அச்சுறுத்தலும் இல்லை.',

    addCropTitle: 'புதிய பயிர் சேர்க்கவும்',
    selectCrop: '-- இந்திய பயிரைத் தேர்ந்தெடுக்கவும் --',
    weightKg: 'எடை (கிலோ)',
    addCropBtn: 'பயிரைச் சேர்',
    myCropInventory: 'என் பயிர் இருப்பு',
    emptyInventory: 'உங்கள் இருப்பு காலியாக உள்ளது.',
    lockedRate: 'பூட்டப்பட்ட விலை:',
    remove: 'நீக்கு',

    liveCropMarket: 'நேரடி பயிர் சந்தை விலைகள்',
    cropName: 'பயிர் பெயர்',
    pastRates: 'கடந்த விலைகள்',
    liveRate: 'நேரடி விலை & போக்கு',
    action: 'செயல்',
    sellMarket: 'சந்தையில் விற்க',

    procurementApp: 'கொள்முதல் விண்ணப்பம்',
    applyingFor: 'விண்ணப்பிப்பது:',
    quantity: 'அளவு (கிலோ)',
    selectZone: '-- மண்டலத்தைத் தேர்ந்தெடுக்கவும் --',
    selectSubPlace: '-- கிராமத்தைத் தேர்ந்தெடுக்கவும் --',
    farmAddress: 'குறிப்பிட்ட பண்ணை முகவரி',
    pattaChitta: 'பட்டா / சிட்டா ஆவண எண்',
    uploadDoc:
      'பட்டா/சிட்டாவை பதிவேற்றவும் (JPG/PNG/PDF, அதிகபட்சம் 500KB)',
    confirmOrder: 'VAO க்கு சமர்ப்பிக்கவும்',
    cancel: 'ரத்து செய்',

    upcomingProcurements: 'வரவிருக்கும் கொள்முதல்',
    noActiveOrders: 'தற்போது எந்த ஆர்டரும் இல்லை.',

    aiAnalysis: 'AI பகுப்பாய்வு',
    aiReport: 'வாராந்திர அறிக்கை',

    helpTitle: 'உதவி மற்றும் வழிகாட்டி',
    helpIntro:
      'FarmFlow AI-க்கு உங்களை வரவேற்கிறோம்! டாஷ்போர்டை எவ்வாறு பயன்படுத்துவது:',
    helpProfile:
      'சுயவிவரம்: உங்கள் கணக்கு விவரங்கள் மற்றும் நிலையைப் பார்க்கவும்.',
    helpCrops:
      'என் பயிர்கள்: பயிரைச் சேர்த்து, எடையைப் பதிவு செய்து, சந்தை மதிப்பைப் பார்க்கவும்.',
    helpProcurement:
      'கொள்முதல்: நேரடி சந்தை விலைகளைப் பார்த்து விற்க விண்ணப்பிக்கவும்.',
    helpTrack:
      'நிலை கண்காணிக்க: VAO சரிபார்ப்பு, நேரம் மற்றும் DBT கட்டண நிலையைப் பார்க்கவும்.',
    helpAi:
      'AI ஆலோசனைகள்: உங்கள் பண்ணைக்கான வாராந்திர AI பரிந்துரைகளைப் படிக்கவும்.'
  }
};

/* =========================================================
   HELPERS
========================================================= */

const generateInitialHistory = (rates) => {
  const history = {};

  Object.keys(rates).forEach((crop) => {
    let current = rates[crop];
    const values = [];

    for (let i = 0; i < 10; i += 1) {
      current *= 1 + Math.random() * 0.06 - 0.03;
      values.unshift(Number(current.toFixed(2)));
    }

    values.push(rates[crop]);
    history[crop] = values;
  });

  return history;
};

const getWeatherMeta = (code) => {
  if (code === 0) {
    return {
      label: 'Clear sky',
      icon: ICON.weather
    };
  }

  if (code > 0 && code < 4) {
    return {
      label: 'Partly cloudy',
      icon: ICON.partly
    };
  }

  if (code >= 45 && code < 50) {
    return {
      label: 'Foggy / Misty',
      icon: ICON.fog
    };
  }

  if (code >= 50 && code < 80) {
    return {
      label: 'Rainy',
      icon: ICON.rain
    };
  }

  if (code >= 80 && code < 90) {
    return {
      label: 'Showers',
      icon: ICON.shower
    };
  }

  if (code >= 90) {
    return {
      label: 'Thunderstorm',
      icon: ICON.storm
    };
  }

  return {
    label: 'Clear',
    icon: ICON.weather
  };
};

/* =========================================================
   SPARKLINE
========================================================= */

const Sparkline = ({ data }) => {
  if (!data || data.length < 2) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const isUp =
    data[data.length - 1] >= data[data.length - 2];

  const points = data
    .map(
      (value, index) =>
        `${(index / (data.length - 1)) * 80},${
          22 - ((value - min) / range) * 18
        }`
    )
    .join(' ');

  return (
    <svg
      viewBox="0 0 80 24"
      className={`sparkline ${
        isUp ? 'sparkline-up' : 'sparkline-down'
      }`}
      aria-hidden="true"
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

/* =========================================================
   DASHBOARD COMPONENT
========================================================= */

const Dashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [marketRates, setMarketRates] =
    useState(initialRates);

  const [marketHistory, setMarketHistory] = useState(() =>
    generateInitialHistory(initialRates)
  );

  const [activeOrders, setActiveOrders] = useState([]);
  const [myCrops, setMyCrops] = useState([]);

  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'farmer'
  });

  const [vaoUsers, setVaoUsers] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [availableSubPlaces, setAvailableSubPlaces] =
    useState([]);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [latestNotification, setLatestNotification] =
    useState(null);

  const [showBanner, setShowBanner] = useState(false);

  const [weatherData, setWeatherData] = useState({
    temp: '--',
    condition: 'Fetching location weather...',
    locationName: 'Detecting location...',
    icon: ICON.weather
  });

  const [hourlyForecast, setHourlyForecast] =
    useState([]);

  const [showWeatherModal, setShowWeatherModal] =
    useState(false);

  const [orderingItem, setOrderingItem] =
    useState(null);

  const [orderDetails, setOrderDetails] = useState({
    zone: '',
    subPlace: '',
    address: '',
    quantity: '',
    pattaChitta: ''
  });

  const [pattaFile, setPattaFile] =
    useState(null);

  const [newCrop, setNewCrop] = useState({
    name: '',
    weightKg: ''
  });

  const l = translations[lang];

  /* =======================================================
     LOAD USER
  ======================================================= */

  useEffect(() => {
    const savedUser =
      localStorage.getItem('farmflow_user') ||
      sessionStorage.getItem('farmflow_user');

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);

        if (parsed && parsed.email) {
          setUserProfile((previous) => ({
            ...previous,
            ...parsed
          }));

          return;
        }
      } catch (error) {
        console.error(
          'Error parsing saved user:',
          error
        );
      }
    }

    const demoUser = {
      name: 'Rajesh Farmer',
      email: 'rajesh@farmflow.com',
      phone: '9876543210',
      role: 'farmer'
    };

    setUserProfile(demoUser);

    localStorage.setItem(
      'farmflow_user',
      JSON.stringify(demoUser)
    );
  }, []);

  /* =======================================================
     WEATHER
  ======================================================= */

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherData({
        temp: 'N/A',
        condition:
          'Geolocation is not supported.',
        locationName: 'Unavailable',
        icon: ICON.pin
      });

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const {
          latitude,
          longitude
        } = position.coords;

        try {
          const weatherResponse =
            await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto`
            );

          if (!weatherResponse.ok) {
            throw new Error(
              'Weather request failed'
            );
          }

          const weatherJson =
            await weatherResponse.json();

          let locationName =
            'Your Location';

          try {
            const geoResponse =
              await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );

            if (geoResponse.ok) {
              const geoJson =
                await geoResponse.json();

              locationName =
                geoJson.address?.city ||
                geoJson.address?.town ||
                geoJson.address?.village ||
                geoJson.address?.state ||
                'Your Location';
            }
          } catch (geoError) {
            console.warn(
              'Location name unavailable:',
              geoError
            );
          }

          const meta = getWeatherMeta(
            weatherJson.current?.weather_code
          );

          setWeatherData({
            temp: `${Math.round(
              weatherJson.current
                ?.temperature_2m ?? 0
            )}°C`,

            condition: `${locationName}: ${meta.label}. Humidity: ${
              weatherJson.current
                ?.relative_humidity_2m ?? 0
            }%`,

            locationName,
            icon: meta.icon
          });

          const times =
            weatherJson.hourly?.time || [];

          let startIndex = 0;

          if (times.length > 0) {
            const currentHour =
              new Date().getHours();

            const foundIndex = times.findIndex(
              (time) =>
                new Date(time).getHours() ===
                currentHour
            );

            if (foundIndex >= 0) {
              startIndex = foundIndex;
            }
          }

          const forecast = [];

          for (
            let i = startIndex;
            i <
            Math.min(
              startIndex + 24,
              times.length
            );
            i += 1
          ) {
            const date = new Date(times[i]);

            const metaForHour =
              getWeatherMeta(
                weatherJson.hourly
                  ?.weather_code?.[i]
              );

            forecast.push({
              time:
                i === startIndex
                  ? 'Now'
                  : date.toLocaleTimeString(
                      [],
                      {
                        hour: 'numeric',
                        hour12: true
                      }
                    ),

              temp: `${Math.round(
                weatherJson.hourly
                  ?.temperature_2m?.[i] ?? 0
              )}°C`,

              rainProb:
                weatherJson.hourly
                  ?.precipitation_probability?.[
                  i
                ] ?? 0,

              icon: metaForHour.icon,
              label: metaForHour.label
            });
          }

          setHourlyForecast(forecast);
        } catch (error) {
          console.error(
            'Weather fetch failed:',
            error
          );

          setWeatherData({
            temp: '--',
            condition:
              'Unable to load live weather.',
            locationName: 'Weather Error',
            icon: ICON.weather
          });
        }
      },

      () => {
        setWeatherData({
          temp: 'N/A',
          condition:
            'Location permission denied. Enable GPS for live weather.',
          locationName: 'Location Disabled',
          icon: ICON.pin
        });
      }
    );
  }, []);

  /* =======================================================
     LOAD VAO / OFFICER LOCATIONS
  ======================================================= */

  useEffect(() => {
    const fetchVAOs = async () => {
      try {
        const vaoQuery = query(
          collection(db, 'users'),
          where('role', 'in', [
            'vao',
            'officer'
          ])
        );

        const snapshot =
          await getDocs(vaoQuery);

        const users =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
          }));

        setVaoUsers(users);

        const zones = users
          .map((user) => user.zone)
          .filter(Boolean);

        setAvailableZones([
          ...new Set(zones)
        ]);
      } catch (error) {
        console.error(
          'Error fetching VAO locations:',
          error
        );
      }
    };

    fetchVAOs();
  }, []);

  /* =======================================================
     FIREBASE ORDERS + CROPS
  ======================================================= */

  useEffect(() => {
    if (!userProfile.email) {
      return undefined;
    }

    const email =
      userProfile.email.toLowerCase();

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userEmail', '==', email)
    );

    const cropsQuery = query(
      collection(db, 'crops'),
      where('userEmail', '==', email)
    );

    const unsubscribeOrders =
      onSnapshot(
        ordersQuery,
        (snapshot) => {
          snapshot.docChanges().forEach(
            (change) => {
              if (change.type === 'modified') {
                const order =
                  change.doc.data();

                setLatestNotification(
                  `${ICON.bell} Update: Your ${
                    order.item
                  } application status is now "${
                    order.status
                  }".`
                );

                setShowBanner(true);

                setTimeout(() => {
                  setShowBanner(false);
                }, 7000);
              }
            }
          );

          const orders =
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data()
            }));

          orders.sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ).getTime() -
              new Date(
                a.createdAt || 0
              ).getTime()
          );

          setActiveOrders(orders);
        }
      );

    const unsubscribeCrops =
      onSnapshot(
        cropsQuery,
        (snapshot) => {
          const crops =
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data()
            }));

          setMyCrops(crops);
        }
      );

    return () => {
      unsubscribeOrders();
      unsubscribeCrops();
    };
  }, [userProfile.email]);

  /* =======================================================
     LIVE MARKET SIMULATION
  ======================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketRates((previousRates) => {
        const nextRates = {
          ...previousRates
        };

        const crops =
          Object.keys(nextRates);

        const crop =
          crops[
            Math.floor(
              Math.random() *
                crops.length
            )
          ];

        nextRates[crop] = Number(
          (
            nextRates[crop] *
            (1 +
              Math.random() * 0.04 -
              0.02)
          ).toFixed(2)
        );

        setMarketHistory(
          (previousHistory) => ({
            ...previousHistory,
            [crop]: [
              ...(previousHistory[crop] ||
                []),
              nextRates[crop]
            ].slice(-15)
          })
        );

        return nextRates;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const changeTab = (tab) => {
    setActiveTab(tab);
    setOrderingItem(null);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(
      'farmflow_user'
    );

    sessionStorage.removeItem(
      'farmflow_user'
    );

    navigate('/login');
  };

  /* =======================================================
     ZONE CHANGE
  ======================================================= */

  const handleZoneChange = (zone) => {
    setOrderDetails((previous) => ({
      ...previous,
      zone,
      subPlace: ''
    }));

    const subPlaces = vaoUsers
      .filter(
        (user) => user.zone === zone
      )
      .map(
        (user) =>
          user.subPlace ||
          user.sub_place ||
          user.subZone ||
          user.sub_zone ||
          user.village ||
          user.location
      )
      .filter(Boolean)
      .filter(
        (value) =>
          value.toLowerCase() !==
          'general'
      );

    setAvailableSubPlaces([
      ...new Set(subPlaces)
    ]);
  };

  /* =======================================================
     ADD CROP
  ======================================================= */

  const handleAddCrop = async (event) => {
    event.preventDefault();

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

          name: newCrop.name,

          weightKg: Number(
            newCrop.weightKg
          ),

          ratePerKg:
            marketRates[newCrop.name],

          createdAt:
            new Date().toISOString()
        }
      );

      setNewCrop({
        name: '',
        weightKg: ''
      });
    } catch (error) {
      console.error(
        'Error adding crop:',
        error
      );

      alert(
        'Failed to add crop. Please try again.'
      );
    }
  };

  /* =======================================================
     DELETE CROP
  ======================================================= */

  const handleDeleteCrop = async (id) => {
    try {
      await deleteDoc(
        doc(db, 'crops', id)
      );
    } catch (error) {
      console.error(
        'Error deleting crop:',
        error
      );

      alert(
        'Failed to remove crop.'
      );
    }
  };

  /* =======================================================
     SUBMIT PROCUREMENT ORDER
  ======================================================= */

  const submitOrder = async (event) => {
    event.preventDefault();

    const selectedCrop =
      myCrops.find(
        (crop) =>
          crop.name === orderingItem
      );

    if (!selectedCrop) {
      alert(
        'Please add this crop to your inventory first.'
      );

      return;
    }

    const quantity = Number(
      orderDetails.quantity
    );

    if (
      !quantity ||
      quantity <= 0 ||
      quantity >
        Number(selectedCrop.weightKg)
    ) {
      alert(
        `Quantity must be between 1 and ${selectedCrop.weightKg} kg.`
      );

      return;
    }

    if (
      pattaFile &&
      pattaFile.size > 500 * 1024
    ) {
      alert(
        'File is too large. Please upload a file under 500KB.'
      );

      return;
    }

    setIsSubmitting(true);

    try {
      let documentUrl = '';

      if (pattaFile) {
        documentUrl =
          await new Promise(
            (resolve, reject) => {
              const reader =
                new FileReader();

              reader.onload = () =>
                resolve(
                  reader.result
                );

              reader.onerror = reject;

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
            userProfile.name ||
            'Unknown',

          userPhone:
            userProfile.phone ||
            'N/A',

          userEmail:
            userProfile.email.toLowerCase(),

          item: orderingItem,

          quantity,

          zone:
            orderDetails.zone,

          subPlace:
            orderDetails.subPlace,

          address:
            orderDetails.address,

          pattaChitta:
            orderDetails.pattaChitta,

          documentUrl,

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
      console.error(
        'Error submitting order:',
        error
      );

      alert(
        'Failed to submit order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
     PAGE TITLES
  ======================================================= */

  const pageTitle = {
    dashboard: l.dashboard,
    profile: l.profile,
    crops: l.crops,
    procurement: l.procurement,
    track: l.track,
    ai: l.ai,
    help: l.help
  };

  const navItems = [
    {
      id: 'dashboard',
      label: l.dashboard,
      icon: ICON.chart
    },
    {
      id: 'profile',
      label: l.profile,
      icon: ICON.user
    },
    {
      id: 'crops',
      label: l.crops,
      icon: ICON.crop
    },
    {
      id: 'procurement',
      label: l.procurement,
      icon: ICON.cart
    },
    {
      id: 'track',
      label: l.track,
      icon: ICON.box
    },
    {
      id: 'ai',
      label: l.ai,
      icon: ICON.robot
    }
  ];

  const savedCrop =
    myCrops.find(
      (crop) =>
        crop.name === orderingItem
    );

  const maxAvailableQuantity =
    savedCrop
      ? Number(savedCrop.weightKg)
      : undefined;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="dashboard-shell">

      {/* MOBILE SIDEBAR OVERLAY */}

      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setIsSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`dashboard-sidebar ${
          isSidebarOpen
            ? 'sidebar-open'
            : ''
        }`}
      >

        <div className="sidebar-brand">

          <div className="brand-icon">
            {ICON.leaf}
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
            {(
              userProfile.name ||
              'F'
            )
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
                {item.label}
              </span>

              {activeTab ===
                item.id && (
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
            {ICON.help}
          </span>

          <span className="nav-label">
            {l.help}
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
          <span>
            {ICON.logout}
          </span>

          {l.logout}
        </button>

        <div className="sidebar-footer">
          <span className="footer-dot" />
          FarmFlow AI v1.0
        </div>

      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div className="header-left">

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setIsSidebarOpen(
                  (open) => !open
                )
              }
              aria-label="Open menu"
            >
              ☰
            </button>

            <div>

              <div className="breadcrumb">
                FarmFlow AI
                <span>/</span>
                {pageTitle[activeTab]}
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
              {(
                userProfile.name ||
                'F'
              )
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
                {ICON.bell}
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
                {ICON.close}
              </button>

            </div>
          )}

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="dashboard-content">

          {/* =================================================
              HELP
          ================================================= */}

          {activeTab === 'help' && (
            <section className="content-section">

              <div className="page-intro-card">

                <div className="intro-icon">
                  {ICON.help}
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
                    icon: ICON.user,
                    text: l.helpProfile
                  },
                  {
                    icon: ICON.crop,
                    text: l.helpCrops
                  },
                  {
                    icon: ICON.cart,
                    text: l.helpProcurement
                  },
                  {
                    icon: ICON.box,
                    text: l.helpTrack
                  },
                  {
                    icon: ICON.robot,
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

          {/* =================================================
              PROFILE
          ================================================= */}

          {activeTab === 'profile' && (
            <section className="content-section">

              <div className="profile-hero">

                <div className="large-avatar">
                  {(
                    userProfile.name ||
                    'F'
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <span className="eyebrow">
                    FARMER ACCOUNT
                  </span>

                  <h2>
                    {userProfile.name ||
                      'Farmer'}
                  </h2>

                  <p>
                    {userProfile.email ||
                      'FarmFlow User'}
                  </p>

                </div>

                <div className="verified-badge">
                  {ICON.check}
                  {l.verified}
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
                    {ICON.user}
                  </span>

                </div>

                <div className="profile-details">

                  <div className="profile-detail">
                    <span>
                      {l.fullName}
                    </span>

                    <strong>
                      {userProfile.name ||
                        'Farmer'}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.emailAddr}
                    </span>

                    <strong>
                      {userProfile.email ||
                        'N/A'}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.phoneNumber}
                    </span>

                    <strong>
                      {userProfile.phone ||
                        'N/A'}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.role}
                    </span>

                    <strong>
                      {l.farmer}
                    </strong>
                  </div>

                  <div className="profile-detail">
                    <span>
                      {l.accountStatus}
                    </span>

                    <strong className="status-success">
                      {l.verified}
                      {ICON.check}
                    </strong>
                  </div>

                </div>

              </div>

            </section>
          )}

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {activeTab === 'dashboard' && (
            <section className="content-section">

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
                    ! {ICON.wave}
                  </h2>

                  <p>
                    Here's your farm activity
                    at a glance.
                  </p>

                </div>

                <div className="welcome-illustration">
                  {ICON.crop}
                </div>

              </div>

              {/* STATS */}

              <div className="stats-grid">

                <div className="stat-card">

                  <div className="stat-icon green">
                    {ICON.crop}
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
                    {ICON.box}
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
                    {ICON.money}
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
                    {ICON.robot}
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

              {/* WEATHER + PEST */}

              <div className="dashboard-two-column">

                <button
                  type="button"
                  className="weather-card"
                  onClick={() =>
                    setShowWeatherModal(
                      true
                    )
                  }
                >

                  <div className="card-top-line">

                    <div className="card-icon-large weather">
                      {weatherData.icon}
                    </div>

                    <span className="card-arrow">
                      {ICON.arrow}
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
                    {ICON.pin}{' '}
                    {weatherData.locationName}
                  </p>

                  <p className="weather-description">
                    {weatherData.condition}
                  </p>

                  <div className="card-link">
                    View 24-hour forecast
                    <span>
                      {ICON.arrow}
                    </span>
                  </div>

                </button>

                <div className="pest-card">

                  <div className="card-top-line">

                    <div className="card-icon-large pest">
                      {ICON.bug}
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

              {/* RECENT ORDERS */}

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
                    {ICON.box}
                  </div>

                </div>

                {activeOrders.length === 0 ? (
                  <div className="empty-state">

                    <div>
                      {ICON.empty}
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
                              {ICON.box}
                            </div>

                            <div>

                              <strong>
                                {order.item}
                              </strong>

                              <span>
                                {order.quantity}{' '}
                                kg •{' '}
                                {order.datetime ||
                                  'TBD'}
                              </span>

                              <small>
                                {ICON.pin}{' '}
                                {order.zone ||
                                  'Zone'}{' '}
                                /{' '}
                                {order.subPlace ||
                                  'General'}
                              </small>

                            </div>

                          </div>

                          <span className="status-badge status-orange">
                            {order.status ||
                              'Pending'}
                          </span>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

            </section>
          )}

          {/* =================================================
              TRACK STATUS
          ================================================= */}

          {activeTab === 'track' && (
            <section className="content-section">

              <div className="page-intro-card track-intro">

                <div className="intro-icon">
                  {ICON.box}
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
                      {ICON.empty}
                    </div>

                    <h4>
                      No procurement applications
                    </h4>

                    <p>
                      No active procurement
                      applications found.
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

                          <span className="status-badge status-orange">
                            {order.status ||
                              'Pending Verification'}
                          </span>

                        </div>

                        <div className="tracking-details">

                          <div className="tracking-info">

                            <div>

                              <span>
                                {ICON.pin}
                                {' '}Location
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
                                {ICON.house}
                                {' '}Address
                              </span>

                              <strong>
                                {order.address ||
                                  'N/A'}
                              </strong>

                            </div>

                            <div>

                              <span>
                                {ICON.calendar}
                                {' '}Assigned Slot
                              </span>

                              <strong>
                                {order.datetime ||
                                  'TBD by Officer'}
                              </strong>

                            </div>

                          </div>

                          <div className="dbt-card">

                            <span>
                              {ICON.card}
                              {' '}DBT PAYMENT
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
                                Boolean(
                                  order.datetime &&
                                  order.datetime !==
                                    'TBD by Officer'
                                )
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
                                key={
                                  step.label
                                }
                                className={`timeline-step ${
                                  step.active
                                    ? 'active'
                                    : ''
                                }`}
                              >

                                <div className="timeline-dot">
                                  {step.active
                                    ? ICON.check
                                    : index + 1}
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

          {/* =================================================
              CROPS
          ================================================= */}

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
                    {ICON.crop}
                  </div>

                </div>

                <form
                  onSubmit={handleAddCrop}
                  className="crop-form"
                >

                  <select
                    required
                    value={newCrop.name}
                    onChange={(event) =>
                      setNewCrop({
                        ...newCrop,
                        name:
                          event.target.value
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
                    onChange={(event) =>
                      setNewCrop({
                        ...newCrop,
                        weightKg:
                          event.target.value
                      })
                    }
                  />

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    + {l.addCropBtn}
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
                      {ICON.leaf}
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
                              {ICON.crop}
                            </div>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                handleDeleteCrop(
                                  crop.id
                                )
                              }
                              aria-label={`Remove ${crop.name}`}
                            >
                              {ICON.close}
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
                                crop.ratePerKg ||
                                  0
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
                                Number(
                                  crop.weightKg ||
                                    0
                                ) *
                                Number(
                                  crop.ratePerKg ||
                                    0
                                )
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

          {/* =================================================
              PROCUREMENT MARKET
          ================================================= */}

          {activeTab === 'procurement' &&
            !orderingItem && (
              <section className="content-section">

                <div className="page-intro-card market-intro">

                  <div className="intro-icon">
                    {ICON.chart}
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
                      automatically every
                      few seconds.
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
                              (item) =>
                                item.name ===
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
                                    {ICON.crop}
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
                                        ? `${ICON.up} Rising`
                                        : `${ICON.down} Falling`}
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

          {/* =================================================
              PROCUREMENT FORM
          ================================================= */}

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
                    {ICON.back}
                    {' '}Back to Market
                  </button>

                  <div className="order-form-card">

                    <div className="order-form-header">

                      <div className="form-icon">
                        {ICON.cart}
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
                          onChange={(event) =>
                            setOrderDetails({
                              ...orderDetails,
                              quantity:
                                event.target
                                  .value
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
                          onChange={(event) =>
                            handleZoneChange(
                              event.target
                                .value
                            )
                          }
                        >

                          <option value="">
                            {l.selectZone}
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
                          Village / Sub-place
                        </label>

                        <select
                          required
                          value={
                            orderDetails.subPlace
                          }
                          onChange={(event) =>
                            setOrderDetails({
                              ...orderDetails,
                              subPlace:
                                event.target
                                  .value
                            })
                          }
                        >

                          <option value="">
                            {
                              l.selectSubPlace
                            }
                          </option>

                          {availableSubPlaces.map(
                            (subPlace) => (
                              <option
                                key={subPlace}
                                value={subPlace}
                              >
                                {subPlace}
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
                          onChange={(event) =>
                            setOrderDetails({
                              ...orderDetails,
                              address:
                                event.target
                                  .value
                            })
                          }
                        />

                      </div>

                      <div className="form-field">

                        <label>
                          Patta / Chitta Number
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
                          onChange={(event) =>
                            setOrderDetails({
                              ...orderDetails,
                              pattaChitta:
                                event.target
                                  .value
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
                            onChange={(event) =>
                              setPattaFile(
                                event.target
                                  .files?.[0] ||
                                  null
                              )
                            }
                          />

                          <span>
                            {ICON.clip}
                            {' '}Choose document
                          </span>

                        </div>

                        {pattaFile && (
                          <small className="selected-file">
                            Selected:{' '}
                            {pattaFile.name}
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
                            : `${ICON.check} ${l.confirmOrder}`}
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

          {/* =================================================
              AI INSIGHTS
          ================================================= */}

          {activeTab === 'ai' && (
            <section className="content-section">

              <div className="ai-hero">

                <div className="ai-hero-icon">
                  {ICON.robot}
                </div>

                <div>

                  <span className="eyebrow">
                    FARMWLOW INTELLIGENCE
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
                    {ICON.spark}
                    {' '}AI Generated
                  </div>

                </div>

                <div className="ai-insights">

                  <div className="ai-insight green">

                    <div>
                      {ICON.leaf}
                    </div>

                    <p>
                      Nitrogen levels in your
                      fields may be dropping.
                      Recommended to apply
                      Urea by Thursday.
                    </p>

                  </div>

                  <div className="ai-insight blue">

                    <div>
                      {ICON.chart}
                    </div>

                    <p>
                      Market conditions suggest
                      reviewing wheat sales
                      before confirming the next
                      delivery.
                    </p>

                  </div>

                  <div className="ai-insight orange">

                    <div>
                      {ICON.weather}
                    </div>

                    <p>
                      Weather analysis shows
                      low risk of pests for
                      the next 7 days.
                    </p>

                  </div>

                </div>

              </div>

            </section>
          )}

        </div>

      </main>

      {/* =================================================
          WEATHER MODAL
      ================================================= */}

      {showWeatherModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowWeatherModal(false)
          }
        >

          <div
            className="weather-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  LIVE WEATHER
                </span>

                <h2>
                  {ICON.pin}{' '}
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
                aria-label="Close weather"
              >
                {ICON.close}
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
                  (hour, index) => (
                    <div
                      key={`${hour.time}-${index}`}
                      className={`forecast-item ${
                        index === 0
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
                        {ICON.drop}{' '}
                        {hour.rainProb}%
                      </small>

                    </div>
                  )
                )
              )}

            </div>

            <div className="modal-footer">

              <span className="weather-condition">
                {weatherData.condition}
              </span>

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