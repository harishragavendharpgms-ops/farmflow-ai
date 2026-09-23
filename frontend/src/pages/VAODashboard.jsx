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
import { jsPDF } from 'jspdf';
import './VAODashboard.css';

const VAODashboard = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [modalDocument, setModalDocument] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('pending');
  const [isSigning, setIsSigning] = useState(null);

  useEffect(() => {
    const savedUser =
      localStorage.getItem('farmflow_user') ||
      sessionStorage.getItem('farmflow_user');

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUserProfile(parsed);
      } catch (error) {
        console.error('Invalid saved user:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!userProfile.zone) return;

    const q = query(
      collection(db, 'orders'),
      where('zone', '==', userProfile.zone)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const allZoneOrders = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        allZoneOrders.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );

        setOrders(allZoneOrders);
      },
      (error) => {
        console.error('Failed to load VAO orders:', error);
      }
    );

    return () => unsub();
  }, [userProfile.zone]);

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
      const res = await fetch(
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send SMS via TextBee');
      }
      console.log('SMS sent successfully via TextBee:', data);
    } catch (err) {
      console.warn('TextBee SMS dispatch failed:', err.message);
    }
  };

  const handleVerify = async (order) => {
    if (isSigning) return;
    setIsSigning(order.id);

    try {
      const now = new Date();
      const vaoName = userProfile.name || 'Local Revenue Officer';
      const vaoDesignation = userProfile.subPlace
        ? `VAO / ${userProfile.subPlace}`
        : 'Village Administrative Officer';

      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();

      const docPdf = new jsPDF();

      // Official Certificate Header
      docPdf.setFillColor(22, 101, 52);
      docPdf.rect(0, 0, 210, 24, 'F');

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(16);
      docPdf.setTextColor(255, 255, 255);
      docPdf.text('FARMFLOW AI - OFFICIAL VERIFIED CERTIFICATE', 20, 16);

      docPdf.setTextColor(30, 41, 59);
      docPdf.setFontSize(11);
      docPdf.setFont('helvetica', 'normal');

      docPdf.text(`Application ID: ${order.id}`, 20, 38);
      docPdf.text(`Farmer Name: ${order.userName || 'N/A'}`, 20, 48);
      docPdf.text(`Crop & Harvest: ${order.item || 'N/A'} (${order.quantity || 0} kg)`, 20, 58);
      docPdf.text(
        `Zone & Jurisdiction: ${order.zone || 'N/A'} ${order.subPlace ? `/ ${order.subPlace}` : ''}`,
        20,
        68
      );
      docPdf.text(`Patta / Chitta Record: ${order.pattaChitta || 'N/A'}`, 20, 78);

      docPdf.setDrawColor(203, 213, 225);
      docPdf.line(20, 88, 190, 88);

      // Digital signature box
      docPdf.setDrawColor(22, 163, 74);
      docPdf.setFillColor(240, 253, 244);
      docPdf.roundedRect(125, 100, 70, 48, 3, 3, 'FD');

      docPdf.setFont('courier', 'normal');
      docPdf.setFontSize(8);
      docPdf.setTextColor(21, 128, 61);
      docPdf.text('--- GOVERNMENT VERIFICATION SEAL ---', 160, 107, { align: 'center' });

      docPdf.setFont('courier', 'bold');
      docPdf.setFontSize(9);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text('Digitally Authenticated:', 160, 115, { align: 'center' });
      docPdf.text(vaoName.toUpperCase(), 160, 122, { align: 'center' });

      docPdf.setFont('courier', 'normal');
      docPdf.setFontSize(8);
      docPdf.setTextColor(71, 85, 105);
      docPdf.text(vaoDesignation, 160, 128, { align: 'center' });
      docPdf.text(`Date: ${dateStr}`, 160, 134, { align: 'center' });
      docPdf.text(`Time: ${timeStr}`, 160, 140, { align: 'center' });

      const signedPdfBase64 = docPdf.output('datauristring');

      // Update Firestore
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'VAO Verified',
        vaoSignatureDetails: {
          name: vaoName,
          designation: vaoDesignation,
          date: dateStr,
          time: timeStr
        },
        documentUrl: signedPdfBase64
      });

      // Send SMS alert to farmer via TextBee
      const farmerPhone = order.userPhone;
      const farmerName = order.userName || 'Farmer';
      const crop = order.item || 'Crop';
      const qty = order.quantity || '0';
      const zone = userProfile.zone || order.zone || 'Jurisdiction';

      const smsText = `Dear ${farmerName}, your land document for ${crop} (${qty}kg) has been VERIFIED by VAO (${zone}). Your application is approved for mandi procurement. - FarmFlow AI`;

      await triggerSms(farmerPhone, smsText);

      alert(`Application ${order.id.slice(0, 8)} successfully verified and digitally signed!`);
    } catch (err) {
      console.error('Error verifying order:', err);
      alert('Verification failed: ' + err.message);
    } finally {
      setIsSigning(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of the VAO Officer Dashboard?")) {
      localStorage.removeItem('farmflow_user');
      sessionStorage.removeItem('farmflow_user');
      navigate('/login');
    }
  };

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'Pending VAO'),
    [orders]
  );
  const verifiedOrders = useMemo(
    () => orders.filter((o) => o.status === 'VAO Verified' || o.status === 'Procured'),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeFilter === 'pending') {
      list = pendingOrders;
    } else if (activeFilter === 'verified') {
      list = verifiedOrders;
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();

    return list.filter(
      (o) =>
        o.userName?.toLowerCase().includes(term) ||
        o.item?.toLowerCase().includes(term) ||
        o.id?.toLowerCase().includes(term) ||
        o.pattaChitta?.toLowerCase().includes(term) ||
        o.subPlace?.toLowerCase().includes(term)
    );
  }, [orders, activeFilter, pendingOrders, verifiedOrders, searchTerm]);

  const openDocumentPreview = (url, title) => {
    setModalDocument(url);
    setModalTitle(title);
  };

  return (
    <div className="vao-shell">
      {/* SIDEBAR */}
      <aside className="vao-sidebar">
        <div className="vao-brand">
          <span className="vao-leaf">🌱</span>
          <div>
            <strong>FarmFlow <span>AI</span></strong>
            <small>REVENUE ADMIN (VAO)</small>
          </div>
        </div>

        <div className="vao-menu-label">VERIFICATION WORKSPACE</div>

        <nav className="vao-nav">
          <button
            type="button"
            className={`vao-nav-btn ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            <div className="vao-nav-btn-left">
              <span>⏳</span>
              <span>Verification Queue</span>
            </div>
            <span className="vao-nav-badge warning">{pendingOrders.length}</span>
          </button>

          <button
            type="button"
            className={`vao-nav-btn ${activeFilter === 'verified' ? 'active' : ''}`}
            onClick={() => setActiveFilter('verified')}
          >
            <div className="vao-nav-btn-left">
              <span>✓</span>
              <span>Verified Records</span>
            </div>
            <span className="vao-nav-badge success">{verifiedOrders.length}</span>
          </button>

          <button
            type="button"
            className={`vao-nav-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <div className="vao-nav-btn-left">
              <span>📋</span>
              <span>All Applications</span>
            </div>
            <span className="vao-nav-badge default">{orders.length}</span>
          </button>
        </nav>

        {/* JURISDICTION COVERAGE CARD */}
        <div className="vao-sidebar-jurisdiction">
          <div className="vao-jurisdiction-label">
            <span>📍</span>
            <span>ASSIGNED JURISDICTION</span>
          </div>
          <strong>{userProfile.zone || 'Loading...'}</strong>
          <small>{userProfile.subPlace || 'All village administrative circles'}</small>
        </div>

        <div className="vao-sidebar-bottom">
          <div className="vao-officer-card">
            <div className="vao-officer-avatar">
              {(userProfile.name || 'V').charAt(0).toUpperCase()}
            </div>
            <div className="vao-officer-info">
              <strong>{userProfile.name || 'Local Officer'}</strong>
              <small>Revenue Admin (VAO)</small>
            </div>
          </div>
          <button type="button" className="vao-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="vao-main">
        {/* TOPBAR */}
        <header className="vao-topbar">
          <div className="vao-topbar-left">
            <span className="vao-topbar-title">Land & Crop Verification Workspace</span>
          </div>

          <div className="vao-topbar-right">
            <div className="vao-jurisdiction-chip">
              <span>📍</span>
              <span>Zone: <b>{userProfile.zone || 'Tamil Nadu'}</b></span>
            </div>

            <div className="vao-officer-pill">
              <span className="vao-pill-icon">🧑‍💼</span>
              <span>{userProfile.name || 'Revenue Officer'}</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="vao-content">
          {/* WELCOME BANNER */}
          <section className="vao-welcome-banner">
            <div>
              <div className="vao-welcome-badge">OFFICIAL JURISDICTION DESK</div>
              <h2>
                Welcome back, <span>{userProfile.name || 'Officer'}</span>
              </h2>
              <p>
                Authenticate farmer Patta/Chitta land documents and issue cryptographic clearance certificates for mandi procurement.
              </p>
            </div>

            <div className="vao-banner-stat-box">
              <small>PENDING APPROVAL</small>
              <strong>{pendingOrders.length} Farmers</strong>
              <span>Awaiting review in {userProfile.zone || 'your zone'}</span>
            </div>
          </section>

          {/* 4 KPI CARDS */}
          <section className="vao-stat-cards-grid">
            <div
              className="vao-stat-card bar-yellow"
              onClick={() => setActiveFilter('pending')}
              style={{ cursor: 'pointer' }}
            >
              <div className="vao-stat-card-head">
                <small>Pending Verification</small>
                <span className="vao-stat-icon-wrap amber">⏳</span>
              </div>
              <h2>{pendingOrders.length}</h2>
              <div className="vao-stat-sub">Requires land document review</div>
            </div>

            <div
              className="vao-stat-card bar-green"
              onClick={() => setActiveFilter('verified')}
              style={{ cursor: 'pointer' }}
            >
              <div className="vao-stat-card-head">
                <small>Verified Records</small>
                <span className="vao-stat-icon-wrap emerald">✓</span>
              </div>
              <h2>{verifiedOrders.length}</h2>
              <div className="vao-stat-sub">Digitally signed & approved</div>
            </div>

            <div
              className="vao-stat-card bar-blue"
              onClick={() => setActiveFilter('all')}
              style={{ cursor: 'pointer' }}
            >
              <div className="vao-stat-card-head">
                <small>Total Applications</small>
                <span className="vao-stat-icon-wrap blue">📋</span>
              </div>
              <h2>{orders.length}</h2>
              <div className="vao-stat-sub">Registered in {userProfile.zone || 'zone'}</div>
            </div>

            <div className="vao-stat-card bar-purple">
              <div className="vao-stat-card-head">
                <small>Digital Verification</small>
                <span className="vao-stat-icon-wrap purple">🛡️</span>
              </div>
              <h2>Active</h2>
              <div className="vao-stat-sub">SMS & 256-bit e-signature</div>
            </div>
          </section>

          {/* WORKSPACE CARD */}
          <section className="vao-workspace-card">
            <div className="vao-workspace-header-row">
              <div>
                <h3>
                  {activeFilter === 'pending'
                    ? 'Pending Land Document Verifications'
                    : activeFilter === 'verified'
                    ? 'Verified & Approved Records'
                    : 'All Zone Applications'}
                </h3>
                <p>Applications submitted by registered farmers in your jurisdiction.</p>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="vao-tools-bar">
                <div className="vao-search-box">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search farmer, crop, Patta, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button onClick={() => setSearchTerm('')}>×</button>}
                </div>

                <div className="vao-filter-pill-group">
                  <button
                    type="button"
                    className={`vao-filter-pill ${activeFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('pending')}
                  >
                    Pending ({pendingOrders.length})
                  </button>
                  <button
                    type="button"
                    className={`vao-filter-pill ${activeFilter === 'verified' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('verified')}
                  >
                    Verified ({verifiedOrders.length})
                  </button>
                  <button
                    type="button"
                    className={`vao-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                  >
                    All ({orders.length})
                  </button>
                </div>
              </div>
            </div>

            {/* ORDERS TABLE */}
            <div className="vao-table-responsive">
              <table className="vao-clean-table">
                <thead>
                  <tr>
                    <th>FARMER & APPLICATION</th>
                    <th>CROP & QUANTITY</th>
                    <th>LAND DOCUMENT (PATTA)</th>
                    <th>VILLAGE LOCATION</th>
                    <th>VERIFICATION STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="vao-empty-cell">
                        <div className="vao-empty-box">
                          <span className="vao-empty-icon">
                            {searchTerm ? '🔍' : activeFilter === 'pending' ? '🎉' : '📂'}
                          </span>
                          <strong>
                            {searchTerm
                              ? 'No matching applications found'
                              : activeFilter === 'pending'
                              ? 'Verification queue is completely clear!'
                              : 'No application records in this view.'}
                          </strong>
                          <p>
                            {searchTerm
                              ? 'Try searching with a different farmer name, crop, or Patta number.'
                              : activeFilter === 'pending'
                              ? 'All farmer land documents in your jurisdiction have been authenticated.'
                              : 'New applications will appear here as farmers submit them.'}
                          </p>
                          {searchTerm && (
                            <button
                              type="button"
                              className="vao-btn-outline"
                              onClick={() => setSearchTerm('')}
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isVerified = order.status === 'VAO Verified' || order.status === 'Procured';

                      return (
                        <tr key={order.id}>
                          {/* FARMER CELL */}
                          <td>
                            <div className="vao-farmer-cell">
                              <div className="vao-avatar-circle">
                                {(order.userName || 'F').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{order.userName || 'Farmer'}</strong>
                                <small>App ID: {order.id.slice(0, 10)}</small>
                                <span className="vao-contact-text">
                                  📞 {order.userPhone || 'No Phone'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* CROP CELL */}
                          <td>
                            <div className="vao-crop-cell">
                              <span className="vao-crop-pill">🌾 {order.item || 'Crop'}</span>
                              <b>{order.quantity || 0} kg</b>
                            </div>
                          </td>

                          {/* LAND DOCUMENT CELL */}
                          <td>
                            <div className="vao-doc-cell">
                              <div className="vao-patta-box">
                                <span className="vao-patta-label">PATTA / CHITTA</span>
                                <strong>No. {order.pattaChitta || 'N/A'}</strong>
                              </div>

                              {order.documentUrl && (
                                <button
                                  type="button"
                                  className="vao-doc-preview-btn"
                                  onClick={() =>
                                    openDocumentPreview(
                                      order.documentUrl,
                                      `Land Document - ${order.userName || 'Farmer'} (Patta: ${order.pattaChitta || 'N/A'})`
                                    )
                                  }
                                >
                                  <span>👁️</span> Preview Document
                                </button>
                              )}
                            </div>
                          </td>

                          {/* LOCATION */}
                          <td>
                            <div className="vao-location-cell">
                              <span className="vao-zone-pill">📍 {order.zone || 'Zone'}</span>
                              <span className="vao-subplace-text">
                                🏘️ {order.subPlace || 'General'}
                              </span>
                            </div>
                          </td>

                          {/* STATUS */}
                          <td>
                            {isVerified ? (
                              <div className="vao-status-verified-box">
                                <span className="pill-badge pill-badge-green">✓ VAO Verified</span>
                                {order.vaoSignatureDetails && (
                                  <small className="vao-sign-date">
                                    Signed by {order.vaoSignatureDetails.name || 'VAO'} on {order.vaoSignatureDetails.date}
                                  </small>
                                )}
                              </div>
                            ) : (
                              <div className="vao-status-pending-box">
                                <span className="pill-badge pill-badge-yellow">⏳ Pending VAO</span>
                                <small className="vao-action-hint">Awaiting Land Record E-Sign</small>
                              </div>
                            )}
                          </td>

                          {/* ACTION BUTTON */}
                          <td>
                            {order.status === 'Pending VAO' ? (
                              <button
                                type="button"
                                className="vao-btn-verify-action"
                                onClick={() => handleVerify(order)}
                                disabled={isSigning === order.id}
                              >
                                {isSigning === order.id ? (
                                  <>
                                    <span className="vao-btn-spinner" />
                                    <span>Verifying & Signing...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✍</span>
                                    <span>E-Sign & Verify</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="vao-btn-view-cert"
                                onClick={() =>
                                  order.documentUrl &&
                                  openDocumentPreview(
                                    order.documentUrl,
                                    `Official Verification Certificate - ${order.userName || 'Farmer'}`
                                  )
                                }
                              >
                                <span>📄</span> View Certificate
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
          </section>

          {/* SECURITY & AUDIT FOOTER */}
          <footer className="vao-security-footer">
            <div className="vao-sec-badge">
              <span>🔐</span>
              <div>
                <strong>Cryptographic Audit Trail</strong>
                <small>Every e-signature is stamped with official timestamp, officer credentials, and SMS verification.</small>
              </div>
            </div>
            <div className="vao-sec-status">
              <span className="pulse-dot" />
              <span>Tamper-Proof Governance Active</span>
            </div>
          </footer>
        </div>
      </main>

      {/* DOCUMENT PREVIEW MODAL */}
      {modalDocument && (
        <div
          className="vao-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalDocument(null);
          }}
        >
          <div className="vao-preview-modal">
            <div className="vao-modal-head">
              <div>
                <small className="vao-modal-kicker">GOVERNMENT DOCUMENT INSPECTION</small>
                <h3>{modalTitle || 'Document Preview'}</h3>
              </div>
              <button
                type="button"
                className="vao-modal-close"
                onClick={() => setModalDocument(null)}
              >
                ✕
              </button>
            </div>

            <div className="vao-modal-body">
              {modalDocument.startsWith('data:application/pdf') ||
              modalDocument.toLowerCase().includes('.pdf') ? (
                <iframe
                  src={modalDocument}
                  title="Document Preview"
                  className="vao-preview-iframe"
                />
              ) : (
                <div className="vao-preview-img-wrap">
                  <img src={modalDocument} alt="Land Record Preview" />
                </div>
              )}
            </div>

            <div className="vao-modal-foot">
              <div className="vao-modal-note">
                <span>🔒</span> Official digital record for FarmFlow AI revenue verification.
              </div>
              <button
                type="button"
                className="vao-btn-outline"
                onClick={() => setModalDocument(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VAODashboard;