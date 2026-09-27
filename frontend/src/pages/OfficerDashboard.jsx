import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc
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

  // Procure & Quality Inspection Modal
  const [procureModalOrder, setProcureModalOrder] = useState(null);
  const [assessedQuality, setAssessedQuality] = useState('Grade A (FAQ - Fair Average Quality)');
  const [assessedWeight, setAssessedWeight] = useState('');
  const [assessedMoisture, setAssessedMoisture] = useState('12% (Standard / Optimum)');
  const [qualityRemarks, setQualityRemarks] = useState('');

  // Day-End Report & Lorry Dispatch State
  const [showDayEndModal, setShowDayEndModal] = useState(false);
  const [isSubmittingDayEnd, setIsSubmittingDayEnd] = useState(false);
  const [dailyReports, setDailyReports] = useState([]);
  const [showReportHistoryModal, setShowReportHistoryModal] = useState(false);
  const [dayEndForm, setDayEndForm] = useState({
    date: new Date().toISOString().split('T')[0],
    quintalsProcured: '',
    gunnyBagsUsed: '',
    gunnyBagsLeft: '',
    quintalsTransported: '',
    lorryNumber: '',
    driverName: '',
    driverPhone: '',
    destinationGodown: 'Central Warehousing Corporation (CWC) Buffer Godown #3, Trichy',
    remarks: 'Grade A paddy loaded and secured with moisture-proof tarpaulin and mandi security seal.'
  });

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

  // Fetch Day-End Reports submitted by Officers
  useEffect(() => {
    const qReports = collection(db, 'dailyReports');
    const unsubReports = onSnapshot(
      qReports,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));
        list.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
        setDailyReports(list);
      },
      (err) => console.warn('Error loading daily reports:', err)
    );

    return () => unsubReports();
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

  // Open Quality Assessment & Procurement Modal
  const handleOpenProcureModal = (order) => {
    setProcureModalOrder(order);
    setAssessedQuality(order.quality || 'Grade A (FAQ - Fair Average Quality)');
    setAssessedWeight(order.quantity || '');
    setAssessedMoisture('12% (Standard / Optimum)');
    setQualityRemarks('');
  };

  // Confirm Quality Assessment & Forward to Supervisor for DBT
  const handleConfirmProcure = async (e) => {
    e.preventDefault();
    if (!procureModalOrder) return;

    const order = procureModalOrder;
    const qty = parseFloat(assessedWeight) || parseFloat(order.quantity) || 0;

    // Standard Mandi MSP / Quality Rate tiered calculation
    let ratePerKg = 23.00;
    if (assessedQuality.includes('Grade B')) {
      ratePerKg = 21.50;
    } else if (assessedQuality.includes('Grade C')) {
      ratePerKg = 19.00;
    }

    const totalPayout = (qty * ratePerKg).toFixed(2);
    setIsProcuring(order.id);

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'Procured',
        paymentStatus: 'Pending Supervisor Credit',
        officerQuality: assessedQuality,
        verifiedWeight: qty,
        moistureContent: assessedMoisture,
        qualityRemarks: qualityRemarks.trim() || 'Passed physical inspection & quality standards at weighbridge.',
        payoutAmount: totalPayout,
        ratePerKg: ratePerKg,
        procuredAt: new Date().toISOString(),
        procuredBy: userProfile.name || 'Operator Sai Kumar',
        procuredOfficerPhone: userProfile.phone || '',
        procuredZone: userProfile.zone || order.zone || 'Zone A',
        procuredCentre: userProfile.subPlace || order.subPlace || 'APMC Centre #402'
      });

      await triggerSms(
        order.userPhone,
        `AgriProcure: Produce verified at ${userProfile.subPlace || 'Mandi'}. Assessed Quality: ${assessedQuality}. Quantity: ${qty} Qtl. Total payout INR ${totalPayout} forwarded to Supervisor for DBT bank credit.`
      );

      if (nowServing && nowServing.id === order.id) {
        setNowServing(null);
      }

      alert(`Produce successfully inspected as ${assessedQuality}!\nPayout of ₹${totalPayout} sent to Supervisor for DBT credit.`);
      setProcureModalOrder(null);
    } catch (error) {
      console.error(error);
      alert('Failed to update procurement status.');
    } finally {
      setIsProcuring(null);
    }
  };

  // Open Day-End Report Modal (Auto calculates today's totals)
  const handleOpenDayEndModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Orders procured today by this centre
    const todayProcured = orders.filter((o) => {
      const isDone = o.status === 'Procured' || o.status === 'Completed';
      if (!isDone) return false;
      return o.procuredAt ? o.procuredAt.startsWith(todayStr) : true;
    });

    const totalQtl = todayProcured.reduce((sum, o) => {
      return sum + (parseFloat(o.verifiedWeight || o.quantity) || 0);
    }, 0);

    const estBags = Math.round(totalQtl * 2);

    setDayEndForm({
      date: todayStr,
      quintalsProcured: totalQtl > 0 ? totalQtl.toFixed(2) : (orders.length > 0 ? '45.00' : '0.00'),
      gunnyBagsUsed: estBags > 0 ? String(estBags) : '90',
      gunnyBagsLeft: '410',
      quintalsTransported: totalQtl > 0 ? totalQtl.toFixed(2) : '45.00',
      lorryNumber: '',
      driverName: '',
      driverPhone: '',
      destinationGodown: 'Central Warehousing Corporation (CWC) Buffer Godown #3, Trichy',
      remarks: 'Moisture tested and passed FAQ norms. Bags weighed, tagged, and sealed onto lorry.'
    });
    setShowDayEndModal(true);
  };

  // Submit Day-End Report to Supervisor
  const handleSubmitDayEndReport = async (e) => {
    e.preventDefault();
    if (!dayEndForm.lorryNumber.trim()) {
      alert('Please enter the transport Lorry / Vehicle Registration Number.');
      return;
    }
    if (!dayEndForm.driverPhone.trim()) {
      alert('Please enter the Lorry Driver contact phone number.');
      return;
    }

    setIsSubmittingDayEnd(true);
    try {
      const challanRef = `DSP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      await addDoc(collection(db, 'dailyReports'), {
        challanRef,
        date: dayEndForm.date,
        officerName: userProfile.name || 'Officer',
        officerEmail: userProfile.email || '',
        officerPhone: userProfile.phone || '',
        zone: userProfile.zone || 'Zone A',
        centre: userProfile.subPlace || 'APMC Centre #402',
        quintalsProcured: parseFloat(dayEndForm.quintalsProcured) || 0,
        gunnyBagsUsed: parseInt(dayEndForm.gunnyBagsUsed) || 0,
        gunnyBagsLeft: parseInt(dayEndForm.gunnyBagsLeft) || 0,
        quintalsTransported: parseFloat(dayEndForm.quintalsTransported) || 0,
        lorryNumber: dayEndForm.lorryNumber.trim().toUpperCase(),
        driverName: dayEndForm.driverName.trim(),
        driverPhone: dayEndForm.driverPhone.trim(),
        destinationGodown: dayEndForm.destinationGodown.trim(),
        remarks: dayEndForm.remarks.trim(),
        status: 'Submitted to Supervisor',
        createdAt: new Date().toISOString()
      });

      alert(`✅ Day-End Report & Lorry Dispatch (${dayEndForm.lorryNumber.toUpperCase()}) successfully submitted to the Supervisor!\nChallan: ${challanRef}`);
      setShowDayEndModal(false);
    } catch (err) {
      console.error('Error submitting daily report:', err);
      alert('Failed to submit day-end report: ' + err.message);
    } finally {
      setIsSubmittingDayEnd(false);
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
          <div className="v-op-greeting-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1>Good Evening, {userProfile.name || 'Officer'} 🌾</h1>
              <p>Here's today's procurement activity and verified farmer queue</p>
              <div className="v-op-date-row">
                <span>TODAY'S DATE • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="pill-badge pill-badge-green">MANDI OPEN</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="v-btn-dayend-action"
                onClick={handleOpenDayEndModal}
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <span>🚚</span>
                <span>File Day-End Lorry Dispatch Report</span>
              </button>

              {dailyReports.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReportHistoryModal(true)}
                  style={{
                    background: '#ffffff',
                    color: '#1e293b',
                    border: '1.5px solid #cbd5e1',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  📜 Past Reports ({dailyReports.length})
                </button>
              )}
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
                    onClick={() => handleOpenProcureModal(nowServing)}
                  >
                    Inspect Quality & Complete Procurement ✓
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
                    <th>QUALITY</th>
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
                      <td colSpan="9" style={{ textAlign: 'center', padding: '36px' }}>
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
                        <td>
                          {order.officerQuality ? (
                            <span className="pill-badge pill-badge-blue" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                              ✓ {order.officerQuality.split(' ')[0]} {order.officerQuality.split(' ')[1]}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                              ⭐ {order.quality ? (order.quality.length > 18 ? order.quality.slice(0, 18) + '...' : order.quality) : 'Grade A (FAQ)'}
                            </span>
                          )}
                        </td>
                        <td>{order.verifiedWeight || order.quantity} Qtl</td>
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
                          {order.status === 'Completed' || order.paymentStatus === 'Paid via DBT' ? (
                            <span className="pill-badge pill-badge-green">✓ Paid via DBT</span>
                          ) : order.status === 'Procured' || order.paymentStatus === 'Pending Supervisor Credit' ? (
                            <span className="pill-badge pill-badge-blue">⏳ Sent to Supervisor</span>
                          ) : (
                            <button
                              type="button"
                              className="v-btn-procure-action"
                              onClick={() => handleOpenProcureModal(order)}
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

      {/* Procure & Crop Quality Inspection Modal */}
      {procureModalOrder && (
        <div className="v-modal-overlay" onClick={() => !isProcuring && setProcureModalOrder(null)}>
          <div className="v-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="v-modal-header">
              <h4>🌾 Produce Inspection & Quality Assessment</h4>
              <button
                type="button"
                className="v-close-modal"
                disabled={isProcuring}
                onClick={() => setProcureModalOrder(null)}
              >
                ✕
              </button>
            </div>

            <p className="v-modal-sub" style={{ marginBottom: '14px' }}>
              Weighbridge intake for <b>{procureModalOrder.userName}</b> (Token: <b>{procureModalOrder.token}</b>)
            </p>

            <form onSubmit={handleConfirmProcure}>
              {/* Token & Crop Summary Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>CROP VARIETY</small>
                  <strong style={{ color: '#0f172a' }}>{procureModalOrder.item}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>FARMER DECLARED QUALITY</small>
                  <strong style={{ color: '#166534' }}>⭐ {procureModalOrder.quality || 'Grade A (FAQ)'}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>APPLICATION QUANTITY</small>
                  <strong style={{ color: '#0f172a' }}>{procureModalOrder.quantity} Qtl</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>VERIFIED JURISDICTION</small>
                  <strong style={{ color: '#0f172a' }}>📍 {procureModalOrder.zone}</strong>
                </div>
              </div>

              {/* Quality Grade Selector */}
              <div className="v-form-field" style={{ marginBottom: '14px' }}>
                <label style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>⭐ Assessed Crop Quality (Official Grade) *</span>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                    Rate: ₹{assessedQuality.includes('Grade B') ? '21.50' : assessedQuality.includes('Grade C') ? '19.00' : '23.00'}/Kg
                  </span>
                </label>
                <select
                  required
                  value={assessedQuality}
                  onChange={(e) => setAssessedQuality(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="Grade A (FAQ - Fair Average Quality / Premium)">Grade A (FAQ - Fair Average Quality / Premium) • ₹23.00/kg</option>
                  <option value="Grade B (Standard Market Quality)">Grade B (Standard Market Quality) • ₹21.50/kg</option>
                  <option value="Grade C (Substandard / Feed Quality)">Grade C (Substandard / Feed Quality) • ₹19.00/kg</option>
                </select>
              </div>

              {/* Row for Actual Weight & Moisture */}
              <div className="v-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="v-form-field">
                  <label style={{ fontWeight: 700 }}>Actual Weighed Quantity (Qtl) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 50"
                    value={assessedWeight}
                    onChange={(e) => setAssessedWeight(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                  />
                </div>
                <div className="v-form-field">
                  <label style={{ fontWeight: 700 }}>Moisture Content</label>
                  <select
                    value={assessedMoisture}
                    onChange={(e) => setAssessedMoisture(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                  >
                    <option value="12% (Standard / Optimum)">12% (Standard / Optimum)</option>
                    <option value="13% - 14% (Permissible)">13% - 14% (Permissible)</option>
                    <option value="15%+ (High Moisture)">15%+ (High Moisture)</option>
                  </select>
                </div>
              </div>

              {/* Physical Inspection Remarks */}
              <div className="v-form-field" style={{ marginBottom: '14px' }}>
                <label style={{ fontWeight: 700 }}>Inspection Remarks / Visual Appearance</label>
                <input
                  type="text"
                  placeholder="e.g. Grain uniform, golden color, moisture within permissible limits"
                  value={qualityRemarks}
                  onChange={(e) => setQualityRemarks(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}
                />
              </div>

              {/* Calculated Payout Banner */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <small style={{ color: '#166534', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>
                    ESTIMATED MANDI PAYOUT (DBT)
                  </small>
                  <span style={{ fontSize: '0.8rem', color: '#15803d' }}>
                    {assessedWeight || procureModalOrder.quantity || 0} Qtl × ₹{assessedQuality.includes('Grade B') ? '21.50' : assessedQuality.includes('Grade C') ? '19.00' : '23.00'}
                  </span>
                </div>
                <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>
                  ₹{(
                    (parseFloat(assessedWeight || procureModalOrder.quantity) || 0) *
                    (assessedQuality.includes('Grade B') ? 21.50 : assessedQuality.includes('Grade C') ? 19.00 : 23.00)
                  ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>

              <div className="v-modal-actions">
                <button
                  type="button"
                  className="v-btn-modal-cancel"
                  disabled={isProcuring}
                  onClick={() => setProcureModalOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="v-btn-modal-confirm"
                  disabled={isProcuring}
                >
                  {isProcuring ? 'Recording Procurement...' : '✓ Confirm Quality & Forward to Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day-End Mandi Closing & Lorry Dispatch Report Modal */}
      {showDayEndModal && (
        <div className="v-modal-overlay" onClick={() => !isSubmittingDayEnd && setShowDayEndModal(false)}>
          <div className="v-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="v-modal-header">
              <h4>🚚 Day-End Mandi Closing & Lorry Dispatch Report</h4>
              <button
                type="button"
                className="v-close-modal"
                disabled={isSubmittingDayEnd}
                onClick={() => setShowDayEndModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="v-modal-sub" style={{ marginBottom: '14px' }}>
              Official closing account of day procurement, gunny bag stock balance, and warehouse lorry dispatch to <b>Procurement Supervisor</b>.
            </p>

            <form onSubmit={handleSubmitDayEndReport}>
              {/* Centre & Officer Stamp */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                fontSize: '0.82rem'
              }}>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontWeight: 700 }}>REPORTING DATE</small>
                  <strong style={{ color: '#0f172a' }}>📅 {dayEndForm.date}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontWeight: 700 }}>MANDI / CENTRE</small>
                  <strong style={{ color: '#0f172a' }}>🏛️ {userProfile.subPlace || 'Main Mandi'}</strong>
                </div>
                <div>
                  <small style={{ color: '#64748b', display: 'block', fontWeight: 700 }}>PROCURING OFFICER</small>
                  <strong style={{ color: '#0f172a' }}>👤 {userProfile.name}</strong>
                </div>
              </div>

              {/* Section 1: Procurement & Gunny Bags */}
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', color: '#166534', fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  📦 1. Procurement Volume & Gunny Bags Accounting
                </strong>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div className="v-form-field">
                    <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Procured Today (Quintals) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 85.50"
                      value={dayEndForm.quintalsProcured}
                      onChange={(e) => setDayEndForm({ ...dayEndForm, quintalsProcured: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="v-form-field">
                    <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Gunny Bags Used *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 170"
                      value={dayEndForm.gunnyBagsUsed}
                      onChange={(e) => setDayEndForm({ ...dayEndForm, gunnyBagsUsed: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="v-form-field">
                    <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Gunny Bags Left (Stock) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 330"
                      value={dayEndForm.gunnyBagsLeft}
                      onChange={(e) => setDayEndForm({ ...dayEndForm, gunnyBagsLeft: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Lorry Transport & Logistics */}
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', color: '#1e40af', fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                  🚛 2. Warehouse Lorry Transport & Dispatch
                </strong>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '10px' }}>
                  <div className="v-form-field">
                    <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Quintals Transported in Lorry *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 85.50"
                      value={dayEndForm.quintalsTransported}
                      onChange={(e) => setDayEndForm({ ...dayEndForm, quintalsTransported: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="v-form-field">
                    <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Lorry Number (Vehicle Reg.) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TN-45-AZ-8921"
                      value={dayEndForm.lorryNumber}
                      onChange={(e) => setDayEndForm({ ...dayEndForm, lorryNumber: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '10px' }}>
                  <div className="v-form-field">
                    <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Driver Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. M. Selvam"
                      value={dayEndForm.driverName}
                      onChange={(e) => setDayEndForm({ ...dayEndForm, driverName: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>

                  <div className="v-form-field">
                    <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Driver Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={dayEndForm.driverPhone}
                      onChange={(e) => setDayEndForm({ ...dayEndForm, driverPhone: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="v-form-field" style={{ marginBottom: '10px' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Destination Warehouse / Godown *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Warehousing Corporation (CWC) Buffer Godown #3, Trichy"
                    value={dayEndForm.destinationGodown}
                    onChange={(e) => setDayEndForm({ ...dayEndForm, destinationGodown: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                  />
                </div>

                <div className="v-form-field">
                  <label style={{ fontWeight: 700, fontSize: '0.78rem' }}>Seal Numbers & Dispatch Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Security Seal #SEC-4029 applied, tarpaulin secured"
                    value={dayEndForm.remarks}
                    onChange={(e) => setDayEndForm({ ...dayEndForm, remarks: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="v-modal-actions">
                <button
                  type="button"
                  className="v-btn-modal-cancel"
                  disabled={isSubmittingDayEnd}
                  onClick={() => setShowDayEndModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="v-btn-modal-confirm"
                  disabled={isSubmittingDayEnd}
                  style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
                >
                  {isSubmittingDayEnd ? 'Transmitting to Supervisor...' : '✓ Submit Day-End Report to Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Past Daily Reports Modal */}
      {showReportHistoryModal && (
        <div className="v-modal-overlay" onClick={() => setShowReportHistoryModal(false)}>
          <div className="v-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="v-modal-header">
              <h4>📜 Filed Day-End Mandi Closing & Dispatch Reports</h4>
              <button
                type="button"
                className="v-close-modal"
                onClick={() => setShowReportHistoryModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ maxHeight: '450px', overflowY: 'auto', marginTop: '12px' }}>
              {dailyReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                  No day-end reports filed yet.
                </div>
              ) : (
                <table className="v-clean-table" style={{ fontSize: '0.84rem' }}>
                  <thead>
                    <tr>
                      <th>DATE & CHALLAN</th>
                      <th>PROCURED / TRANSPORTED</th>
                      <th>GUNNY BAGS (USED/LEFT)</th>
                      <th>LORRY & DRIVER</th>
                      <th>DESTINATION</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReports.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>📅 {r.date}</strong>
                          <small style={{ display: 'block', color: '#64748b' }}>{r.challanRef}</small>
                        </td>
                        <td>
                          <strong>{r.quintalsProcured} Qtl procured</strong>
                          <span style={{ display: 'block', color: '#0369a1', fontSize: '0.78rem' }}>
                            🚚 {r.quintalsTransported} Qtl in lorry
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#b45309', fontWeight: 600 }}>Used: {r.gunnyBagsUsed}</span>
                          <small style={{ display: 'block', color: '#16a34a' }}>Left: {r.gunnyBagsLeft}</small>
                        </td>
                        <td>
                          <strong>🚛 {r.lorryNumber}</strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b' }}>
                            {r.driverName} (📞 {r.driverPhone})
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#334155' }}>{r.destinationGodown}</span>
                        </td>
                        <td>
                          <span className={`pill-badge ${r.status?.includes('Acknowledged') ? 'pill-badge-green' : 'pill-badge-blue'}`}>
                            {r.status?.includes('Acknowledged') ? '✓ Acknowledged' : 'Submitted to Supervisor'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="v-modal-actions" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="v-btn-modal-cancel"
                onClick={() => setShowReportHistoryModal(false)}
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

export default OfficerDashboard;