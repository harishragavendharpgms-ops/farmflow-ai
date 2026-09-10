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
  if (code === 0) return { label: "Clear sky", icon: "â˜€ï¸" };
  if (code > 0 && code < 4) return { label: "Partly cloudy", icon: "â›…" };
  if (code >= 45 && code < 50) return { label: "Foggy / Misty", icon: "ðŸŒ«ï¸" };
  if (code >= 50 && code < 80) return { label: "Rainy", icon: "ðŸŒ§ï¸" };
  if (code >= 80 && code < 90) return { label: "Showers", icon: "ðŸŒ¦ï¸" };
  if (code >= 90) return { label: "Thunderstorm", icon: "â›ˆï¸" };

  return { label: "Clear", icon: "ðŸŒ¤ï¸" };
};

const t = {
  en: {
    navDashboard: "ðŸ“Š Dashboard",
    navProfile: "ðŸ‘¤ My Profile",
    navCrops: "ðŸŒ¾ My Crops",
    navProcurement: "ðŸ›’ Procurement",
    navTrack: "ðŸ“¦ Track Status",
    navAi: "ðŸ¤– AI Insights",
    navHelp: "â“ Help",
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
    verified: "Verified ðŸŸ¢",
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
    navDashboard: "ðŸ“Š à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡",
    navProfile: "ðŸ‘¤ à¤®à¥‡à¤°à¥€ à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²",
    navCrops: "ðŸŒ¾ à¤®à¥‡à¤°à¥€ à¤«à¤¸à¤²à¥‡à¤‚",
    navProcurement: "ðŸ›’ à¤–à¤°à¥€à¤¦",
    navTrack: "ðŸ“¦ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤Ÿà¥à¤°à¥ˆà¤• à¤•à¤°à¥‡à¤‚",
    navAi: "ðŸ¤– à¤à¤†à¤ˆ à¤…à¤‚à¤¤à¤°à¥à¤¦à¥ƒà¤·à¥à¤Ÿà¤¿",
    navHelp: "â“ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾",
    logout: "à¤²à¥‰à¤— à¤†à¤‰à¤Ÿ",
    module: "à¤®à¥‰à¤¡à¥à¤¯à¥‚à¤²",
    subtitle: "à¤…à¤ªà¤¨à¥‡ à¤¸à¥à¤®à¤¾à¤°à¥à¤Ÿ à¤•à¥ƒà¤·à¤¿ à¤•à¤¾à¤°à¥à¤¯à¥‹à¤‚ à¤•à¥‹ à¤†à¤¸à¤¾à¤¨à¥€ à¤¸à¥‡ à¤ªà¥à¤°à¤¬à¤‚à¤§à¤¿à¤¤ à¤•à¤°à¥‡à¤‚à¥¤",
    liveMarket: "à¤²à¤¾à¤‡à¤µ à¤®à¤¾à¤°à¥à¤•à¥‡à¤Ÿ à¤¸à¤•à¥à¤°à¤¿à¤¯",
    userDetails: "à¤‰à¤ªà¤¯à¥‹à¤—à¤•à¤°à¥à¤¤à¤¾ à¤µà¤¿à¤µà¤°à¤£",
    fullName: "à¤ªà¥‚à¤°à¤¾ à¤¨à¤¾à¤®:",
    emailAddr: "à¤ˆà¤®à¥‡à¤² à¤ªà¤¤à¤¾:",
    phoneNumber: "à¤«à¤¼à¥‹à¤¨ à¤¨à¤‚à¤¬à¤°:",
    role: "à¤­à¥‚à¤®à¤¿à¤•à¤¾:",
    farmManager: "à¤•à¤¿à¤¸à¤¾à¤¨",
    accountStatus: "à¤–à¤¾à¤¤à¤¾ à¤¸à¥à¤¥à¤¿à¤¤à¤¿:",
    verified: "à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ ðŸŸ¢",
    weather: "à¤¸à¥à¤¥à¤¾à¤¨à¥€à¤¯ à¤®à¥Œà¤¸à¤®",
    pestAlert: "à¤•à¥€à¤Ÿ à¤šà¥‡à¤¤à¤¾à¤µà¤¨à¥€",
    pestDesc: "à¤†à¤ªà¤•à¥‡ à¤•à¥à¤·à¥‡à¤¤à¥à¤° à¤®à¥‡à¤‚ à¤•à¥‹à¤ˆ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤–à¤¤à¤°à¤¾ à¤¨à¤¹à¥€à¤‚ à¤ªà¤¾à¤¯à¤¾ à¤—à¤¯à¤¾à¥¤",
    addCropTitle: "à¤¨à¤ˆ à¤«à¤¸à¤² à¤‡à¤¨à¥à¤µà¥‡à¤‚à¤Ÿà¤°à¥€ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚",
    selectCrop: "-- à¤­à¤¾à¤°à¤¤à¥€à¤¯ à¤«à¤¸à¤² à¤šà¥à¤¨à¥‡à¤‚ --",
    weightKg: "à¤µà¤œà¤¨ (à¤•à¤¿à¤²à¥‹)",
    addCropBtn: "à¤«à¤¸à¤² à¤œà¥‹à¤¡à¤¼à¥‡à¤‚",
    myCropInventory: "à¤®à¥‡à¤°à¥€ à¤«à¤¸à¤² à¤‡à¤¨à¥à¤µà¥‡à¤‚à¤Ÿà¤°à¥€",
    emptyInventory: "à¤†à¤ªà¤•à¥€ à¤‡à¤¨à¥à¤µà¥‡à¤‚à¤Ÿà¤°à¥€ à¤µà¤°à¥à¤¤à¤®à¤¾à¤¨ à¤®à¥‡à¤‚ à¤–à¤¾à¤²à¥€ à¤¹à¥ˆà¥¤",
    lockedRate: "à¤²à¥‰à¤•à¥à¤¡ à¤¦à¤°:",
    remove: "à¤¹à¤Ÿà¤¾à¤à¤‚",
    liveCropMarket: "à¤²à¤¾à¤‡à¤µ à¤«à¤¸à¤² à¤¬à¤¾à¤œà¤¾à¤° à¤®à¥‚à¤²à¥à¤¯",
    cropName: "à¤«à¤¸à¤² à¤•à¤¾ à¤¨à¤¾à¤®",
    pastRates: "à¤ªà¤¿à¤›à¤²à¥€ à¤¦à¤°à¥‡à¤‚",
    liveRate: "à¤²à¤¾à¤‡à¤µ à¤¦à¤° à¤”à¤° à¤°à¥à¤à¤¾à¤¨",
    action: "à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ",
    sellMarket: "à¤¬à¤¾à¤œà¤¾à¤° à¤®à¥‡à¤‚ à¤¬à¥‡à¤šà¥‡à¤‚",
    procurementApp: "à¤–à¤°à¥€à¤¦ à¤†à¤µà¥‡à¤¦à¤¨",
    applyingFor: "à¤‡à¤¸à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤µà¥‡à¤¦à¤¨:",
    quantity: "à¤®à¤¾à¤¤à¥à¤°à¤¾ (à¤•à¤¿à¤²à¥‹ / à¤¬à¥ˆà¤—)",
    selectZone: "-- à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤œà¤¼à¥‹à¤¨ à¤šà¥à¤¨à¥‡à¤‚ --",
    selectSubPlace: "-- à¤‰à¤ª-à¤¸à¥à¤¥à¤¾à¤¨ à¤šà¥à¤¨à¥‡à¤‚ --",
    farmAddress: "à¤µà¤¿à¤¶à¤¿à¤·à¥à¤Ÿ à¤–à¥‡à¤¤ à¤•à¤¾ à¤ªà¤¤à¤¾",
    pattaChitta: "à¤ªà¤Ÿà¥à¤Ÿà¤¾ / à¤šà¤¿à¤Ÿà¥à¤Ÿà¤¾ à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤¸à¤‚à¤–à¥à¤¯à¤¾",
    uploadDoc:
      "à¤ªà¤Ÿà¥à¤Ÿà¤¾/à¤šà¤¿à¤Ÿà¥à¤Ÿà¤¾ à¤…à¤ªà¤²à¥‹à¤¡ à¤•à¤°à¥‡à¤‚ (JPG/PDF, Max 500KB)",
    confirmOrder: "VAO à¤•à¥‹ à¤¸à¤¬à¤®à¤¿à¤Ÿ à¤•à¤°à¥‡à¤‚",
    cancel: "à¤°à¤¦à¥à¤¦ à¤•à¤°à¥‡à¤‚",
    upcomingProcurements: "à¤†à¤—à¤¾à¤®à¥€ à¤–à¤°à¥€à¤¦",
    noActiveOrders: "à¤‡à¤¸ à¤¸à¤®à¤¯ à¤•à¥‹à¤ˆ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤†à¤¦à¥‡à¤¶ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤",
    aiAnalysis: "AI à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£",
    aiReport: "à¤¸à¤¾à¤ªà¥à¤¤à¤¾à¤¹à¤¿à¤• à¤…à¤‚à¤¤à¤°à¥à¤¦à¥ƒà¤·à¥à¤Ÿà¤¿ à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤œà¤¨à¤°à¥‡à¤Ÿ à¤•à¥€ à¤—à¤ˆ:",
    aiTip1:
      "à¤†à¤ªà¤•à¥‡ à¤–à¥‡à¤¤à¥‹à¤‚ à¤®à¥‡à¤‚ à¤¨à¤¾à¤‡à¤Ÿà¥à¤°à¥‹à¤œà¤¨ à¤•à¤¾ à¤¸à¥à¤¤à¤° à¤—à¤¿à¤° à¤¸à¤•à¤¤à¤¾ à¤¹à¥ˆà¥¤ à¤—à¥à¤°à¥à¤µà¤¾à¤° à¤¤à¤• à¤¯à¥‚à¤°à¤¿à¤¯à¤¾ à¤²à¤—à¤¾à¤¨à¥‡ à¤•à¥€ à¤¸à¤²à¤¾à¤¹ à¤¦à¥€ à¤œà¤¾à¤¤à¥€ à¤¹à¥ˆà¥¤",
    aiTip2:
      "à¤¬à¤¾à¤œà¤¾à¤° à¤•à¥€ à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤…à¤§à¤¿à¤•à¤¤à¤® à¤²à¤¾à¤­ à¤•à¥‡ à¤²à¤¿à¤ à¤—à¥‡à¤¹à¥‚à¤‚ à¤•à¥€ à¤¬à¤¿à¤•à¥à¤°à¥€ 2 à¤¸à¤ªà¥à¤¤à¤¾à¤¹ à¤¤à¤• à¤°à¥‹à¤•à¤¨à¥‡ à¤•à¤¾ à¤¸à¥à¤à¤¾à¤µ à¤¦à¥‡à¤¤à¥€ à¤¹à¥ˆà¥¤",
    aiTip3:
      "à¤®à¥Œà¤¸à¤® à¤µà¤¿à¤¶à¥à¤²à¥‡à¤·à¤£ à¤…à¤—à¤²à¥‡ 7 à¤¦à¤¿à¤¨à¥‹à¤‚ à¤¤à¤• à¤•à¥€à¤Ÿà¥‹à¤‚ à¤•à¥‡ à¤•à¤® à¤œà¥‹à¤–à¤¿à¤® à¤•à¥‹ à¤¦à¤°à¥à¤¶à¤¾à¤¤à¤¾ à¤¹à¥ˆà¥¤",
    helpTitle: "à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤”à¤° à¤®à¤¾à¤°à¥à¤—à¤¦à¤°à¥à¤¶à¤¨",
    helpIntro:
      "FarmFlow AI à¤®à¥‡à¤‚ à¤†à¤ªà¤•à¤¾ à¤¸à¥à¤µà¤¾à¤—à¤¤ à¤¹à¥ˆ! à¤¯à¤¹à¤¾à¤ à¤¬à¤¤à¤¾à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆ à¤•à¤¿ à¤…à¤ªà¤¨à¥‡ à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¥ˆà¤¸à¥‡ à¤•à¤°à¥‡à¤‚:",
    helpProfile:
      "à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²: à¤…à¤ªà¤¨à¥‡ à¤ªà¤‚à¤œà¥€à¤•à¥ƒà¤¤ à¤–à¤¾à¤¤à¥‡ à¤•à¤¾ à¤µà¤¿à¤µà¤°à¤£ à¤”à¤° à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤",
    helpCrops:
      "à¤®à¥‡à¤°à¥€ à¤«à¤¸à¤²à¥‡à¤‚: à¤…à¤ªà¤¨à¥€ à¤•à¤¾à¤Ÿà¥€ à¤—à¤ˆ à¤«à¤¸à¤²à¥‡à¤‚ à¤œà¥‹à¤¡à¤¼à¥‡à¤‚, à¤µà¤œà¤¨ à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚, à¤”à¤° à¤…à¤¨à¥à¤®à¤¾à¤¨à¤¿à¤¤ à¤²à¤¾à¤‡à¤µ à¤¬à¤¾à¤œà¤¾à¤° à¤®à¥‚à¤²à¥à¤¯ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤",
    helpProcurement:
      "à¤–à¤°à¥€à¤¦: à¤²à¤¾à¤‡à¤µ à¤¬à¤¾à¤œà¤¾à¤° à¤¦à¤°à¥‡à¤‚ à¤¦à¥‡à¤–à¥‡à¤‚à¥¤ à¤†à¤ª à¤…à¤ªà¤¨à¥€ à¤«à¤¸à¤² à¤¬à¥‡à¤šà¤¨à¥‡ à¤¯à¤¾ à¤•à¥ƒà¤·à¤¿ à¤†à¤ªà¥‚à¤°à¥à¤¤à¤¿ à¤–à¤°à¥€à¤¦à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤†à¤µà¥‡à¤¦à¤¨ à¤•à¤° à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤",
    helpTrack:
      "à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤Ÿà¥à¤°à¥ˆà¤• à¤•à¤°à¥‡à¤‚: à¤…à¤ªà¤¨à¥‡ VAO à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨, à¤†à¤µà¤‚à¤Ÿà¤¿à¤¤ à¤¸à¥à¤²à¥‰à¤Ÿ à¤”à¤° DBT à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤•à¥€ à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€ à¤•à¤°à¥‡à¤‚à¥¤",
    helpAi:
      "à¤à¤†à¤ˆ à¤…à¤‚à¤¤à¤°à¥à¤¦à¥ƒà¤·à¥à¤Ÿà¤¿: à¤…à¤ªà¤¨à¥‡ à¤–à¥‡à¤¤ à¤•à¥‡ à¤®à¥à¤¨à¤¾à¤«à¥‡ à¤•à¥‹ à¤…à¤§à¤¿à¤•à¤¤à¤® à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤à¤†à¤ˆ-à¤œà¤¨à¤¿à¤¤ à¤¸à¤²à¤¾à¤¹ à¤ªà¤¢à¤¼à¥‡à¤‚à¥¤"
  },

  ta: {
    navDashboard: "ðŸ“Š à®Ÿà®¾à®·à¯à®ªà¯‹à®°à¯à®Ÿà¯",
    navProfile: "ðŸ‘¤ à®Žà®©à¯ à®šà¯à®¯à®µà®¿à®µà®°à®®à¯",
    navCrops: "ðŸŒ¾ à®Žà®©à¯ à®ªà®¯à®¿à®°à¯à®•à®³à¯",
    navProcurement: "ðŸ›’ à®•à¯Šà®³à¯à®®à¯à®¤à®²à¯",
    navTrack: "ðŸ“¦ à®¨à®¿à®²à¯ˆ à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•",
    navAi: "ðŸ¤– AI à®†à®²à¯‹à®šà®©à¯ˆà®•à®³à¯",
    navHelp: "â“ à®‰à®¤à®µà®¿",
    logout: "à®µà¯†à®³à®¿à®¯à¯‡à®±à¯",
    module: "à®ªà®¿à®°à®¿à®µà¯",
    subtitle: "à®‰à®™à¯à®•à®³à¯ à®ªà®£à¯à®£à¯ˆ à®šà¯†à®¯à®²à¯à®ªà®¾à®Ÿà¯à®•à®³à¯ˆ à®Žà®³à®¿à®¤à®¾à®• à®¨à®¿à®°à¯à®µà®•à®¿à®•à¯à®•à®µà¯à®®à¯.",
    liveMarket: "à®¨à¯‡à®°à®Ÿà®¿ à®šà®¨à¯à®¤à¯ˆ à®šà¯†à®¯à®²à®¿à®²à¯ à®‰à®³à¯à®³à®¤à¯",
    userDetails: "à®ªà®¯à®©à®°à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯",
    fullName: "à®®à¯à®´à¯ à®ªà¯†à®¯à®°à¯:",
    emailAddr: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯:",
    phoneNumber: "à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿ à®Žà®£à¯:",
    role: "à®ªà®™à¯à®•à¯:",
    farmManager: "à®µà®¿à®µà®šà®¾à®¯à®¿",
    accountStatus: "à®•à®£à®•à¯à®•à¯ à®¨à®¿à®²à¯ˆ:",
    verified: "à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯ ðŸŸ¢",
    weather: "à®‰à®³à¯à®³à¯‚à®°à¯ à®µà®¾à®©à®¿à®²à¯ˆ",
    pestAlert: "à®ªà¯‚à®šà¯à®šà®¿ à®Žà®šà¯à®šà®°à®¿à®•à¯à®•à¯ˆ",
    pestDesc: "à®‰à®™à¯à®•à®³à¯ à®ªà®•à¯à®¤à®¿à®¯à®¿à®²à¯ à®Žà®¨à¯à®¤ à®…à®šà¯à®šà¯à®±à¯à®¤à¯à®¤à®²à¯à®®à¯ à®‡à®²à¯à®²à¯ˆ.",
    addCropTitle: "à®ªà¯à®¤à®¿à®¯ à®ªà®¯à®¿à®°à¯ à®šà¯‡à®°à¯à®ªà¯à®ªà®¤à¯",
    selectCrop: "-- à®‡à®¨à¯à®¤à®¿à®¯ à®ªà®¯à®¿à®°à¯ˆà®¤à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯ --",
    weightKg: "à®Žà®Ÿà¯ˆ (à®•à®¿à®²à¯‹)",
    addCropBtn: "à®ªà®¯à®¿à®°à¯ˆà®šà¯ à®šà¯‡à®°à¯",
    myCropInventory: "à®Žà®©à¯ à®ªà®¯à®¿à®°à¯ à®‡à®°à¯à®ªà¯à®ªà¯",
    emptyInventory: "à®‰à®™à¯à®•à®³à¯ à®‡à®°à¯à®ªà¯à®ªà¯ à®•à®¾à®²à®¿à®¯à®¾à®• à®‰à®³à¯à®³à®¤à¯.",
    lockedRate: "à®ªà¯‚à®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà¯à®Ÿ à®µà®¿à®²à¯ˆ:",
    remove: "à®¨à¯€à®•à¯à®•à¯",
    liveCropMarket: "à®¨à¯‡à®°à®Ÿà®¿ à®ªà®¯à®¿à®°à¯ à®šà®¨à¯à®¤à¯ˆ à®µà®¿à®²à¯ˆà®•à®³à¯",
    cropName: "à®ªà®¯à®¿à®°à¯ à®ªà¯†à®¯à®°à¯",
    pastRates: "à®•à®Ÿà®¨à¯à®¤ à®µà®¿à®²à¯ˆà®•à®³à¯",
    liveRate: "à®¨à¯‡à®°à®Ÿà®¿ à®µà®¿à®²à¯ˆ & à®ªà¯‹à®•à¯à®•à¯",
    action: "à®šà¯†à®¯à®²à¯",
    sellMarket: "à®šà®¨à¯à®¤à¯ˆà®¯à®¿à®²à¯ à®µà®¿à®±à¯à®•",
    procurementApp: "à®•à¯Šà®³à¯à®®à¯à®¤à®²à¯ à®µà®¿à®£à¯à®£à®ªà¯à®ªà®®à¯",
    applyingFor: "à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¿à®ªà¯à®ªà®¤à¯:",
    quantity: "à®…à®³à®µà¯ (à®•à®¿à®²à¯‹ / à®ªà¯ˆà®•à®³à¯)",
    selectZone: "-- à®®à®£à¯à®Ÿà®²à®¤à¯à®¤à¯ˆà®¤à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯ --",
    selectSubPlace: "-- à®•à®¿à®°à®¾à®®à®¤à¯à®¤à¯ˆà®¤à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯ --",
    farmAddress: "à®•à¯à®±à®¿à®ªà¯à®ªà®¿à®Ÿà¯à®Ÿ à®ªà®£à¯à®£à¯ˆ à®®à¯à®•à®µà®°à®¿",
    pattaChitta: "à®ªà®Ÿà¯à®Ÿà®¾ / à®šà®¿à®Ÿà¯à®Ÿà®¾ à®†à®µà®£ à®Žà®£à¯",
    uploadDoc:
      "à®ªà®Ÿà¯à®Ÿà®¾/à®šà®¿à®Ÿà¯à®Ÿà®¾à®µà¯ˆ à®ªà®¤à®¿à®µà¯‡à®±à¯à®±à®µà¯à®®à¯ (JPG/PDF, Max 500KB)",
    confirmOrder: "VAO à®•à¯à®•à¯ à®šà®®à®°à¯à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯",
    cancel: "à®°à®¤à¯à®¤à¯ à®šà¯†à®¯à¯",
    upcomingProcurements: "à®µà®°à®µà®¿à®°à¯à®•à¯à®•à¯à®®à¯ à®•à¯Šà®³à¯à®®à¯à®¤à®²à¯",
    noActiveOrders: "à®¤à®±à¯à®ªà¯‹à®¤à¯ à®Žà®¨à¯à®¤ à®†à®°à¯à®Ÿà®°à¯à®®à¯ à®‡à®²à¯à®²à¯ˆ.",
    aiAnalysis: "AI à®ªà®•à¯à®ªà¯à®ªà®¾à®¯à¯à®µà¯",
    aiReport: "à®µà®¾à®°à®¾à®¨à¯à®¤à®¿à®° à®…à®±à®¿à®•à¯à®•à¯ˆ:",
    aiTip1:
      "à®¨à¯ˆà®Ÿà¯à®°à®œà®©à¯ à®…à®³à®µà¯à®•à®³à¯ à®•à¯à®±à¯ˆà®¯à®•à¯à®•à¯‚à®Ÿà¯à®®à¯. à®µà®¿à®¯à®¾à®´à®•à¯à®•à®¿à®´à®®à¯ˆà®•à¯à®•à¯à®³à¯ à®¯à¯‚à®°à®¿à®¯à®¾ à®ªà®¯à®©à¯à®ªà®Ÿà¯à®¤à¯à®¤ à®ªà®°à®¿à®¨à¯à®¤à¯à®°à¯ˆà®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®•à®¿à®±à®¤à¯.",
    aiTip2:
      "à®²à®¾à®ªà®¤à¯à®¤à¯ˆ à®…à®¤à®¿à®•à®°à®¿à®•à¯à®• à®•à¯‹à®¤à¯à®®à¯ˆ à®µà®¿à®±à¯à®ªà®©à¯ˆà®¯à¯ˆ 2 à®µà®¾à®°à®™à¯à®•à®³à¯à®•à¯à®•à¯ à®¤à®¾à®®à®¤à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à®µà¯à®®à¯.",
    aiTip3:
      "à®…à®Ÿà¯à®¤à¯à®¤ 7 à®¨à®¾à®Ÿà¯à®•à®³à¯à®•à¯à®•à¯ à®ªà¯‚à®šà¯à®šà®¿à®•à®³à¯ à®¤à®¾à®•à¯à®•à¯à®®à¯ à®…à®ªà®¾à®¯à®®à¯ à®•à¯à®±à¯ˆà®µà¯.",
    helpTitle: "à®‰à®¤à®µà®¿ à®®à®±à¯à®±à¯à®®à¯ à®µà®´à®¿à®•à®¾à®Ÿà¯à®Ÿà®¿",
    helpIntro:
      "FarmFlow AI-à®•à¯à®•à¯ à®‰à®™à¯à®•à®³à¯ˆ à®µà®°à®µà¯‡à®±à¯à®•à®¿à®±à¯‹à®®à¯! à®Ÿà®¾à®·à¯à®ªà¯‹à®°à¯à®Ÿà¯ˆ à®Žà®µà¯à®µà®¾à®±à¯ à®ªà®¯à®©à¯à®ªà®Ÿà¯à®¤à¯à®¤à¯à®µà®¤à¯:",
    helpProfile:
      "à®šà¯à®¯à®µà®¿à®µà®°à®®à¯: à®‰à®™à¯à®•à®³à¯ à®•à®£à®•à¯à®•à¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ à®¨à®¿à®²à¯ˆà®¯à¯ˆà®ªà¯ à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯.",
    helpCrops:
      "à®Žà®©à¯ à®ªà®¯à®¿à®°à¯à®•à®³à¯: à®‰à®™à¯à®•à®³à¯ à®…à®±à¯à®µà®Ÿà¯ˆ à®ªà®¯à®¿à®°à¯à®•à®³à¯ˆà®šà¯ à®šà¯‡à®°à¯à®•à¯à®•à®µà¯à®®à¯, à®¨à¯‡à®°à®Ÿà®¿ à®šà®¨à¯à®¤à¯ˆ à®®à®¤à®¿à®ªà¯à®ªà¯ˆ à®…à®±à®¿à®¯à®µà¯à®®à¯.",
    helpProcurement:
      "à®•à¯Šà®³à¯à®®à¯à®¤à®²à¯: à®¨à¯‡à®°à®Ÿà®¿ à®šà®¨à¯à®¤à¯ˆ à®µà®¿à®²à¯ˆà®•à®³à¯ˆ à®•à®¾à®£à¯à®™à¯à®•à®³à¯. à®µà®¿à®±à¯à®• à®…à®²à¯à®²à®¤à¯ à®µà®¾à®™à¯à®• à®µà®¿à®£à¯à®£à®ªà¯à®ªà®¿à®•à¯à®•à®²à®¾à®®à¯.",
    helpTrack:
      "à®¨à®¿à®²à¯ˆ à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•: VAO à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯, à®’à®¤à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®¨à¯‡à®°à®™à¯à®•à®³à¯ à®®à®±à¯à®±à¯à®®à¯ DBT à®ªà®°à®¿à®®à®¾à®±à¯à®±à®™à¯à®•à®³à¯ˆ à®•à®£à¯à®•à®¾à®£à®¿à®•à¯à®•à®µà¯à®®à¯.",
    helpAi:
      "AI à®†à®²à¯‹à®šà®©à¯ˆà®•à®³à¯: à®²à®¾à®ªà®¤à¯à®¤à¯ˆ à®…à®¤à®¿à®•à®°à®¿à®•à¯à®• AI à®†à®²à¯‹à®šà®©à¯ˆà®•à®³à¯ˆà®ªà¯ à®ªà®Ÿà®¿à®•à¯à®•à®µà¯à®®à¯."
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
    icon: 'ðŸŒ¤ï¸'
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
        icon: 'ðŸ“'
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
            )}Â°C`,
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
                )}Â°C`,
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
            icon: 'ðŸŒ¤ï¸'
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
          icon: 'ðŸ“'
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
              `ðŸ”” Update: Your ${updatedOrder.item} application status is now "${updatedOrder.status}"!`
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
      icon: 'ðŸ“Š'
    },
    {
      id: 'profile',
      label: l.navProfile,
      icon: 'ðŸ‘¤'
    },
    {
      id: 'crops',
      label: l.navCrops,
      icon: 'ðŸŒ¾'
    },
    {
      id: 'procurement',
      label: l.navProcurement,
      icon: 'ðŸ›’'
    },
    {
      id: 'track',
      label: l.navTrack,
      icon: 'ðŸ“¦'
    },
    {
      id: 'ai',
      label: l.navAi,
      icon: 'ðŸ¤–'
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
            ðŸŒ±
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
            â“
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
          <span>â†ª</span>
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
              â˜°
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
                ðŸ””
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
                Ã—
              </button>
            </div>
          )}

        <div className="dashboard-content">

          {/* ================= HELP ================= */}
          {activeTab === 'help' && (
            <section className="content-section">

              <div className="page-intro-card">
                <div className="intro-icon">
                  â“
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
                    icon: 'ðŸ‘¤',
                    text: l.helpProfile
                  },
                  {
                    icon: 'ðŸŒ¾',
                    text: l.helpCrops
                  },
                  {
                    icon: 'ðŸ›’',
                    text: l.helpProcurement
                  },
                  {
                    icon: 'ðŸ“¦',
                    text: l.helpTrack
                  },
                  {
                    icon: 'ðŸ¤–',
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
                  âœ“ Verified
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
                    ðŸ‘¤
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
                    ! ðŸ‘‹
                  </h2>

                  <p>
                    Here's your farm
                    activity at a glance.
                  </p>
                </div>

                <div className="welcome-illustration">
                  ðŸŒ¾
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon green">
                    ðŸŒ¾
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
                    ðŸ“¦
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
                    ðŸ’°
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
                    ðŸ¤–
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
                      â†’
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
                    ðŸ“{' '}
                    {weatherData.locationName}
                  </p>

                  <p className="weather-description">
                    {weatherData.condition}
                  </p>

                  <div className="card-link">
                    View 24-hour forecast
                    <span>â†’</span>
                  </div>
                </button>

                <div className="pest-card">

                  <div className="card-top-line">

                    <div className="card-icon-large pest">
                      ðŸ›
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
                    ðŸ“¦
                  </div>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="empty-state">
                    <div>
                      ðŸ“­
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
                              ðŸ“¦
                            </div>

                            <div>
                              <strong>
                                {order.item}
                              </strong>

                              <span>
                                {order.quantity}{' '}
                                Units â€¢{' '}
                                {order.datetime}
                              </span>

                              <small>
                                ðŸ“{' '}
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
                  ðŸ“¦
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
                      ðŸ“­
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
                                ðŸ“ Location
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
                                ðŸ  Address
                              </span>

                              <strong>
                                {order.address ||
                                  'N/A'}
                              </strong>
                            </div>

                            <div>
                              <span>
                                ðŸ“… Assigned Slot
                              </span>

                              <strong>
                                {order.datetime ||
                                  'TBD by Officer'}
                              </strong>
                            </div>
                          </div>

                          <div className="dbt-card">

                            <span>
                              ðŸ’³ DBT PAYMENT
                            </span>

                            <strong>
                              {order.paymentStatus ||
                                'Awaiting Procurement Completion'}
                            </strong>

                            {order.payoutAmount && (
                              <b>
                                â‚¹
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
                                    ? 'âœ“'
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
                    ðŸŒ¾
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
                        {crop} (â‚¹
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
                      ðŸŒ±
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
                              ðŸŒ¾
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
                              Ã—
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
                              â‚¹
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
                              â‚¹
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
                    ðŸ“ˆ
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
                                    ðŸŒ¾
                                  </span>

                                  <strong>
                                    {crop}
                                  </strong>
                                </div>
                              </td>

                              <td>
                                <div className="past-rates">
                                  <span>
                                    â‚¹{p1}
                                  </span>

                                  <span>
                                    â‚¹{p2}
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
                                      â‚¹
                                      {marketRates[
                                        crop
                                      ].toFixed(
                                        2
                                      )}
                                    </strong>

                                    <small>
                                      {trendUp
                                        ? 'â†‘ Rising'
                                        : 'â†“ Falling'}
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
                    â† Back to Market
                  </button>

                  <div className="order-form-card">

                    <div className="order-form-header">

                      <div className="form-icon">
                        ðŸ›’
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
                            ðŸ“Ž Choose document
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
                            : `âœ“ ${l.confirmOrder}`}
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
                  ðŸ¤–
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
                    â— AI Generated
                  </div>
                </div>

                <div className="ai-insights">

                  <div className="ai-insight green">
                    <div>
                      ðŸŒ±
                    </div>

                    <p>
                      {l.aiTip1}
                    </p>
                  </div>

                  <div className="ai-insight blue">
                    <div>
                      ðŸ“ˆ
                    </div>

                    <p>
                      {l.aiTip2}
                    </p>
                  </div>

                  <div className="ai-insight orange">
                    <div>
                      ðŸŒ¦ï¸
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
                  ðŸ“{' '}
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
                Ã—
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
                        ðŸ’§{' '}
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
