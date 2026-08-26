import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProcurementStatus from "./pages/ProcurementStatus.jsx";
import Scheduling from "./pages/Scheduling.jsx";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
// 1. Import AI Insights here
import AIInsights from "./pages/AIInsights.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/procurement-status" element={<ProcurementStatus />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        {/* 2. Add AI Insights route here */}
        <Route path="/ai-insights" element={<AIInsights />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);