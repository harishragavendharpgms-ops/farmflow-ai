import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import './SupervisorDashboard.css';

const SupervisorDashboard = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: 'Supervisor K. Ramanathan',
    email: 'supervisor@agriprocure.com',
    role: 'supervisor',
    zone: 'Central Mandi District',
    subPlace: 'APMC Regional Head Office'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [activeFilterTab, setActiveFilterTab] = useState('pending'); // 'pending' | 'completed' | 'all'
  const [isCrediting, setIsCrediting] = useState(false);

  // Main View Switcher
  const [activeMainTab, setActiveMainTab] = useState('procurements'); // 'procurements' | 'reports'

  // Daily Reports State
  const [dailyReports, setDailyReports] = useState([]);
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all'); // 'all' | 'pending' | 'acknowledged'
  const [selectedReportForChallan, setSelectedReportForChallan] = useState(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Modals
  const [selectedOrderForCredit, setSelectedOrderForCredit] = useState(null);
  const [selectedOrderForVoucher, setSelectedOrderForVoucher] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dbtConfirmationNote, setDbtConfirmationNote] = useState(true);

  // Load Saved User
  useEffect(() => {
    const savedUser =
      localStorage.getItem('farmflow_user') ||
      sessionStorage.getItem('farmflow_user');

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserProfile((prev) => ({
          ...prev,
          ...parsed,
          name: parsed.name || 'Supervisor K. Ramanathan',
          role: parsed.role || 'supervisor'
        }));
      } catch (e) {
        console.error('Failed to parse saved supervisor:', e);
      }
    }
  }, []);

  // Real-time Firestore Orders Listener
  useEffect(() => {
    const q = collection(db, 'orders');

    const unsub = onSnapshot(
      q,
      (snap) => {
        const allOrders = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          token: d.data().token || `PDC-${d.id.slice(-6).toUpperCase()}`
        }));

        allOrders.sort(
          (a, b) => new Date(b.procuredAt || b.createdAt || 0) - new Date(a.procuredAt || a.createdAt || 0)
        );

        setOrders(allOrders);
      },
      (err) => {
        console.error('Failed to fetch supervisor orders:', err);
      }
    );

    return () => unsub();
  }, []);

  // Real-time Firestore Daily Reports Listener
  useEffect(() => {
    const q = collection(db, 'dailyReports');

    const unsub = onSnapshot(
      q,
      (snap) => {
        const reports = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        reports.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        setDailyReports(reports);
      },
      (err) => {
        console.error('Failed to fetch daily reports:', err);
      }
    );

    return () => unsub();
  }, []);

  // TextBee SMS Dispatch
  const triggerSms = async (phoneNumber, message) => {
    if (!phoneNumber || phoneNumber === 'N/A') return;

    let cleanPhone = phoneNumber.toString().replace(/[^\d+]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    const TEXTBEE_DEVICE_ID = '6a9d1e51ccb6c727098825fb';
    const TEXTBEE_API_KEY = 'txb_TxrBzRwSdleKWzGtwMlg3bavFWnhAL7v';

    try {
      await fetch(
        `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': TEXTBEE_API_KEY
          },
          body: JSON.stringify({
            receivers: [cleanPhone],
            smsBody: message
          })
        }
      );
    } catch (err) {
      console.warn('TextBee SMS dispatch failed:', err.message);
    }
  };

  // Filter procurements
  // Procurements visible to supervisor are those that were handled by officers:
  // status === 'Procured' (pending supervisor credit) or status === 'Completed' (already credited)
  const procuredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'Procured' ||
        o.status === 'Completed' ||
        o.paymentStatus === 'Pending Supervisor Credit' ||
        o.paymentStatus === 'Paid via DBT' ||
        Boolean(o.procuredAt)
    );
  }, [orders]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalProcured = procuredOrders.length;
    const pendingCredit = procuredOrders.filter(
      (o) => o.status === 'Procured' || o.paymentStatus === 'Pending Supervisor Credit'
    );
    const completedCredit = procuredOrders.filter(
      (o) => o.status === 'Completed' || o.paymentStatus === 'Paid via DBT'
    );

    const totalAmountDisbursed = completedCredit.reduce(
      (sum, o) => sum + (parseFloat(o.payoutAmount) || (parseFloat(o.quantity) || 0) * 23),
      0
    );

    const pendingAmount = pendingCredit.reduce(
      (sum, o) => sum + (parseFloat(o.payoutAmount) || (parseFloat(o.quantity) || 0) * 23),
      0
    );

    const totalQtyQtl = procuredOrders.reduce(
      (sum, o) => sum + (parseFloat(o.quantity) || 0),
      0
    );

    return {
      totalProcured,
      pendingCount: pendingCredit.length,
      pendingAmount: pendingAmount.toFixed(2),
      completedCount: completedCredit.length,
      totalAmountDisbursed: totalAmountDisbursed.toFixed(2),
      totalQtyQtl: totalQtyQtl.toFixed(1)
    };
  }, [procuredOrders]);

  // Available Zones from data
  const availableZones = useMemo(() => {
    const zones = procuredOrders.map((o) => o.zone).filter(Boolean);
    return [...new Set(zones)];
  }, [procuredOrders]);

  // Filtered List based on search, zone, and status tab
  const filteredList = useMemo(() => {
    return procuredOrders.filter((order) => {
      // Status Tab filter
      let matchStatus = true;
      if (activeFilterTab === 'pending') {
        matchStatus = order.status === 'Procured' || order.paymentStatus === 'Pending Supervisor Credit';
      } else if (activeFilterTab === 'completed') {
        matchStatus = order.status === 'Completed' || order.paymentStatus === 'Paid via DBT';
      }

      // Zone filter
      let matchZone = true;
      if (selectedZoneFilter !== 'all') {
        matchZone = order.zone === selectedZoneFilter;
      }

      // Search filter
      const s = searchTerm.trim().toLowerCase();
      let matchSearch = true;
      if (s) {
        matchSearch =
          (order.userName && order.userName.toLowerCase().includes(s)) ||
          (order.userPhone && order.userPhone.includes(s)) ||
          (order.token && order.token.toLowerCase().includes(s)) ||
          (order.item && order.item.toLowerCase().includes(s)) ||
          (order.procuredBy && order.procuredBy.toLowerCase().includes(s)) ||
          (order.aadharNumber && order.aadharNumber.includes(s)) ||
          (order.bankName && order.bankName.toLowerCase().includes(s)) ||
          (order.bankAccountNumber && order.bankAccountNumber.includes(s)) ||
          (order.ifscCode && order.ifscCode.toLowerCase().includes(s));
      }

      return matchStatus && matchZone && matchSearch;
    });
  }, [procuredOrders, activeFilterTab, selectedZoneFilter, searchTerm]);

  // Credit Amount (DBT) Action Handler
  const handleAuthorizeDbtCredit = async () => {
    if (!selectedOrderForCredit) return;
    if (!dbtConfirmationNote) {
      alert('Please check the authorization declaration before disbursing funds.');
      return;
    }

    const order = selectedOrderForCredit;
    const finalAmount = order.payoutAmount || ((parseFloat(order.quantity) || 0) * 23).toFixed(2);
    const transactionRef = `DBT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    setIsCrediting(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'Completed',
        paymentStatus: 'Paid via DBT',
        payoutAmount: finalAmount,
        creditedAt: new Date().toISOString(),
        transactionRef: transactionRef,
        creditedBy: {
          name: userProfile.name || 'Supervisor K. Ramanathan',
          email: userProfile.email || 'supervisor@agriprocure.com',
          role: 'supervisor'
        }
      });

      // Send SMS to Farmer
      const maskedAcc = order.bankAccountNumber
        ? `••••${order.bankAccountNumber.slice(-4)}`
        : 'Bank Account';
      const smsMsg = `AgriProcure: Govt DBT Payment of INR ${finalAmount} has been successfully credited to your ${order.bankName || 'bank'} account (${maskedAcc}) for Token ${order.token} (${order.item}). Ref: ${transactionRef}.`;

      await triggerSms(order.userPhone, smsMsg);

      alert(`✅ DBT Amount of ₹${parseFloat(finalAmount).toLocaleString('en-IN')} successfully credited to ${order.userName}'s bank account!\nTransaction Ref: ${transactionRef}`);
      setSelectedOrderForCredit(null);
    } catch (err) {
      console.error('Error crediting DBT:', err);
      alert('Failed to credit DBT amount: ' + err.message);
    } finally {
      setIsCrediting(false);
    }
  };

  // Compute Daily Reports Metrics
  const reportMetrics = useMemo(() => {
    const totalReports = dailyReports.length;
    const pendingAcknowledge = dailyReports.filter(
      (r) => r.status !== 'Acknowledged by Supervisor'
    ).length;
    const acknowledgedCount = dailyReports.filter(
      (r) => r.status === 'Acknowledged by Supervisor'
    ).length;

    const totalTransportedQtl = dailyReports.reduce(
      (sum, r) => sum + (parseFloat(r.quintalsTransported) || 0),
      0
    );
    const totalProcuredQtl = dailyReports.reduce(
      (sum, r) => sum + (parseFloat(r.quintalsProcured) || 0),
      0
    );
    const totalGunnyUsed = dailyReports.reduce(
      (sum, r) => sum + (parseInt(r.gunnyBagsUsed) || 0),
      0
    );
    const latestGunnyLeft = dailyReports.length > 0 ? (dailyReports[0].gunnyBagsLeft ?? 0) : 0;

    return {
      totalReports,
      pendingAcknowledge,
      acknowledgedCount,
      totalTransportedQtl: totalTransportedQtl.toFixed(1),
      totalProcuredQtl: totalProcuredQtl.toFixed(1),
      totalGunnyUsed,
      latestGunnyLeft
    };
  }, [dailyReports]);

  // Filtered Daily Reports based on search and status filter
  const filteredDailyReports = useMemo(() => {
    return dailyReports.filter((report) => {
      // Status filter
      if (reportStatusFilter === 'pending' && report.status === 'Acknowledged by Supervisor') {
        return false;
      }
      if (reportStatusFilter === 'acknowledged' && report.status !== 'Acknowledged by Supervisor') {
        return false;
      }

      // Search filter
      const s = reportSearchTerm.trim().toLowerCase();
      if (!s) return true;

      return (
        (report.lorryNumber && report.lorryNumber.toLowerCase().includes(s)) ||
        (report.driverName && report.driverName.toLowerCase().includes(s)) ||
        (report.driverPhone && report.driverPhone.includes(s)) ||
        (report.officerName && report.officerName.toLowerCase().includes(s)) ||
        (report.centre && report.centre.toLowerCase().includes(s)) ||
        (report.zone && report.zone.toLowerCase().includes(s)) ||
        (report.challanRef && report.challanRef.toLowerCase().includes(s)) ||
        (report.destinationGodown && report.destinationGodown.toLowerCase().includes(s)) ||
        (report.date && report.date.includes(s))
      );
    });
  }, [dailyReports, reportStatusFilter, reportSearchTerm]);

  // Supervisor Acknowledge Daily Report
  const handleAcknowledgeReport = async (report) => {
    setIsAcknowledging(true);
    try {
      await updateDoc(doc(db, 'dailyReports', report.id), {
        status: 'Acknowledged by Supervisor',
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: {
          name: userProfile.name || 'Supervisor K. Ramanathan',
          email: userProfile.email || 'supervisor@agriprocure.com',
          role: 'supervisor'
        }
      });
      alert(`✅ Lorry Dispatch & Day-End Report (${report.challanRef || report.lorryNumber}) has been officially acknowledged!`);
    } catch (err) {
      console.error('Error acknowledging report:', err);
      alert('Failed to acknowledge report: ' + err.message);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="v-sup-shell">
      {/* TOP HEADER */}
      <header className="v-sup-header">
        <div className="v-sup-brand">
          <span className="v-sup-logo-leaf">🌱</span>
          <div>
            <strong>Agri<span>Procure</span></strong>
            <small>SUPERVISOR COMMAND PORTAL • DBT TREASURY DISBURSAL</small>
          </div>
        </div>

        <div className="v-sup-header-right">
          <div className="v-sup-profile-badge">
            <div className="v-sup-avatar">
              {(userProfile.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="v-sup-user-info">
              <strong>{userProfile.name}</strong>
              <small>👔 Mandi Procurement Supervisor ({userProfile.zone || 'Central Zone'})</small>
            </div>
          </div>

          <button
            type="button"
            className="v-sup-logout-btn"
            onClick={() => setShowLogoutModal(true)}
            title="Sign out"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="v-sup-main">
        {/* BANNER GREETING */}
        <div className="v-sup-hero-card">
          <div className="v-sup-hero-content">
            <h1>
              {activeMainTab === 'procurements'
                ? 'Procurement Approval & Direct Benefit Transfer (DBT)'
                : 'Mandi Day-End Closing & Lorry Dispatch Operations'}
            </h1>
            <p>
              {activeMainTab === 'procurements'
                ? "Review all crop procurements verified and weighed by mandi officers. Authorize and disburse direct treasury payments into farmers' bank accounts."
                : 'Monitor daily closing reports submitted by Mandi Officers: total quintals procured, gunny bags utilized vs in stock, and verify lorry dispatches with driver credentials.'}
            </p>
          </div>

          <div className="v-sup-hero-actions">
            <div className="v-sup-treasury-tag">
              <span>{activeMainTab === 'procurements' ? '🏛️' : '🚛'}</span>
              <div>
                <small>{activeMainTab === 'procurements' ? 'DISBURSAL GATEWAY' : 'LOGISTICS & TRANSIT'}</small>
                <strong>
                  {activeMainTab === 'procurements'
                    ? 'PFMS / RBI Direct Benefit Transfer Active'
                    : 'CWC / SWC Buffer Godown Link Active'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* TOP LEVEL NAVIGATION TABS */}
        <div className="v-sup-main-nav">
          <button
            type="button"
            className={`v-sup-nav-tab-btn ${activeMainTab === 'procurements' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('procurements')}
          >
            <span className="v-nav-icon">🌾</span>
            <span className="v-nav-title">Farmer Procurements & DBT Credits</span>
            {metrics.pendingCount > 0 && (
              <span className="v-sup-nav-badge warning">{metrics.pendingCount} Pending</span>
            )}
          </button>

          <button
            type="button"
            className={`v-sup-nav-tab-btn ${activeMainTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveMainTab('reports')}
          >
            <span className="v-nav-icon">🚚</span>
            <span className="v-nav-title">Day-End Closing & Lorry Dispatches</span>
            {reportMetrics.pendingAcknowledge > 0 ? (
              <span className="v-sup-nav-badge info">{reportMetrics.pendingAcknowledge} New</span>
            ) : (
              <span className="v-sup-nav-badge neutral">{dailyReports.length}</span>
            )}
          </button>
        </div>

        {activeMainTab === 'procurements' && (
          <>
            {/* METRICS / STATS CARDS */}
            <div className="v-sup-kpi-grid">
          <div className="v-sup-kpi-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon blue">📦</span>
              <span className="kpi-title">TOTAL PROCURED BATCHES</span>
            </div>
            <div className="kpi-value">{metrics.totalProcured}</div>
            <div className="kpi-sub">Total {metrics.totalQtyQtl} Qtl intake by officers</div>
          </div>

          <div className="v-sup-kpi-card pending-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon amber">⏳</span>
              <span className="kpi-title">PENDING DBT DISBURSAL</span>
              {metrics.pendingCount > 0 && <span className="kpi-pulse-dot" />}
            </div>
            <div className="kpi-value" style={{ color: '#d97706' }}>
              {metrics.pendingCount}
            </div>
            <div className="kpi-sub">
              ₹{parseFloat(metrics.pendingAmount).toLocaleString('en-IN')} awaiting supervisor credit
            </div>
          </div>

          <div className="v-sup-kpi-card success-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon green">💳</span>
              <span className="kpi-title">TOTAL CREDITED VIA DBT</span>
            </div>
            <div className="kpi-value" style={{ color: '#16a34a' }}>
              ₹{parseFloat(metrics.totalAmountDisbursed).toLocaleString('en-IN')}
            </div>
            <div className="kpi-sub">{metrics.completedCount} successful farmer bank transfers</div>
          </div>

          <div className="v-sup-kpi-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon purple">⚖️</span>
              <span className="kpi-title">TOTAL VOLUME PROCURED</span>
            </div>
            <div className="kpi-value">{metrics.totalQtyQtl}</div>
            <div className="kpi-sub">Verified against official MSP benchmarks</div>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH, TABS & ZONE FILTER */}
        <div className="v-sup-controls-card">
          <div className="v-sup-tabs">
            <button
              type="button"
              className={`v-sup-tab-btn ${activeFilterTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('pending')}
            >
              ⏳ Pending Credit ({metrics.pendingCount})
            </button>
            <button
              type="button"
              className={`v-sup-tab-btn ${activeFilterTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('completed')}
            >
              ✓ Credited / Completed ({metrics.completedCount})
            </button>
            <button
              type="button"
              className={`v-sup-tab-btn ${activeFilterTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('all')}
            >
              All Procurements ({procuredOrders.length})
            </button>
          </div>

          <div className="v-sup-filters">
            {/* Search Input */}
            <div className="v-sup-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search farmer, Aadhaar, account, token, or officer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Zone Filter */}
            <div className="v-sup-zone-select">
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
              >
                <option value="all">📍 All Mandi Zones</option>
                {availableZones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* PROCUREMENTS TABLE CARD */}
        <div className="v-sup-table-card">
          <div className="v-sup-table-header">
            <div>
              <h3>Procurement & Payment Ledger</h3>
              <p>Official records of crops procured by mandi officers and credited via Direct Benefit Transfer</p>
            </div>
            <span className="v-table-count-badge">
              Showing {filteredList.length} of {procuredOrders.length} records
            </span>
          </div>

          <div className="v-table-responsive">
            <table className="v-clean-table v-sup-table">
              <thead>
                <tr>
                  <th>TOKEN & DATE</th>
                  <th>FARMER DETAILS</th>
                  <th>AADHAAR & BANK (DBT)</th>
                  <th>CROP & WEIGHT</th>
                  <th>PROCURING OFFICER</th>
                  <th>PAYOUT AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <div className="v-sup-empty-state">
                        <span className="empty-emoji">📦</span>
                        <h4>No Procurements Found</h4>
                        <p>
                          {activeFilterTab === 'pending'
                            ? 'All officer procurements have been credited! No pending DBT transfers.'
                            : 'No procurements match your selected search or filter criteria.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((order) => {
                    const isPaid = order.status === 'Completed' || order.paymentStatus === 'Paid via DBT';
                    const amount = order.payoutAmount || ((parseFloat(order.quantity) || 0) * 23).toFixed(2);
                    const formattedDate = order.procuredAt
                      ? new Date(order.procuredAt).toLocaleDateString([], {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'Recently';

                    return (
                      <tr key={order.id} className={!isPaid ? 'pending-row' : ''}>
                        {/* TOKEN & DATE */}
                        <td>
                          <div className="v-sup-token-cell">
                            <strong>{order.token || `PDC-${order.id.slice(-6).toUpperCase()}`}</strong>
                            <small>📅 {formattedDate}</small>
                            <span className="v-zone-chip">📍 {order.zone || 'Central Zone'}</span>
                          </div>
                        </td>

                        {/* FARMER DETAILS */}
                        <td>
                          <div className="v-sup-farmer-cell">
                            <strong>{order.userName || 'Farmer'}</strong>
                            <span className="v-farmer-phone">📱 +91 {order.userPhone || '---'}</span>
                            <small className="v-farmer-subplace">🏘️ {order.subPlace || order.address || 'Local Mandi'}</small>
                          </div>
                        </td>

                        {/* AADHAAR & BANK ACCOUNT (DBT) */}
                        <td>
                          <div className="v-sup-bank-cell">
                            <div className="v-bank-row">
                              <span className="v-bank-icon">🪪</span>
                              <div>
                                <small>AADHAAR</small>
                                <strong>
                                  {order.aadharNumber
                                    ? `•••• •••• ${order.aadharNumber.slice(-4)}`
                                    : 'Aadhaar on Profile'}
                                </strong>
                              </div>
                            </div>

                            <div className="v-bank-row" style={{ marginTop: '6px' }}>
                              <span className="v-bank-icon">🏦</span>
                              <div>
                                <small>{order.bankName || 'State Bank of India'}</small>
                                <strong>
                                  {order.bankAccountNumber
                                    ? `A/C •••• ${order.bankAccountNumber.slice(-4)}`
                                    : 'A/C on Record'}
                                </strong>
                                {order.ifscCode && (
                                  <span className="v-ifsc-tag">IFSC: {order.ifscCode}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CROP & WEIGHT */}
                        <td>
                          <div className="v-sup-crop-cell">
                            <span className="v-crop-chip">🌾 {order.item || 'Crop'}</span>
                            <strong>{order.verifiedWeight || order.quantity} Qtl</strong>
                            <div style={{ marginTop: '4px', fontSize: '0.74rem' }}>
                              <span style={{ color: '#0369a1', fontWeight: 700, display: 'block' }}>
                                ⭐ {order.officerQuality ? `Grade: ${order.officerQuality}` : (order.quality || 'Grade A (FAQ)')}
                              </span>
                              {order.officerQuality && order.quality && order.officerQuality !== order.quality && (
                                <small style={{ color: '#64748b', display: 'block' }}>
                                  Farmer Declared: {order.quality}
                                </small>
                              )}
                              {order.moistureContent && (
                                <small style={{ color: '#059669', display: 'block' }}>
                                  Moisture: {order.moistureContent}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* PROCURING OFFICER */}
                        <td>
                          <div className="v-sup-officer-cell">
                            <strong>{order.procuredBy || 'Operator Sai Kumar'}</strong>
                            <small>APMC Weighbridge Counter</small>
                            {order.procuredCentre && (
                              <span className="v-centre-tag">{order.procuredCentre}</span>
                            )}
                          </div>
                        </td>

                        {/* PAYOUT AMOUNT */}
                        <td>
                          <div className="v-sup-payout-cell">
                            <strong>₹{parseFloat(amount).toLocaleString('en-IN')}</strong>
                            <small>{isPaid ? 'Credited via DBT' : 'Ready for Disbursal'}</small>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td>
                          {isPaid ? (
                            <div className="v-status-badge-wrap">
                              <span className="pill-badge pill-badge-green">✓ Paid via DBT</span>
                              {order.transactionRef && (
                                <small className="v-tx-ref">Ref: {order.transactionRef.slice(-6)}</small>
                              )}
                            </div>
                          ) : (
                            <div className="v-status-badge-wrap">
                              <span className="pill-badge pill-badge-amber">⏳ Pending Credit</span>
                              <small style={{ color: '#d97706', fontSize: '0.72rem' }}>Supervisor Action</small>
                            </div>
                          )}
                        </td>

                        {/* ACTION */}
                        <td>
                          {!isPaid ? (
                            <button
                              type="button"
                              className="v-btn-credit-dbt"
                              onClick={() => {
                                setSelectedOrderForCredit(order);
                                setDbtConfirmationNote(true);
                              }}
                            >
                              💳 Credit Amount (DBT)
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="v-btn-view-voucher"
                              onClick={() => setSelectedOrderForVoucher(order)}
                            >
                              📄 View Voucher
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

    {activeMainTab === 'reports' && (
      <>
        {/* DAILY REPORTS KPI GRID */}
        <div className="v-sup-kpi-grid">
          <div className="v-sup-kpi-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon blue">🚚</span>
              <span className="kpi-title">TOTAL DISPATCHES FILED</span>
            </div>
            <div className="kpi-value">{reportMetrics.totalReports}</div>
            <div className="kpi-sub">
              {reportMetrics.pendingAcknowledge > 0
                ? `${reportMetrics.pendingAcknowledge} awaiting supervisor acknowledgement`
                : 'All officer reports acknowledged'}
            </div>
          </div>

          <div className="v-sup-kpi-card pending-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon amber">🚛</span>
              <span className="kpi-title">VOLUME IN TRANSIT</span>
              {reportMetrics.pendingAcknowledge > 0 && <span className="kpi-pulse-dot" />}
            </div>
            <div className="kpi-value" style={{ color: '#d97706' }}>
              {reportMetrics.totalTransportedQtl} <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Qtl</span>
            </div>
            <div className="kpi-sub">
              Total intake today: {reportMetrics.totalProcuredQtl} Qtl procured
            </div>
          </div>

          <div className="v-sup-kpi-card success-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon green">📦</span>
              <span className="kpi-title">GUNNY BAGS DISPATCHED</span>
            </div>
            <div className="kpi-value" style={{ color: '#16a34a' }}>
              {reportMetrics.totalGunnyUsed} <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>Bags</span>
            </div>
            <div className="kpi-sub">
              Buffer balance: {reportMetrics.latestGunnyLeft} bags in stock
            </div>
          </div>

          <div className="v-sup-kpi-card">
            <div className="v-sup-kpi-head">
              <span className="kpi-icon purple">🏭</span>
              <span className="kpi-title">GODOWN DESTINATIONS</span>
            </div>
            <div className="kpi-value" style={{ fontSize: '1.45rem', marginTop: '6px' }}>
              Central & State Buffer
            </div>
            <div className="kpi-sub">CWC / SWC Warehouse Network</div>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH & STATUS TABS FOR REPORTS */}
        <div className="v-sup-controls-card">
          <div className="v-sup-tabs">
            <button
              type="button"
              className={`v-sup-tab-btn ${reportStatusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setReportStatusFilter('all')}
            >
              All Dispatches ({dailyReports.length})
            </button>
            <button
              type="button"
              className={`v-sup-tab-btn ${reportStatusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setReportStatusFilter('pending')}
            >
              ⏳ Awaiting Acknowledgment ({reportMetrics.pendingAcknowledge})
            </button>
            <button
              type="button"
              className={`v-sup-tab-btn ${reportStatusFilter === 'acknowledged' ? 'active' : ''}`}
              onClick={() => setReportStatusFilter('acknowledged')}
            >
              ✓ Acknowledged ({reportMetrics.acknowledgedCount})
            </button>
          </div>

          <div className="v-sup-filters">
            <div className="v-sup-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search lorry no, driver phone, officer, centre, challan..."
                value={reportSearchTerm}
                onChange={(e) => setReportSearchTerm(e.target.value)}
              />
              {reportSearchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setReportSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* REPORTS TABLE CARD */}
        <div className="v-sup-table-card">
          <div className="v-sup-table-header">
            <div>
              <h3>Mandi Day-End Closing & Goods Lorry Dispatch Ledger</h3>
              <p>Official end-of-day reports submitted by Mandi Officers with quantity, gunny bags, and transport credentials</p>
            </div>
            <span className="v-table-count-badge">
              Showing {filteredDailyReports.length} of {dailyReports.length} reports
            </span>
          </div>

          <div className="v-table-responsive">
            <table className="v-clean-table v-sup-table">
              <thead>
                <tr>
                  <th>CHALLAN & DATE</th>
                  <th>MANDI CENTRE & OFFICER</th>
                  <th>INTAKE & DISPATCH</th>
                  <th>GUNNY BAGS (USED / LEFT)</th>
                  <th>LORRY & DRIVER CONTACT</th>
                  <th>DESTINATION WAREHOUSE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredDailyReports.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="v-empty-table-cell">
                      <div className="v-empty-state">
                        <span className="v-empty-icon">🚛</span>
                        <h4>No Day-End Reports Found</h4>
                        <p>
                          {dailyReports.length === 0
                            ? 'Mandi officers have not submitted day-end reports yet today. When filed from the Officer Dashboard, they will appear here in real-time.'
                            : 'No reports matched your current search/filter criteria.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDailyReports.map((report) => {
                    const isAck = report.status === 'Acknowledged by Supervisor';
                    return (
                      <tr key={report.id} className={!isAck ? 'row-pending-credit' : ''}>
                        <td>
                          <div className="v-cell-token">
                            <span className="v-token-badge">{report.challanRef || 'DSP-CHALLAN'}</span>
                            <small className="v-date-sub">
                              📅 {report.date}
                            </small>
                            {report.createdAt && (
                              <small style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                ⏱️ {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="v-cell-officer">
                            <strong>{report.centre || 'APMC Centre'}</strong>
                            <small>Officer: <b>{report.officerName || 'Officer'}</b></small>
                            <span className="v-officer-zone-chip">📍 {report.zone || 'District Zone'}</span>
                          </div>
                        </td>

                        <td>
                          <div className="v-cell-crop">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Procured:</span>
                              <strong style={{ color: '#0f172a' }}>{report.quintalsProcured} Qtl</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>In Lorry:</span>
                              <strong style={{ color: '#16a34a' }}>{report.quintalsTransported} Qtl</strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="v-cell-gunny">
                            <div className="v-gunny-pill-used" title="Gunny bags loaded on vehicle">
                              <span>Used:</span>
                              <strong>{report.gunnyBagsUsed} bags</strong>
                            </div>
                            <div className="v-gunny-pill-left" title="Gunny bags remaining in mandi buffer stock">
                              <span>Stock Left:</span>
                              <strong>{report.gunnyBagsLeft} bags</strong>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="v-cell-lorry">
                            <div className="v-lorry-reg-plate">
                              🚛 {report.lorryNumber || 'NOT SPECIFIED'}
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                              {report.driverName || 'Designated Driver'}
                            </div>
                            {report.driverPhone && (
                              <a
                                href={`tel:${report.driverPhone}`}
                                className="v-driver-phone-link"
                                title="Click to call driver"
                              >
                                📞 +91 {report.driverPhone}
                              </a>
                            )}
                          </div>
                        </td>

                        <td>
                          <div style={{ maxWidth: '210px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                              🏢 {report.destinationGodown || 'Central Godown'}
                            </div>
                            {report.remarks && (
                              <small style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px', fontStyle: 'italic' }}>
                                "{report.remarks.length > 55 ? report.remarks.slice(0, 52) + '...' : report.remarks}"
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          {isAck ? (
                            <span className="v-status-badge completed">
                              ✓ Acknowledged
                            </span>
                          ) : (
                            <span className="v-status-badge pending">
                              ⏳ Awaiting Review
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="v-action-btn-group">
                            {!isAck && (
                              <button
                                type="button"
                                className="v-action-btn-credit"
                                disabled={isAcknowledging}
                                onClick={() => handleAcknowledgeReport(report)}
                                title="Acknowledge receipt and verify transport"
                              >
                                ✓ Acknowledge
                              </button>
                            )}
                            <button
                              type="button"
                              className="v-action-btn-voucher"
                              onClick={() => setSelectedReportForChallan(report)}
                              title="View and print official dispatch challan"
                            >
                              📄 Challan
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
      </main>

      {/* MODAL 1: CREDIT AMOUNT (DBT DISBURSAL AUTHORIZATION) */}
      {selectedOrderForCredit && (
        <div className="v-modal-overlay" onClick={() => !isCrediting && setSelectedOrderForCredit(null)}>
          <div className="v-modal-card v-dbt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v-modal-header">
              <div className="v-dbt-modal-title">
                <span className="v-modal-badge-ico">🏛️</span>
                <div>
                  <h4>Authorize Government DBT Credit</h4>
                  <small>State Treasury Direct Benefit Transfer Disbursal</small>
                </div>
              </div>
              <button
                type="button"
                className="v-close-modal"
                disabled={isCrediting}
                onClick={() => setSelectedOrderForCredit(null)}
              >
                ✕
              </button>
            </div>

            {/* BENEFICIARY & PROCUREMENT SUMMARY CARD */}
            <div className="v-dbt-summary-box">
              <div className="v-dbt-payout-banner">
                <small>TOTAL NET AMOUNT TO DISBURSE</small>
                <h2>
                  ₹
                  {parseFloat(
                    selectedOrderForCredit.payoutAmount ||
                      (parseFloat(selectedOrderForCredit.quantity) || 0) * 23
                  ).toLocaleString('en-IN')}
                </h2>
                <span>Calculated via official Mandi procurement weight & rate</span>
              </div>

              <div className="v-dbt-details-grid">
                <div className="v-dbt-dg-item">
                  <small>FARMER (BENEFICIARY)</small>
                  <strong>{selectedOrderForCredit.userName || 'Farmer'}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    +91 {selectedOrderForCredit.userPhone}
                  </span>
                </div>

                <div className="v-dbt-dg-item">
                  <small>AADHAAR NUMBER</small>
                  <strong>
                    {selectedOrderForCredit.aadharNumber
                      ? `XXXX XXXX ${selectedOrderForCredit.aadharNumber.slice(-4)}`
                      : 'Verified on Profile'}
                  </strong>
                  <span className="v-chip-green-xs">✓ UIDAI KYC Verified</span>
                </div>

                <div className="v-dbt-dg-item">
                  <small>DISBURSAL BANK</small>
                  <strong>{selectedOrderForCredit.bankName || 'State Bank of India'}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    A/C: {selectedOrderForCredit.bankAccountNumber ? `•••• ${selectedOrderForCredit.bankAccountNumber.slice(-4)}` : 'Verified Account'}
                  </span>
                </div>

                <div className="v-dbt-dg-item">
                  <small>IFSC CODE & HOLDER</small>
                  <strong>{selectedOrderForCredit.ifscCode || 'SBIN0001234'}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {selectedOrderForCredit.accountHolderName || selectedOrderForCredit.userName}
                  </span>
                </div>

                <div className="v-dbt-dg-item">
                  <small>CROP, QUALITY & VOLUME</small>
                  <strong>{selectedOrderForCredit.item} ({selectedOrderForCredit.verifiedWeight || selectedOrderForCredit.quantity} Qtl)</strong>
                  <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>
                    ⭐ {selectedOrderForCredit.officerQuality || selectedOrderForCredit.quality || 'Grade A (FAQ)'}
                  </span>
                </div>

                <div className="v-dbt-dg-item">
                  <small>PROCURING OFFICER</small>
                  <strong>{selectedOrderForCredit.procuredBy || 'Operator Sai Kumar'}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {selectedOrderForCredit.procuredCentre || 'APMC Yard'}
                  </span>
                </div>
              </div>

              {/* SUPERVISOR CONFIRMATION CHECK */}
              <label className="v-dbt-declaration-check">
                <input
                  type="checkbox"
                  checked={dbtConfirmationNote}
                  onChange={(e) => setDbtConfirmationNote(e.target.checked)}
                />
                <span>
                  I, <b>{userProfile.name}</b> (Procurement Supervisor), certify that the physical harvest has been accepted by the procurement officer and authorize direct credit of the amount from the agricultural treasury account to the farmer's verified bank account.
                </span>
              </label>
            </div>

            {/* MODAL ACTIONS */}
            <div className="v-modal-actions">
              <button
                type="button"
                className="v-btn-modal-cancel"
                disabled={isCrediting}
                onClick={() => setSelectedOrderForCredit(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="v-btn-modal-confirm dbt-btn"
                disabled={isCrediting || !dbtConfirmationNote}
                onClick={handleAuthorizeDbtCredit}
              >
                {isCrediting ? 'Authorizing PFMS Disbursal...' : 'Authorize & Credit Amount (DBT) ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: OFFICIAL DBT PAYMENT VOUCHER */}
      {selectedOrderForVoucher && (
        <div className="v-modal-overlay" onClick={() => setSelectedOrderForVoucher(null)}>
          <div className="v-modal-card v-voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="v-modal-header">
              <h4>🏛️ Direct Benefit Transfer (DBT) Payment Voucher</h4>
              <button
                type="button"
                className="v-close-modal"
                onClick={() => setSelectedOrderForVoucher(null)}
              >
                ✕
              </button>
            </div>

            <div className="v-voucher-paper" id="voucher-print-area">
              <div className="v-voucher-head">
                <div className="v-voucher-brand">
                  <span style={{ fontSize: '1.8rem' }}>🌱</span>
                  <div>
                    <h2>AgriProcure Smart Agriculture Platform</h2>
                    <small>GOVERNMENT AGRICULTURAL PROCUREMENT & TREASURY DISBURSAL SYSTEM</small>
                  </div>
                </div>
                <div className="v-voucher-stamp">
                  <span>PAID VIA DBT</span>
                  <small>PFMS VERIFIED</small>
                </div>
              </div>

              <div className="v-voucher-ref-bar">
                <div>
                  <small>TRANSACTION REFERENCE</small>
                  <strong>{selectedOrderForVoucher.transactionRef || 'DBT-2026-984210'}</strong>
                </div>
                <div>
                  <small>DISBURSAL TIMESTAMP</small>
                  <strong>
                    {selectedOrderForVoucher.creditedAt
                      ? new Date(selectedOrderForVoucher.creditedAt).toLocaleString()
                      : new Date().toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="v-voucher-grid">
                <div className="v-vg-item">
                  <small>BENEFICIARY FARMER</small>
                  <strong>{selectedOrderForVoucher.userName}</strong>
                  <span>Phone: +91 {selectedOrderForVoucher.userPhone}</span>
                </div>

                <div className="v-vg-item">
                  <small>AADHAAR IDENTIFIER</small>
                  <strong>
                    {selectedOrderForVoucher.aadharNumber
                      ? `XXXX XXXX ${selectedOrderForVoucher.aadharNumber.slice(-4)}`
                      : 'UIDAI Verified'}
                  </strong>
                </div>

                <div className="v-vg-item">
                  <small>CREDITED BANK ACCOUNT</small>
                  <strong>{selectedOrderForVoucher.bankName || 'State Bank of India'}</strong>
                  <span>A/C: •••• {selectedOrderForVoucher.bankAccountNumber?.slice(-4) || '9876'}</span>
                  <span>IFSC: {selectedOrderForVoucher.ifscCode || 'SBIN0001234'}</span>
                </div>

                <div className="v-vg-item">
                  <small>PROCUREMENT BATCH & QUALITY</small>
                  <strong>{selectedOrderForVoucher.item}</strong>
                  <span>Quality: <b>{selectedOrderForVoucher.officerQuality || selectedOrderForVoucher.quality || 'Grade A (FAQ)'}</b></span>
                  <span>Quantity: {selectedOrderForVoucher.verifiedWeight || selectedOrderForVoucher.quantity} Qtl • Token: {selectedOrderForVoucher.token}</span>
                </div>
              </div>

              <div className="v-voucher-amount-box">
                <div className="v-vab-label">TOTAL AMOUNT CREDITED VIA DBT:</div>
                <div className="v-vab-amount">
                  ₹{parseFloat(selectedOrderForVoucher.payoutAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="v-voucher-signatures">
                <div>
                  <small>PROCURING OFFICER</small>
                  <strong>{selectedOrderForVoucher.procuredBy || 'Operator Sai Kumar'}</strong>
                  <span>Weighbridge Verified</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small>SUPERVISOR AUTHORIZATION</small>
                  <strong>{selectedOrderForVoucher.creditedBy?.name || userProfile.name}</strong>
                  <span>Digital Treasury Signature ✓</span>
                </div>
              </div>
            </div>

            <div className="v-modal-actions">
              <button
                type="button"
                className="v-btn-modal-cancel"
                onClick={() => setSelectedOrderForVoucher(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="v-btn-modal-confirm"
                onClick={() => window.print()}
              >
                🖨️ Print Payment Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: OFFICIAL MANDI GOODS LORRY DISPATCH CHALLAN */}
      {selectedReportForChallan && (
        <div
          className="v-modal-overlay"
          onClick={() => setSelectedReportForChallan(null)}
        >
          <div
            className="v-modal-card v-voucher-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="v-modal-header">
              <div className="v-dbt-modal-title">
                <span className="v-modal-badge-ico">📜</span>
                <div>
                  <h4>Government Mandi Goods Dispatch Note</h4>
                  <small>Inter-Warehouse Grain Transit Challan & Gate Pass</small>
                </div>
              </div>
              <button
                type="button"
                className="v-close-modal"
                onClick={() => setSelectedReportForChallan(null)}
              >
                ✕
              </button>
            </div>

            <div className="v-voucher-paper">
              <div className="v-voucher-emblem">
                <div className="v-ve-seal">🌾</div>
                <div>
                  <h3>TAMIL NADU AGRICULTURAL PRODUCE MARKETING COMMITTEE</h3>
                  <small>DEPARTMENT OF AGRICULTURAL MARKETING & AGRI BUSINESS • AGRIPROCURE</small>
                </div>
              </div>

              <div className="v-voucher-head-info">
                <div>
                  <small>DISPATCH CHALLAN REF</small>
                  <strong>{selectedReportForChallan.challanRef || 'DSP-2026-CHALLAN'}</strong>
                </div>
                <div>
                  <small>DISPATCH DATE & TIME</small>
                  <strong>
                    {selectedReportForChallan.date} •{' '}
                    {selectedReportForChallan.createdAt
                      ? new Date(selectedReportForChallan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Closing Hours'}
                  </strong>
                </div>
              </div>

              <div className="v-voucher-grid">
                <div className="v-vg-item">
                  <small>ORIGIN MANDI CENTRE</small>
                  <strong>{selectedReportForChallan.centre || 'APMC Procurement Yard'}</strong>
                  <span>Zone: {selectedReportForChallan.zone || 'Central Mandi District'}</span>
                  <span>Officer: {selectedReportForChallan.officerName || 'Duty Officer'}</span>
                </div>

                <div className="v-vg-item">
                  <small>DESTINATION BUFFER GODOWN</small>
                  <strong>{selectedReportForChallan.destinationGodown || 'CWC / SWC Buffer Warehouse'}</strong>
                  <span>Consignment Category: Buffer Grain Storage</span>
                </div>

                <div className="v-vg-item">
                  <small>TRANSPORT VEHICLE (LORRY)</small>
                  <strong style={{ color: '#0369a1', fontSize: '1.05rem', letterSpacing: '0.04em' }}>
                    🚚 {selectedReportForChallan.lorryNumber || 'TN-REGISTERED'}
                  </strong>
                  <span>Driver: <b>{selectedReportForChallan.driverName || 'Designated Driver'}</b></span>
                  <span>Phone: +91 {selectedReportForChallan.driverPhone}</span>
                </div>

                <div className="v-vg-item">
                  <small>GUNNY BAGS DISPATCHED & REMAINING</small>
                  <strong>{selectedReportForChallan.gunnyBagsUsed} Gunny Bags Loaded</strong>
                  <span>Capacity: ~50 Kg Standard Jute / HDPE</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Mandi Buffer Balance: {selectedReportForChallan.gunnyBagsLeft} Bags
                  </span>
                </div>
              </div>

              <div className="v-voucher-amount-box" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                <div className="v-vab-label" style={{ color: '#475569' }}>
                  TOTAL QUANTITY TRANSPORTED VIA LORRY:
                </div>
                <div className="v-vab-amount" style={{ color: '#0f172a' }}>
                  {selectedReportForChallan.quintalsTransported} Quintals
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: '10px' }}>
                    (Procured Today: {selectedReportForChallan.quintalsProcured} Qtl)
                  </span>
                </div>
              </div>

              {selectedReportForChallan.remarks && (
                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', color: '#334155', border: '1px dashed #cbd5e1', margin: '14px 0' }}>
                  <strong>Operational Remarks:</strong> {selectedReportForChallan.remarks}
                </div>
              )}

              <div className="v-voucher-signatures">
                <div>
                  <small>DISPATCHING MANDI OFFICER</small>
                  <strong>{selectedReportForChallan.officerName || 'Operator Sai Kumar'}</strong>
                  <span>Weighbridge Verified & Bagged</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small>SUPERVISOR ACKNOWLEDGEMENT</small>
                  <strong>
                    {selectedReportForChallan.acknowledgedBy?.name || (selectedReportForChallan.status === 'Acknowledged by Supervisor' ? userProfile.name : 'Pending Acknowledgement')}
                  </strong>
                  <span style={{ color: selectedReportForChallan.status === 'Acknowledged by Supervisor' ? '#15803d' : '#d97706' }}>
                    {selectedReportForChallan.status === 'Acknowledged by Supervisor'
                      ? 'Digitally Verified & Acknowledged ✓'
                      : 'Pending Supervisor Sign-Off'}
                  </span>
                </div>
              </div>
            </div>

            <div className="v-modal-actions">
              <button
                type="button"
                className="v-btn-modal-cancel"
                onClick={() => setSelectedReportForChallan(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="v-btn-modal-confirm"
                onClick={() => window.print()}
              >
                🖨️ Print Dispatch Challan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LOGOUT CONFIRMATION */}
      {showLogoutModal && (
        <div className="v-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="v-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚪</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', color: '#0f172a' }}>Confirm Sign Out</h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.9rem' }}>
              Are you sure you want to log out from the Supervisor Command Portal?
            </p>
            <div className="v-modal-actions" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="v-btn-modal-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="v-btn-modal-confirm"
                style={{ background: '#dc2626' }}
                onClick={handleLogout}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;
