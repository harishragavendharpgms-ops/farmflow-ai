import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import './OfficerDashboard.css';

const OfficerDashboard = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: 'Operator Sai Kumar',
    email: 'saikumar46470@gmail.com',
    role: 'officer',
    zone: 'Zone A',
    subPlace: 'APMC Centre #402'
  });

  const [modalImage, setModalImage] = useState(null);
  const [slotInputs, setSlotInputs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingSlot, setIsSavingSlot] = useState(null);
  const [isProcuring, setIsProcuring] = useState(null);

  // Active filter tab: 'all', 'arrived', 'waiting', 'called', 'processing', 'completed', 'skipped', 'noshow'
  const [activeQueueTab, setActiveQueueTab] = useState('all');
  const [selectedCropFilter, setSelectedCropFilter] = useState('all');

  // Currently serving and next in queue
  const [nowServing, setNowServing] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Scan QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [scannedToken, setScannedToken] = useState('');

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
          name: parsed.name || 'Operator Sai Kumar',
          subPlace: parsed.subPlace || 'APMC Centre #402'
        }));
      } catch (error) {
        console.error('Invalid saved user:', error);
      }
    }
  }, []);

  // Fetch Firestore Orders
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
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        setOrders(allOrders);
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      },
      (error) => {
        console.error('Failed to load officer orders:', error);
      }
    );

    return () => unsub();
  }, []);

  const handleInputChange = (orderId, field, value) => {
    setSlotInputs((prev) => ({
      ...prev,
      [orderId]: {
        date: field === 'date' ? value : prev[orderId]?.date || '',
        time: field === 'time' ? value : prev[orderId]?.time || ''
      }
    }));
  };

  // TextBee SMS Dispatch (Preserved Exactly)
  const triggerSms = async (phoneNumber, message) => {
    if (!phoneNumber || phoneNumber === 'N/A') return;

    let cleanPhone = phoneNumber.toString().replace(/[^\d+]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    const TEXTBEE_DEVICE_ID = "6a9d1e51ccb6c727098825fb";
    const TEXTBEE_API_KEY = "txb_TxrBzRwSdleKWzGtwMlg3bavFWnhAL7v";

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

  // Assign Time Slot
  const handleSaveTimeSlot = async (id) => {
    const input = slotInputs[id];
    if (!input || !input.date || !input.time) {
      alert('Please select a date and enter the time manually.');
      return;
    }

    const combinedSlot = `${input.date} at ${input.time}`;
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    setIsSavingSlot(id);
    try {
      await updateDoc(doc(db, 'orders', id), {
        datetime: combinedSlot,
        status: 'Slot Allocated',
        rescheduleRequested: false
      });

      await triggerSms(
        order.userPhone,
        `AgriProcure: Your slot is confirmed on ${combinedSlot} at ${order.zone || 'APMC Centre #402'}.`
      );

      alert(`Time slot successfully assigned: ${combinedSlot}`);
    } catch (error) {
      console.error(error);
      alert('Failed to assign time slot.');
    } finally {
      setIsSavingSlot(null);
    }
  };

  // Approve Farmer's Slot Reschedule Request
  const handleApproveReschedule = async (order) => {
    const newSlot = `${order.preferredRescheduleDate || 'Upcoming'} at ${order.preferredRescheduleTime || '09:00 AM'}`;
    setIsSavingSlot(order.id);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        datetime: newSlot,
        status: 'Slot Allocated',
        rescheduleRequested: false
      });

      await triggerSms(
        order.userPhone,
        `AgriProcure: Your reschedule request has been APPROVED! New confirmed slot: ${newSlot} at ${order.zone || 'APMC Centre'}.`
      );

      alert(`Reschedule approved for Token ${order.token || order.id.slice(0, 8)}: ${newSlot}`);
    } catch (err) {
      console.error('Error approving reschedule:', err);
      alert('Failed to approve reschedule: ' + err.message);
    } finally {
      setIsSavingSlot(null);
    }
  };


  // Audio Chime helper for Mandi Counter Call (Video 02:18)
  const playCallChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      }
    } catch (e) {
      // audio context fallback
    }
  };

  // Call Next Farmer Action (Video 02:18)
  const handleCallNext = async () => {
    const waitingList = orders.filter(
      (o) => o.status === 'Arrived' || o.status === 'BOOKED' || o.status === 'VAO Verified' || o.status === 'Slot Allocated'
    );

    if (waitingList.length === 0) {
      alert('No farmers currently waiting in the queue to call.');
      return;
    }

    playCallChime();
    const nextFarmer = waitingList[0];
    setNowServing(nextFarmer);

    try {
      await updateDoc(doc(db, 'orders', nextFarmer.id), {
        status: 'Processing',
        calledAt: new Date().toISOString()
      });

      await triggerSms(
        nextFarmer.userPhone,
        `AgriProcure: Token ${nextFarmer.token} is now called to Counter #1 at APMC Centre #402. Please proceed for weighing.`
      );

      alert(`Calling Next Farmer: ${nextFarmer.userName || 'Farmer'} (Token: ${nextFarmer.token})`);
    } catch (err) {
      console.error(err);
    }
  };

  // Procure & DBT Disbursal (Preserved Exactly)
  const handleProcure = async (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const estimatedRate = 23.00;
    const totalPayout = ((parseFloat(order.quantity) || 0) * estimatedRate).toFixed(2);

    setIsProcuring(id);
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: 'Completed',
        paymentStatus: 'Paid via DBT',
        payoutAmount: totalPayout,
        procuredAt: new Date().toISOString()
      });

      await triggerSms(
        order.userPhone,
        `AgriProcure: Procurement complete! Total payout of INR ${totalPayout} has been transferred via DBT to your verified bank account.`
      );

      if (nowServing && nowServing.id === id) {
        setNowServing(null);
      }

      alert('Crop successfully marked as Procured & Disbursed via DBT!');
    } catch (error) {
      console.error(error);
      alert('Failed to update procurement status.');
    } finally {
      setIsProcuring(null);
    }
  };

  // QR Scan Handler
  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scannedToken.trim()) return;
    const match = orders.find(
      (o) => o.token?.toLowerCase() === scannedToken.trim().toLowerCase()
    );
    if (match) {
      alert(`Token Found: ${match.token} for ${match.userName}. Status: ${match.status}`);
      setNowServing(match);
    } else {
      alert(`Token ${scannedToken} not found in current mandi records.`);
    }
    setShowQrModal(false);
    setScannedToken('');
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of the Agricultural Officer Dashboard?")) {
      localStorage.removeItem('farmflow_user');
      sessionStorage.removeItem('farmflow_user');
      navigate('/login');
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !search ||
        (order.token && order.token.toLowerCase().includes(search)) ||
        (order.userName && order.userName.toLowerCase().includes(search)) ||
        (order.userPhone && order.userPhone.includes(search)) ||
        (order.item && order.item.toLowerCase().includes(search));

      // Tab filter
      let matchTab = true;
      if (activeQueueTab === 'arrived') matchTab = order.status === 'Arrived';
      else if (activeQueueTab === 'reschedule') matchTab = order.rescheduleRequested === true || order.status === 'Reschedule Requested';
      else if (activeQueueTab === 'waiting') matchTab = order.status === 'BOOKED' || order.status === 'Slot Allocated';
      else if (activeQueueTab === 'called') matchTab = order.status === 'Processing';
      else if (activeQueueTab === 'completed') matchTab = order.status === 'Completed' || order.status === 'Procured';
      else if (activeQueueTab === 'skipped') matchTab = order.status === 'Skipped';
      else if (activeQueueTab === 'noshow') matchTab = order.status === 'CANCELLED';

      // Crop filter
      let matchCrop = true;
      if (selectedCropFilter !== 'all') {
        matchCrop = order.item?.toLowerCase() === selectedCropFilter.toLowerCase();
      }

      return matchSearch && matchTab && matchCrop;
    });
  }, [orders, searchTerm, activeQueueTab, selectedCropFilter]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalBookings = orders.length;
    const arrived = orders.filter((o) => o.status === 'Arrived').length;
    const waiting = orders.filter((o) => o.status === 'BOOKED' || o.status === 'Slot Allocated').length;
    const processing = orders.filter((o) => o.status === 'Processing').length;
    const completed = orders.filter((o) => o.status === 'Completed' || o.status === 'Procured').length;
    const noShow = orders.filter((o) => o.status === 'CANCELLED').length;
    const rescheduleRequests = orders.filter((o) => o.rescheduleRequested === true || o.status === 'Reschedule Requested').length;
    const totalQty = orders.reduce((acc, o) => acc + (parseFloat(o.quantity) || 0), 0);

    return {
      totalBookings,
      arrived,
      waiting,
      processing,
      completed,
      noShow,
      rescheduleRequests,
      totalQty: `${totalQty} Qtl`,
      avgWait: '0 min'
    };
  }, [orders]);

  return (
    <div className="v-op-shell">
      {/* SIDEBAR (Operations, Management, Insights) */}
      <aside className="v-op-sidebar">
        <div className="v-op-brand">
          <span className="brand-logo-leaf">🌱</span>
          <div>
            <strong>Agri<span>Procure</span></strong>
            <small>PROCUREMENT OFFICER</small>
          </div>
        </div>

        <div className="v-op-centre-tag">
          <strong>{userProfile.subPlace || 'Procurement Centre'}</strong>
          <small>Zone: {userProfile.zone || 'General'}</small>
        </div>

        <nav className="v-op-nav">
          <div className="nav-group-title">OPERATIONS</div>
          <button type="button" className="op-nav-btn active">
            <span>📊</span> Dashboard
          </button>
          <button type="button" className="op-nav-btn" onClick={() => setActiveQueueTab('waiting')}>
            <span>📡</span> Live Queue
          </button>
          <button type="button" className="op-nav-btn" onClick={() => setShowQrModal(true)}>
            <span>🎟️</span> Gate Entry
          </button>
          <button type="button" className="op-nav-btn" onClick={() => setActiveQueueTab('completed')}>
            <span>🛒</span> Procurement
          </button>

          <div className="nav-group-title">MANAGEMENT</div>
          <button type="button" className="op-nav-btn" onClick={() => setActiveQueueTab('all')}>
            <span>👥</span> Farmers
          </button>
          <button type="button" className="op-nav-btn">
            <span>💳</span> Payments
          </button>
          <button type="button" className="op-nav-btn" onClick={() => setActiveQueueTab('completed')}>
            <span>📜</span> Procurement History
          </button>

          <div className="nav-group-title">INSIGHTS</div>
          <button type="button" className="op-nav-btn">
            <span>📈</span> Analytics
          </button>
          <button type="button" className="op-nav-btn">
            <span>📑</span> Reports
          </button>
          <button type="button" className="op-nav-btn">
            <span>⚙️</span> Settings
          </button>
        </nav>

        <div className="v-op-sidebar-foot">
          <div className="v-op-sys-status">
            <span className="pulse-dot" />
            <div>
              <strong>System: Operational</strong>
              <small>Last sync: {lastSyncTime}</small>
            </div>
          </div>
          <button type="button" className="v-op-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="v-op-main">
        {/* TOP BAR */}
        <header className="v-op-topbar">
          <div className="v-topbar-centre">
            <span>AgriProcure • {userProfile.subPlace || 'Procurement Centre'}</span>
            <span className="v-live-tag"><span className="pulse-dot" /> Live</span>
          </div>

          <div className="v-topbar-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search token, farmer, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="v-topbar-actions">
            <button
              type="button"
              className="v-topbar-btn-scan"
              onClick={() => setShowQrModal(true)}
            >
              📷 Scan QR
            </button>
            <button
              type="button"
              className="v-topbar-btn-call"
              onClick={handleCallNext}
            >
              📢 CALL NEXT
            </button>
            <button
              type="button"
              className="v-topbar-btn-gate"
              onClick={() => setShowQrModal(true)}
            >
              Scan Gate QR
            </button>

            <div className="v-op-user-badge">
              <div className="v-op-avatar">O</div>
            </div>

            <button
              type="button"
              className="v-op-header-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <span>🚪</span>
              <span className="v-op-header-logout-text">Logout</span>
            </button>
          </div>
        </header>

        {/* CONTENT VIEW */}
        <div className="v-op-content">
          {/* Greeting Banner */}
          <div className="v-op-greeting-card">
            <div>
              <h1>Good Evening, {userProfile.name || 'Officer'} 🌾</h1>
              <p>Here's today's procurement activity and verified farmer queue</p>
              <div className="v-op-date-row">
                <span>TODAY'S DATE • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="pill-badge pill-badge-green">MANDI OPEN</span>
              </div>
            </div>
          </div>

          {/* 8 KPI Metrics Cards Grid (Video 02:18) */}
          <div className="v-op-kpi-grid">
            <div className="v-op-kpi-card">
              <small>TODAY'S BOOKINGS</small>
              <h2 className="text-green">{metrics.totalBookings}</h2>
              <span>Registered slots for today</span>
            </div>
            <div className="v-op-kpi-card">
              <small>FARMERS ARRIVED</small>
              <h2 className="text-blue">{metrics.arrived}</h2>
              <span>0% of bookings</span>
            </div>
            <div className="v-op-kpi-card">
              <small>CURRENTLY WAITING</small>
              <h2 className="text-orange">{metrics.waiting}</h2>
              <span>Avg wait: 0 min</span>
            </div>
            <div className="v-op-kpi-card">
              <small>PROCESSING</small>
              <h2 className="text-purple">{metrics.processing}</h2>
              <span>Active procurement bays</span>
            </div>
            <div className="v-op-kpi-card">
              <small>COMPLETED TODAY</small>
              <h2>{metrics.completed} Qtl</h2>
              <span>0% completed</span>
            </div>
            <div className="v-op-kpi-card">
              <small>TOTAL QUANTITY</small>
              <h2>{metrics.totalQty}</h2>
              <span>Target: -- Qtl</span>
            </div>
            <div className="v-op-kpi-card">
              <small>AVG WAITING TIME</small>
              <h2>0 min</h2>
              <span>Target: &lt; 20 min</span>
            </div>
            <div className="v-op-kpi-card">
              <small>NO-SHOW</small>
              <h2 className="text-red">{metrics.noShow}</h2>
              <span>Missed slot schedule</span>
            </div>
          </div>

          {/* NOW SERVING & NEXT IN QUEUE CARDS */}
          <div className="v-op-serving-dual">
            <div className="v-op-serving-card">
              <div className="serving-head">
                <span className="pulse-dot" />
                <strong>NOW SERVING</strong>
              </div>
              {nowServing ? (
                <div className="serving-active">
                  <h3>{nowServing.token}</h3>
                  <p>{nowServing.userName} • {nowServing.item} ({nowServing.quantity} Qtl)</p>
                  <button
                    type="button"
                    className="v-btn-complete-bay"
                    onClick={() => handleProcure(nowServing.id)}
                  >
                    Complete Procurement & Disburse DBT ✓
                  </button>
                </div>
              ) : (
                <div className="serving-empty">
                  <p>No farmer currently being processed.</p>
                  <small>Click <b>CALL NEXT FARMER</b> to begin</small>
                </div>
              )}
            </div>

            <div className="v-op-serving-card">
              <div className="serving-head">
                <span>⏱️</span>
                <strong>NEXT IN QUEUE</strong>
                <button
                  type="button"
                  className="v-full-queue-link"
                  onClick={() => setActiveQueueTab('waiting')}
                >
                  Full Queue →
                </button>
              </div>
              <div className="serving-empty">
                <p>No farmers waiting in queue.</p>
                <small>Farmers who check in at the gate will appear here</small>
              </div>
            </div>
          </div>

          {/* LIVE QUEUE MANAGEMENT TABLE SECTION (Video 02:21) */}
          <div className="v-op-queue-section">
            <div className="v-op-qs-header">
              <div>
                <h3>Live Queue Management</h3>
                <span className="v-autorefresh-tag">● Auto-refresh: ON</span>
              </div>
              <div className="v-qs-actions">
                <button
                  type="button"
                  className="v-topbar-btn-call"
                  onClick={handleCallNext}
                >
                  📢 CALL NEXT
                </button>
              </div>
            </div>

            {/* TOP RESCHEDULE ALERT BANNER */}
            {metrics.rescheduleRequests > 0 && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 1px 4px rgba(217, 119, 6, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🔄</span>
                  <div>
                    <strong style={{ color: '#92400e', fontSize: '0.92rem' }}>
                      {metrics.rescheduleRequests} Slot Reschedule {metrics.rescheduleRequests === 1 ? 'Request' : 'Requests'} Pending!
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#b45309' }}>
                      Farmers have submitted preferred new dates and reasons for their mandi slot.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQueueTab('reschedule')}
                  style={{
                    background: '#d97706',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Requests ({metrics.rescheduleRequests})
                </button>
              </div>
            )}

            {/* Filter Pill Tabs */}
            <div className="v-op-filter-tabs">
              <div className="v-filter-pills">
                {[
                  { id: 'all', label: 'All Tokens', count: orders.length },
                  { id: 'reschedule', label: '🔄 Reschedule Requests', count: metrics.rescheduleRequests },
                  { id: 'arrived', label: 'Arrived', count: metrics.arrived },
                  { id: 'waiting', label: 'Waiting', count: metrics.waiting },
                  { id: 'called', label: 'Called', count: metrics.processing },
                  { id: 'processing', label: 'Processing', count: metrics.processing },
                  { id: 'completed', label: 'Completed', count: metrics.completed },
                  { id: 'skipped', label: 'Skipped', count: 0 },
                  { id: 'noshow', label: 'No Show', count: metrics.noShow }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`v-fp-btn ${activeQueueTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveQueueTab(tab.id)}
                  >
                    {tab.label} <span className="tab-count">{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Crop Filter Dropdown */}
              <div className="v-crop-dropdown">
                <select
                  value={selectedCropFilter}
                  onChange={(e) => setSelectedCropFilter(e.target.value)}
                >
                  <option value="all">All Crops</option>
                  <option value="paddy">Paddy</option>
                  <option value="cotton">Cotton</option>
                  <option value="maize">Maize</option>
                  <option value="wheat">Wheat</option>
                </select>
              </div>
            </div>

            {/* Queue Table */}
            <div className="v-table-responsive">
              <table className="v-clean-table v-op-table">
                <thead>
                  <tr>
                    <th>TOKEN</th>
                    <th>FARMER</th>
                    <th>CROP</th>
                    <th>QTY</th>
                    <th>SLOT</th>
                    <th>STATUS</th>
                    <th>PROCUREMENT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px' }}>
                        <div className="v-no-tokens-box">
                          <p>No tokens match the selected filters.</p>
                          <small>Try changing your filters or search query</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <b>{order.token || `PDC-${order.id.slice(-6).toUpperCase()}`}</b>
                        </td>
                        <td>
                          <strong>{order.userName || 'Farmer'}</strong>
                          <small style={{ display: 'block', color: '#64748b' }}>{order.userPhone}</small>
                        </td>
                        <td>{order.item || 'Paddy (Grade A)'}</td>
                        <td>{order.quantity} Qtl</td>
                        <td>
                          {order.rescheduleRequested || order.status === 'Reschedule Requested' ? (
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 10px', maxWidth: '280px' }}>
                              <span className="pill-badge pill-badge-yellow" style={{ fontSize: '0.68rem', marginBottom: '4px', display: 'inline-block' }}>
                                🔄 Reschedule Requested
                              </span>
                              <div style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 700 }}>
                                📅 {order.preferredRescheduleDate || 'Date'} ({order.preferredRescheduleTime || 'Time'})
                              </div>
                              {order.rescheduleReason && (
                                <div style={{ fontSize: '0.74rem', color: '#78350f', marginTop: '3px', fontStyle: 'italic', lineHeight: 1.3 }}>
                                  💬 "{order.rescheduleReason}"
                                </div>
                              )}
                              <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleApproveReschedule(order)}
                                  disabled={isSavingSlot === order.id}
                                  style={{
                                    background: '#16a34a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isSavingSlot === order.id ? 'Approving...' : '✓ Approve Slot'}
                                </button>
                              </div>
                              <details style={{ marginTop: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                                <summary style={{ cursor: 'pointer' }}>Or set custom slot</summary>
                                <div className="slot-picker-inline" style={{ marginTop: '4px' }}>
                                  <input
                                    type="date"
                                    onChange={(e) => handleInputChange(order.id, 'date', e.target.value)}
                                  />
                                  <input
                                    type="text"
                                    placeholder="09:00 AM"
                                    style={{ width: '80px' }}
                                    onChange={(e) => handleInputChange(order.id, 'time', e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="v-btn-save-slot"
                                    onClick={() => handleSaveTimeSlot(order.id)}
                                    disabled={isSavingSlot === order.id}
                                  >
                                    Save
                                  </button>
                                </div>
                              </details>
                            </div>
                          ) : order.datetime && order.datetime !== 'TBD by Officer' ? (
                            <span>{order.datetime}</span>
                          ) : (
                            <div className="slot-picker-inline">
                              <input
                                type="date"
                                onChange={(e) => handleInputChange(order.id, 'date', e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="09:00 AM"
                                style={{ width: '85px' }}
                                onChange={(e) => handleInputChange(order.id, 'time', e.target.value)}
                              />
                              <button
                                type="button"
                                className="v-btn-save-slot"
                                onClick={() => handleSaveTimeSlot(order.id)}
                                disabled={isSavingSlot === order.id}
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`pill-badge ${
                              order.status === 'Completed' || order.status === 'Procured'
                                ? 'pill-badge-green'
                                : order.status === 'Processing'
                                ? 'pill-badge-blue'
                                : 'pill-badge-yellow'
                            }`}
                          >
                            {order.status || 'Waiting'}
                          </span>
                        </td>
                        <td>
                          {order.paymentStatus ? (
                            <span className="pill-badge pill-badge-green">Paid via DBT</span>
                          ) : (
                            <button
                              type="button"
                              className="v-btn-procure-action"
                              onClick={() => handleProcure(order.id)}
                              disabled={isProcuring === order.id}
                            >
                              Procure
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="v-table-action-btns">
                            {order.documentUrl && (
                              <button
                                type="button"
                                className="v-btn-view-doc"
                                onClick={() => setModalImage(order.documentUrl)}
                              >
                                View Doc
                              </button>
                            )}
                            <button
                              type="button"
                              className="v-btn-call-farmer"
                              onClick={() => {
                                setNowServing(order);
                                triggerSms(order.userPhone, `AgriProcure: Token ${order.token} please proceed to Counter #1.`);
                                alert(`Called farmer: ${order.userName}`);
                              }}
                            >
                              Call
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Scanner Modal */}
      {showQrModal && (
        <div className="v-modal-overlay">
          <div className="v-modal-card">
            <div className="v-modal-header">
              <h4>Scan Token / Gate Pass QR</h4>
              <button
                type="button"
                className="v-close-modal"
                onClick={() => setShowQrModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleScanSubmit}>
              <div className="v-qr-scanner-mock">
                <div className="v-qr-laser-line" />
                <p>Align token QR code or enter token number below</p>
              </div>
              <div className="v-form-field">
                <label>Token Code</label>
                <input
                  type="text"
                  placeholder="e.g. PDC-774321"
                  value={scannedToken}
                  onChange={(e) => setScannedToken(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="v-modal-actions">
                <button
                  type="button"
                  className="v-btn-modal-cancel"
                  onClick={() => setShowQrModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="v-btn-modal-confirm">
                  Verify & Admit to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patta/Chitta Document Preview Modal */}
      {modalImage && (
        <div className="v-modal-overlay" onClick={() => setModalImage(null)}>
          <div className="v-doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="v-modal-header">
              <h4>Patta / Chitta Document Preview</h4>
              <button
                type="button"
                className="v-close-modal"
                onClick={() => setModalImage(null)}
              >
                ✕
              </button>
            </div>
            <div className="v-doc-preview-body">
              <img src={modalImage} alt="Land Record" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;