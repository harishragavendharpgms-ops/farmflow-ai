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
  const [modalImage, setModalImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('pending');
  const [isSigning, setIsSigning] = useState(null);

  useEffect(() => {
    const savedUser =
      localStorage.getItem('farmflow_user') ||
      sessionStorage.getItem('farmflow_user');

    if (savedUser) {
      try {
        setUserProfile(JSON.parse(savedUser));
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
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
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

    let cleanPhone = phoneNumber
      .toString()
      .replace(/[^\d+]/g, '');

    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    // TextBee configuration retained from your existing workflow.
    const TEXTBEE_DEVICE_ID = "6a9d1e51ccb6c727098825fb";
    const TEXTBEE_API_KEY = "txb_TxrBzRwSdleKWzGtwMlg3bavFWnhAL7v";

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
        throw new Error(
          data.message || 'Failed to send SMS via TextBee'
        );
      }

      console.log('SMS sent successfully via TextBee:', data);
    } catch (err) {
      console.warn(
        'TextBee SMS dispatch failed:',
        err.message
      );
    }
  };

  const handleVerify = async (order) => {
    if (isSigning) return;

    setIsSigning(order.id);

    try {
      const now = new Date();

      const vaoName = userProfile.name || 'VAO Officer';

      const vaoDesignation = userProfile.subPlace
        ? `VAO / ${userProfile.subPlace}`
        : 'Village Administrative Officer';

      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();

      const docPdf = new jsPDF();

      // -----------------------------------
      // PDF HEADER
      // -----------------------------------

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(16);
      docPdf.text(
        'FARMFLOW AI - OFFICIAL VERIFIED CERTIFICATE',
        20,
        20
      );

      docPdf.setFontSize(11);
      docPdf.setFont('helvetica', 'normal');

      docPdf.text(
        `Application ID: ${order.id}`,
        20,
        35
      );

      docPdf.text(
        `Farmer Name: ${order.userName || 'N/A'}`,
        20,
        45
      );

      docPdf.text(
        `Crop/Item: ${order.item || 'N/A'} (${order.quantity || 0}kg)`,
        20,
        55
      );

      docPdf.text(
        `Zone / Location: ${order.zone || 'N/A'} ${
          order.subPlace ? `/ ${order.subPlace}` : ''
        }`,
        20,
        65
      );

      docPdf.text(
        `Patta/Chitta No: ${order.pattaChitta || 'N/A'}`,
        20,
        75
      );

      docPdf.line(20, 85, 190, 85);

      // -----------------------------------
      // DIGITAL SIGNATURE BOX
      // -----------------------------------

      docPdf.rect(130, 100, 65, 45);

      docPdf.setFont('courier', 'normal');
      docPdf.setFontSize(9);

      docPdf.text(
        '--- -----',
        147,
        107,
        { align: 'center' }
      );

      docPdf.setFont('courier', 'bold');

      docPdf.text(
        'Digitally signed:',
        162,
        114,
        { align: 'center' }
      );

      docPdf.text(
        vaoName.toUpperCase(),
        162,
        121,
        { align: 'center' }
      );

      docPdf.setFont('courier', 'normal');
      docPdf.setFontSize(8);

      docPdf.text(
        vaoDesignation,
        162,
        127,
        { align: 'center' }
      );

      docPdf.text(
        dateStr,
        162,
        134,
        { align: 'center' }
      );

      docPdf.text(
        timeStr,
        162,
        140,
        { align: 'center' }
      );

      const signedPdfBase64 =
        docPdf.output('datauristring');

      // -----------------------------------
      // FIRESTORE UPDATE
      // -----------------------------------

      await updateDoc(
        doc(db, 'orders', order.id),
        {
          status: 'VAO Verified',
          vaoSignatureDetails: {
            name: vaoName,
            designation: vaoDesignation,
            date: dateStr,
            time: timeStr
          },
          documentUrl: signedPdfBase64
        }
      );

      // -----------------------------------
      // SMS NOTIFICATION
      // -----------------------------------

      await triggerSms(
        order.userPhone,
        `FarmFlow AI: Your application for ${order.quantity}kg ${order.item} has been successfully verified and E-Signed by the VAO.`
      );

      alert(
        'Document successfully E-Signed, stamped inside the PDF, and SMS alert sent to Farmer!'
      );
    } catch (error) {
      console.error(error);
      alert(
        'Failed to verify and sign document.'
      );
    } finally {
      setIsSigning(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === 'Pending VAO'
      ),
    [orders]
  );

  const verifiedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === 'VAO Verified'
      ),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let list =
      activeFilter === 'pending'
        ? pendingOrders
        : activeFilter === 'verified'
        ? verifiedOrders
        : orders;

    if (!searchTerm.trim()) return list;

    const search = searchTerm.toLowerCase();

    return list.filter((order) => {
      return (
        String(order.userName || '')
          .toLowerCase()
          .includes(search) ||
        String(order.userEmail || '')
          .toLowerCase()
          .includes(search) ||
        String(order.item || '')
          .toLowerCase()
          .includes(search) ||
        String(order.pattaChitta || '')
          .toLowerCase()
          .includes(search) ||
        String(order.subPlace || '')
          .toLowerCase()
          .includes(search) ||
        String(order.id || '')
          .toLowerCase()
          .includes(search)
      );
    });
  }, [
    activeFilter,
    orders,
    pendingOrders,
    verifiedOrders,
    searchTerm
  ]);

  const getStatusClass = (status) => {
    if (status === 'Pending VAO') {
      return 'vao-status vao-status-pending';
    }

    if (status === 'VAO Verified') {
      return 'vao-status vao-status-verified';
    }

    return 'vao-status';
  };

  return (
    <div className="vao-dashboard">

      {/* SIDEBAR */}

      <aside className="vao-sidebar">

        <div className="vao-sidebar-brand">
          <div className="vao-brand-mark">
            🌱
          </div>

          <div>
            <div className="vao-brand-name">
              FarmFlow <span>AI</span>
            </div>

            <div className="vao-brand-subtitle">
              Smart Agriculture
            </div>
          </div>
        </div>

        <div className="vao-sidebar-section">
          <span>WORKSPACE</span>
        </div>

        <nav className="vao-sidebar-nav">

          <button
            className="vao-nav-item vao-nav-item-active"
            onClick={() => setActiveFilter('pending')}
          >
            <span className="vao-nav-icon">▣</span>
            <span>Verification Queue</span>

            <span className="vao-nav-count">
              {pendingOrders.length}
            </span>
          </button>

          <button
            className="vao-nav-item"
            onClick={() => setActiveFilter('verified')}
          >
            <span className="vao-nav-icon">✓</span>
            <span>Verified Records</span>
          </button>

          <button
            className="vao-nav-item"
            onClick={() => setActiveFilter('all')}
          >
            <span className="vao-nav-icon">◫</span>
            <span>All Applications</span>
          </button>

        </nav>

        <div className="vao-sidebar-spacer"></div>

        <div className="vao-sidebar-profile">

          <div className="vao-profile-avatar">
            {(userProfile.name || 'V').charAt(0).toUpperCase()}
          </div>

          <div className="vao-profile-info">
            <strong>
              {userProfile.name || 'VAO Officer'}
            </strong>

            <span>
              Local Revenue Administrator
            </span>
          </div>

        </div>

        <button
          className="vao-logout-btn"
          onClick={handleLogout}
        >
          <span>↪</span>
          Sign out
        </button>

      </aside>

      {/* MAIN */}

      <main className="vao-main">

        {/* TOPBAR */}

        <header className="vao-topbar">

          <div className="vao-topbar-left">

            <div className="vao-mobile-logo">
              🌱
            </div>

            <div>
              <div className="vao-page-kicker">
                VERIFICATION WORKSPACE
              </div>

              <h1>
                Document Verification
              </h1>
            </div>

          </div>

          <div className="vao-topbar-right">

            <div className="vao-location-chip">
              <span>⌖</span>
              <div>
                <small>Jurisdiction</small>
                <strong>
                  {userProfile.zone || 'Loading...'}
                </strong>
              </div>
            </div>

            <div className="vao-user-chip">
              <div className="vao-user-chip-avatar">
                {(userProfile.name || 'V')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {userProfile.name || 'Officer'}
                </strong>

                <span>VAO</span>
              </div>
            </div>

          </div>

        </header>

        <div className="vao-content">

          {/* WELCOME */}

          <section className="vao-welcome">

            <div>

              <div className="vao-welcome-label">
                GOOD DAY, OFFICER
              </div>

              <h2>
                Welcome back,{' '}
                <span>
                  {userProfile.name || 'Officer'}
                </span>
              </h2>

              <p>
                Review and verify farmer land documents
                submitted within your jurisdiction.
              </p>

            </div>

            <div className="vao-jurisdiction-card">

              <div className="vao-jurisdiction-icon">
                ⌖
              </div>

              <div>
                <small>YOUR JURISDICTION</small>

                <strong>
                  {userProfile.zone || 'Not assigned'}
                </strong>

                <span>
                  All villages & sub-places
                </span>
              </div>

            </div>

          </section>

          {/* STAT CARDS */}

          <section className="vao-stat-grid">

            <div className="vao-stat-card">

              <div className="vao-stat-icon vao-stat-icon-orange">
                ⏳
              </div>

              <div className="vao-stat-content">
                <span>Pending verification</span>

                <strong>
                  {pendingOrders.length}
                </strong>

                <small>
                  Applications awaiting review
                </small>
              </div>

            </div>

            <div className="vao-stat-card">

              <div className="vao-stat-icon vao-stat-icon-green">
                ✓
              </div>

              <div className="vao-stat-content">
                <span>Verified records</span>

                <strong>
                  {verifiedOrders.length}
                </strong>

                <small>
                  Successfully e-signed
                </small>
              </div>

            </div>

            <div className="vao-stat-card">

              <div className="vao-stat-icon vao-stat-icon-blue">
                ◫
              </div>

              <div className="vao-stat-content">
                <span>Total applications</span>

                <strong>
                  {orders.length}
                </strong>

                <small>
                  In your jurisdiction
                </small>
              </div>

            </div>

            <div className="vao-stat-card">

              <div className="vao-stat-icon vao-stat-icon-purple">
                ✦
              </div>

              <div className="vao-stat-content">
                <span>Digital workflow</span>

                <strong>Active</strong>

                <small>
                  Secure verification system
                </small>
              </div>

            </div>

          </section>

          {/* WORKSPACE */}

          <section className="vao-workspace-card">

            <div className="vao-workspace-header">

              <div>

                <div className="vao-section-label">
                  APPLICATIONS
                </div>

                <h3>
                  {activeFilter === 'pending'
                    ? 'Pending Document Verifications'
                    : activeFilter === 'verified'
                    ? 'Verified Records'
                    : 'All Applications'}
                </h3>

                <p>
                  Applications from your assigned
                  jurisdiction.
                </p>

              </div>

              <div className="vao-workspace-tools">

                <div className="vao-search">

                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search farmer, crop, ID..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                    >
                      ×
                    </button>
                  )}

                </div>

              </div>

            </div>

            {/* FILTERS */}

            <div className="vao-filter-row">

              <button
                className={
                  activeFilter === 'pending'
                    ? 'vao-filter vao-filter-active'
                    : 'vao-filter'
                }
                onClick={() =>
                  setActiveFilter('pending')
                }
              >
                Pending
                <span>{pendingOrders.length}</span>
              </button>

              <button
                className={
                  activeFilter === 'verified'
                    ? 'vao-filter vao-filter-active'
                    : 'vao-filter'
                }
                onClick={() =>
                  setActiveFilter('verified')
                }
              >
                Verified
                <span>{verifiedOrders.length}</span>
              </button>

              <button
                className={
                  activeFilter === 'all'
                    ? 'vao-filter vao-filter-active'
                    : 'vao-filter'
                }
                onClick={() =>
                  setActiveFilter('all')
                }
              >
                All
                <span>{orders.length}</span>
              </button>

            </div>

            {/* TABLE */}

            {filteredOrders.length === 0 ? (

              <div className="vao-empty-state">

                <div className="vao-empty-icon">
                  {searchTerm ? '⌕' : '✓'}
                </div>

                <h3>
                  {searchTerm
                    ? 'No matching applications'
                    : activeFilter === 'pending'
                    ? 'Verification queue is clear'
                    : 'No applications found'}
                </h3>

                <p>
                  {searchTerm
                    ? 'Try searching with a different farmer name, crop or application ID.'
                    : activeFilter === 'pending'
                    ? 'There are currently no pending applications requiring verification in your jurisdiction.'
                    : 'No records are currently available for this view.'}
                </p>

                {searchTerm && (
                  <button
                    className="vao-clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </button>
                )}

              </div>

            ) : (

              <div className="vao-table-wrapper">

                <table className="vao-table">

                  <thead>
                    <tr>
                      <th>Farmer & application</th>
                      <th>Land document</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredOrders.map((order) => (

                      <tr key={order.id}>

                        {/* FARMER */}

                        <td>

                          <div className="vao-farmer-cell">

                            <div className="vao-farmer-avatar">
                              {(order.userName || 'F')
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="vao-farmer-info">

                              <strong>
                                {order.userName || 'Farmer'}
                              </strong>

                              <span>
                                {order.item || 'N/A'}{' '}
                                <b>
                                  • {order.quantity || 0} kg
                                </b>
                              </span>

                              <small>
                                {order.userEmail || 'No email'}
                              </small>

                              <small className="vao-phone">
                                {order.userPhone || 'No phone'}
                              </small>

                            </div>

                          </div>

                          <div className="vao-application-id">
                            ID: {order.id}
                          </div>

                        </td>

                        {/* DOCUMENT */}

                        <td>

                          <div className="vao-document-cell">

                            <div className="vao-document-icon">
                              ▤
                            </div>

                            <div>

                              <strong>
                                Patta / Chitta
                              </strong>

                              <span>
                                No. {order.pattaChitta || 'N/A'}
                              </span>

                            </div>

                          </div>

                          {order.documentUrl && (
                            <button
                              className="vao-view-document"
                              onClick={() =>
                                setModalImage(
                                  order.documentUrl
                                )
                              }
                            >
                              <span>◉</span>
                              View document
                            </button>
                          )}

                        </td>

                        {/* LOCATION */}

                        <td>

                          <div className="vao-location-cell">

                            <span className="vao-location-main">
                              ⌖ {order.zone || 'N/A'}
                            </span>

                            <span className="vao-location-sub">
                              {order.subPlace ||
                                'General'}
                            </span>

                          </div>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={getStatusClass(
                              order.status
                            )}
                          >
                            <i></i>
                            {order.status || 'Unknown'}
                          </span>

                          {order.vaoSignatureDetails && (
                            <div className="vao-signed-info">
                              Signed{' '}
                              {order.vaoSignatureDetails.date}
                            </div>
                          )}

                        </td>

                        {/* ACTION */}

                        <td>

                          {order.status ===
                          'Pending VAO' ? (

                            <button
                              className="vao-sign-btn"
                              onClick={() =>
                                handleVerify(order)
                              }
                              disabled={
                                isSigning === order.id
                              }
                            >

                              {isSigning === order.id ? (
                                <>
                                  <span className="vao-spinner"></span>
                                  Signing...
                                </>
                              ) : (
                                <>
                                  <span>✍</span>
                                  E-Sign & Verify
                                </>
                              )}

                            </button>

                          ) : (

                            <button
                              className="vao-review-btn"
                              onClick={() =>
                                order.documentUrl &&
                                setModalImage(
                                  order.documentUrl
                                )
                              }
                            >
                              View certificate
                            </button>

                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          {/* INFORMATION FOOTER */}

          <section className="vao-security-banner">

            <div className="vao-security-icon">
              ✓
            </div>

            <div>
              <strong>
                Secure document verification
              </strong>

              <p>
                Verified applications are digitally
                signed and recorded in FarmFlow AI.
                The farmer is notified after successful
                verification.
              </p>
            </div>

            <div className="vao-security-status">
              <span></span>
              System active
            </div>

          </section>

        </div>

      </main>

      {/* DOCUMENT MODAL */}

      {modalImage && (

        <div
          className="vao-modal-overlay"
          onClick={(e) => {
            if (
              e.target === e.currentTarget
            ) {
              setModalImage(null);
            }
          }}
        >

          <div className="vao-document-modal">

            <div className="vao-modal-header">

              <div>

                <div className="vao-modal-kicker">
                  DOCUMENT PREVIEW
                </div>

                <h3>
                  Patta / Chitta Document
                </h3>

                <p>
                  Review the submitted land document
                  before verification.
                </p>

              </div>

              <button
                className="vao-modal-close"
                onClick={() =>
                  setModalImage(null)
                }
                aria-label="Close preview"
              >
                ×
              </button>

            </div>

            <div className="vao-document-preview">

              {modalImage.startsWith(
                'data:application/pdf'
              ) ||
              modalImage
                .toLowerCase()
                .includes('.pdf') ? (

                <iframe
                  src={modalImage}
                  title="PDF Document Preview"
                />

              ) : (

                <div className="vao-image-preview">

                  <img
                    src={modalImage}
                    alt="Patta Document"
                  />

                </div>

              )}

            </div>

            <div className="vao-modal-footer">

              <div className="vao-modal-note">
                <span>🔒</span>
                Document preview is securely displayed.
              </div>

              <button
                className="vao-modal-close-btn"
                onClick={() =>
                  setModalImage(null)
                }
              >
                Close preview
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default VAODashboard;