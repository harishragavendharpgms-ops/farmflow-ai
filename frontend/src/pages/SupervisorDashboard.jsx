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
            <h1>Procurement Approval & Direct Benefit Transfer (DBT)</h1>
            <p>
              Review all crop procurements verified and weighed by mandi officers. Authorize and disburse direct treasury payments into farmers' bank accounts.
            </p>
          </div>

          <div className="v-sup-hero-actions">
            <div className="v-sup-treasury-tag">
              <span>🏛️</span>
              <div>
                <small>DISBURSAL GATEWAY</small>
                <strong>PFMS / RBI Direct Benefit Transfer Active</strong>
              </div>
            </div>
          </div>
        </div>

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
                            <span className="v-crop-chip">🌾 {order.item || 'Paddy (Grade A)'}</span>
                            <strong>{order.quantity} Qtl</strong>
                            <small>Govt MSP Verified</small>
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
                  <small>CROP & VOLUME</small>
                  <strong>{selectedOrderForCredit.item} ({selectedOrderForCredit.quantity} Qtl)</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Token: {selectedOrderForCredit.token}
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
                  <small>PROCUREMENT BATCH</small>
                  <strong>{selectedOrderForVoucher.item}</strong>
                  <span>Quantity: {selectedOrderForVoucher.quantity} Qtl</span>
                  <span>Token: {selectedOrderForVoucher.token}</span>
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
