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
  const [userProfile, setUserProfile] = useState({});
  const [modalImage, setModalImage] = useState(null);
  const [slotInputs, setSlotInputs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingSlot, setIsSavingSlot] = useState(null);
  const [isProcuring, setIsProcuring] = useState(null);

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
    if (!userProfile.zone || !userProfile.subPlace) return;

    const q = query(
      collection(db, 'orders'),
      where('zone', '==', userProfile.zone),
      where('subPlace', '==', userProfile.subPlace)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const allVillageOrders = snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        const filtered = allVillageOrders.filter(
          (order) => order.status === 'VAO Verified'
        );

        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );

        setOrders(filtered);
      },
      (error) => {
        console.error('Failed to load officer orders:', error);
      }
    );

    return () => unsub();
  }, [userProfile.zone, userProfile.subPlace]);

  const handleInputChange = (orderId, field, value) => {
    setSlotInputs((prev) => ({
      ...prev,
      [orderId]: {
        date:
          field === 'date'
            ? value
            : prev[orderId]?.date || '',
        time:
          field === 'time'
            ? value
            : prev[orderId]?.time || ''
      }
    }));
  };

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
          data.message || 'Failed to send SMS'
        );
      }

      console.log(
        'SMS sent successfully via TextBee:',
        data
      );
    } catch (err) {
      console.warn(
        'TextBee SMS dispatch failed:',
        err.message
      );
    }
  };

  const handleSaveTimeSlot = async (id) => {
    const input = slotInputs[id];

    if (!input || !input.date || !input.time) {
      alert(
        'Please select a date and enter the time manually.'
      );
      return;
    }

    const combinedSlot = `${input.date} at ${input.time}`;
    const order = orders.find((o) => o.id === id);

    if (!order) {
      alert('Application could not be found.');
      return;
    }

    setIsSavingSlot(id);

    try {
      await updateDoc(doc(db, 'orders', id), {
        datetime: combinedSlot,
        rescheduleRequested: false,
        preferredRescheduleDate: null,
        preferredRescheduleTime: null
      });

      await triggerSms(
        order.userPhone,
        `FarmFlow AI: Your slot is confirmed on ${combinedSlot} at ${order.zone}.`
      );

      alert(
        `Time slot successfully assigned: ${combinedSlot}`
      );
    } catch (error) {
      console.error(error);
      alert('Failed to assign time slot.');
    } finally {
      setIsSavingSlot(null);
    }
  };

  const handleProcure = async (id) => {
    const order = orders.find((o) => o.id === id);

    if (!order) {
      alert('Application could not be found.');
      return;
    }

    if (
      !order.datetime ||
      order.datetime === 'TBD by Officer'
    ) {
      const proceed = window.confirm(
        'No procurement slot has been assigned yet. Do you want to complete procurement anyway?'
      );

      if (!proceed) return;
    }

    const estimatedRate = 22.50;

    const totalPayout = (
      (parseFloat(order.quantity) || 0) *
      estimatedRate
    ).toFixed(2);

    setIsProcuring(id);

    try {
      await updateDoc(doc(db, 'orders', id), {
        status: 'Procured',
        paymentStatus: 'Paid via DBT',
        payoutAmount: totalPayout,
        procuredAt: new Date().toISOString()
      });

      await triggerSms(
        order.userPhone,
        `FarmFlow AI: Procurement complete! A payout of INR ${totalPayout} has been processed via DBT.`
      );

      alert(
        'Crop successfully marked as Procured!'
      );
    } catch (error) {
      console.error(error);
      alert(
        'Failed to update procurement status.'
      );
    } finally {
      setIsProcuring(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const totalQuantity = useMemo(() => {
    return orders.reduce(
      (total, order) =>
        total + (parseFloat(order.quantity) || 0),
      0
    );
  }, [orders]);

  const estimatedPayout = useMemo(() => {
    return (totalQuantity * 22.5).toFixed(2);
  }, [totalQuantity]);

  const scheduledOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.datetime &&
        order.datetime !== 'TBD by Officer'
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;

    const search = searchTerm.toLowerCase();

    return orders.filter((order) => {
      return (
        String(order.userName || '')
          .toLowerCase()
          .includes(search) ||
        String(order.userEmail || '')
          .toLowerCase()
          .includes(search) ||
        String(order.userPhone || '')
          .toLowerCase()
          .includes(search) ||
        String(order.item || '')
          .toLowerCase()
          .includes(search) ||
        String(order.pattaChitta || '')
          .toLowerCase()
          .includes(search) ||
        String(order.id || '')
          .toLowerCase()
          .includes(search)
      );
    });
  }, [orders, searchTerm]);

  return (
    <div className="officer-dashboard">

      {/* SIDEBAR */}

      <aside className="officer-sidebar">

        <div className="officer-sidebar-brand">

          <div className="officer-brand-mark">
            🌱
          </div>

          <div>
            <div className="officer-brand-name">
              FarmFlow <span>AI</span>
            </div>

            <div className="officer-brand-subtitle">
              Smart Agriculture
            </div>
          </div>

        </div>

        <div className="officer-sidebar-section">
          <span>WORKSPACE</span>
        </div>

        <nav className="officer-sidebar-nav">

          <button
            className="officer-nav-item officer-nav-active"
            onClick={() => window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })}
          >
            <span className="officer-nav-icon">
              ▣
            </span>

            <span>Procurement Queue</span>

            <span className="officer-nav-count">
              {orders.length}
            </span>
          </button>

          <button
            className="officer-nav-item"
            onClick={() => {
              document
                .getElementById('officer-summary')
                ?.scrollIntoView({
                  behavior: 'smooth'
                });
            }}
          >
            <span className="officer-nav-icon">
              ◫
            </span>

            <span>Procurement Summary</span>
          </button>

          <button
            className="officer-nav-item"
            onClick={() => {
              document
                .getElementById('officer-security')
                ?.scrollIntoView({
                  behavior: 'smooth'
                });
            }}
          >
            <span className="officer-nav-icon">
              ✓
            </span>

            <span>System Status</span>
          </button>

        </nav>

        <div className="officer-sidebar-spacer"></div>

        <div className="officer-sidebar-profile">

          <div className="officer-profile-avatar">
            {(userProfile.name || 'O')
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="officer-profile-info">

            <strong>
              {userProfile.name || 'Procurement Officer'}
            </strong>

            <span>
              Procurement Officer
            </span>

          </div>

        </div>

        <button
          className="officer-logout-btn"
          onClick={handleLogout}
        >
          <span>↪</span>
          <span>Sign out</span>
        </button>

      </aside>


      {/* MAIN */}

      <main className="officer-main">

        {/* TOPBAR */}

        <header className="officer-topbar">

          <div className="officer-topbar-left">

            <div className="officer-mobile-logo">
              🌱
            </div>

            <div>

              <div className="officer-page-kicker">
                PROCUREMENT WORKSPACE
              </div>

              <h1>
                Procurement Management
              </h1>

            </div>

          </div>


          <div className="officer-topbar-right">

            <div className="officer-location-chip">

              <span>⌖</span>

              <div>
                <small>JURISDICTION</small>

                <strong>
                  {userProfile.subPlace || 'Loading...'}
                </strong>
              </div>

            </div>

            <div className="officer-user-chip">

              <div className="officer-user-avatar">
                {(userProfile.name || 'O')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {userProfile.name || 'Officer'}
                </strong>

                <span>
                  Procurement Officer
                </span>
              </div>

            </div>

          </div>

        </header>


        <div className="officer-content">

          {/* WELCOME */}

          <section className="officer-welcome">

            <div>

              <div className="officer-welcome-label">
                PROCUREMENT OPERATIONS
              </div>

              <h2>
                Welcome back,{' '}
                <span>
                  {userProfile.name || 'Officer'}
                </span>
              </h2>

              <p>
                Manage verified farmer applications,
                assign procurement slots and complete
                DBT procurement processing.
              </p>

            </div>

            <div className="officer-jurisdiction-card">

              <div className="officer-jurisdiction-icon">
                ⌖
              </div>

              <div>

                <small>
                  YOUR JURISDICTION
                </small>

                <strong>
                  {userProfile.subPlace || 'Not assigned'}
                </strong>

                <span>
                  {userProfile.zone || 'Zone unavailable'}
                </span>

              </div>

            </div>

          </section>


          {/* STATISTICS */}

          <section
            id="officer-summary"
            className="officer-stat-grid"
          >

            <div className="officer-stat-card">

              <div className="officer-stat-icon officer-orange">
                ◈
              </div>

              <div className="officer-stat-content">

                <span>
                  Ready for procurement
                </span>

                <strong>
                  {orders.length}
                </strong>

                <small>
                  VAO verified applications
                </small>

              </div>

            </div>


            <div className="officer-stat-card">

              <div className="officer-stat-icon officer-blue">
                ◷
              </div>

              <div className="officer-stat-content">

                <span>
                  Scheduled
                </span>

                <strong>
                  {scheduledOrders.length}
                </strong>

                <small>
                  Applications with assigned slots
                </small>

              </div>

            </div>


            <div className="officer-stat-card">

              <div className="officer-stat-icon officer-green">
                ⚖
              </div>

              <div className="officer-stat-content">

                <span>
                  Total crop quantity
                </span>

                <strong>
                  {totalQuantity.toLocaleString()}
                </strong>

                <small>
                  Kilograms awaiting procurement
                </small>

              </div>

            </div>


            <div className="officer-stat-card">

              <div className="officer-stat-icon officer-purple">
                ₹
              </div>

              <div className="officer-stat-content">

                <span>
                  Estimated DBT value
                </span>

                <strong>
                  ₹{estimatedPayout}
                </strong>

                <small>
                  Based on ₹22.50/kg
                </small>

              </div>

            </div>

          </section>


          {/* PROCUREMENT WORKSPACE */}

          <section className="officer-workspace-card">

            <div className="officer-workspace-header">

              <div>

                <div className="officer-section-label">
                  VERIFIED APPLICATIONS
                </div>

                <h3>
                  Ready for Procurement
                </h3>

                <p>
                  Applications verified by the Local
                  Revenue Administrator in your jurisdiction.
                </p>

              </div>

              <div className="officer-search">

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
                    onClick={() =>
                      setSearchTerm('')
                    }
                  >
                    ×
                  </button>
                )}

              </div>

            </div>


            {/* WORKFLOW INDICATOR */}

            <div className="officer-workflow">

              <div className="officer-workflow-step officer-step-done">

                <div className="officer-step-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    VAO Verification
                  </strong>

                  <span>
                    Completed
                  </span>
                </div>

              </div>

              <div className="officer-workflow-line"></div>

              <div className="officer-workflow-step officer-step-active">

                <div className="officer-step-icon">
                  2
                </div>

                <div>
                  <strong>
                    Procurement
                  </strong>

                  <span>
                    Current stage
                  </span>
                </div>

              </div>

              <div className="officer-workflow-line"></div>

              <div className="officer-workflow-step">

                <div className="officer-step-icon">
                  3
                </div>

                <div>
                  <strong>
                    DBT Payment
                  </strong>

                  <span>
                    After procurement
                  </span>
                </div>

              </div>

            </div>


            {/* TABLE */}

            {filteredOrders.length === 0 ? (

              <div className="officer-empty-state">

                <div className="officer-empty-icon">
                  {searchTerm ? '⌕' : '✓'}
                </div>

                <h3>
                  {searchTerm
                    ? 'No matching applications'
                    : 'Procurement queue is clear'}
                </h3>

                <p>
                  {searchTerm
                    ? 'Try another farmer name, crop, phone number or application ID.'
                    : 'There are currently no VAO verified applications awaiting procurement in your jurisdiction.'}
                </p>

                {searchTerm && (
                  <button
                    className="officer-clear-search"
                    onClick={() =>
                      setSearchTerm('')
                    }
                  >
                    Clear search
                  </button>
                )}

              </div>

            ) : (

              <div className="officer-table-wrapper">

                <table className="officer-table">

                  <thead>

                    <tr>
                      <th>
                        Farmer & crop
                      </th>

                      <th>
                        Location & certificate
                      </th>

                      <th>
                        Procurement slot
                      </th>

                      <th>
                        Payout
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>

                  </thead>


                  <tbody>

                    {filteredOrders.map((order) => {

                      const payout = (
                        (parseFloat(order.quantity) || 0) *
                        22.5
                      ).toFixed(2);

                      return (

                        <tr key={order.id}>

                          {/* FARMER */}

                          <td>

                            <div className="officer-farmer-cell">

                              <div className="officer-farmer-avatar">
                                {(order.userName || 'F')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="officer-farmer-info">

                                <strong>
                                  {order.userName || 'Farmer'}
                                </strong>

                                <span>
                                  {order.item || 'N/A'}
                                  {' '}
                                  <b>
                                    • {order.quantity || 0} kg
                                  </b>
                                </span>

                                <small>
                                  {order.userEmail ||
                                    'No email'}
                                </small>

                                <small className="officer-phone">
                                  {order.userPhone ||
                                    'No phone'}
                                </small>

                              </div>

                            </div>

                            <div className="officer-app-id">
                              ID: {order.id}
                            </div>

                          </td>


                          {/* LOCATION + DOCUMENT */}

                          <td>

                            <div className="officer-location-cell">

                              <strong>
                                ⌖ {order.zone || 'N/A'}
                              </strong>

                              <span>
                                {order.subPlace ||
                                  'General'}
                              </span>

                            </div>

                            {order.documentUrl && (

                              <button
                                className="officer-view-document"
                                onClick={() =>
                                  setModalImage(
                                    order.documentUrl
                                  )
                                }
                              >
                                <span>◉</span>
                                View signed certificate
                              </button>

                            )}

                            {order.vaoSignatureDetails ? (

                              <div className="officer-signature-card">

                                <div className="officer-signature-line">
                                  --- -----
                                </div>

                                <strong>
                                  Digitally signed
                                </strong>

                                <b>
                                  {order.vaoSignatureDetails.name}
                                </b>

                                <span>
                                  {order.vaoSignatureDetails.designation}
                                </span>

                                <small>
                                  {order.vaoSignatureDetails.date}
                                  {' '}
                                  •
                                  {' '}
                                  {order.vaoSignatureDetails.time}
                                </small>

                              </div>

                            ) : (

                              <span className="officer-pending-stamp">
                                Pending VAO stamp
                              </span>

                            )}

                          </td>


                          {/* SLOT */}

                          <td>

                            <div className="officer-slot-box">

                              {order.rescheduleRequested && (
                                <div style={{ marginBottom: '8px', padding: '8px', background: '#fff0ef', border: '1px solid #fadbd8', borderRadius: '6px', color: '#d9534f', fontSize: '9px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>⚠️</span> Reschedule Requested:
                                  </div>
                                  <span style={{ color: '#b53b37' }}>{order.preferredRescheduleDate} at {order.preferredRescheduleTime}</span>
                                </div>
                              )}

                              <label>
                                PROCUREMENT DATE
                              </label>

                              <input
                                type="date"
                                value={
                                  slotInputs[order.id]?.date ||
                                  ''
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    order.id,
                                    'date',
                                    e.target.value
                                  )
                                }
                              />

                              <label>
                                MANUAL TIME
                              </label>

                              <div className="officer-time-row">

                                <input
                                  type="text"
                                  placeholder="10:30 AM"
                                  value={
                                    slotInputs[order.id]?.time ||
                                    ''
                                  }
                                  onChange={(e) =>
                                    handleInputChange(
                                      order.id,
                                      'time',
                                      e.target.value
                                    )
                                  }
                                />

                                <button
                                  className="officer-set-btn"
                                  onClick={() =>
                                    handleSaveTimeSlot(
                                      order.id
                                    )
                                  }
                                  disabled={
                                    isSavingSlot === order.id
                                  }
                                >
                                  {isSavingSlot === order.id
                                    ? '...'
                                    : 'Set'}
                                </button>

                              </div>

                              {order.datetime &&
                                order.datetime !==
                                  'TBD by Officer' && (

                                <div className="officer-current-slot">

                                  <span>
                                    ✓
                                  </span>

                                  Current:
                                  {' '}
                                  {order.datetime}

                                </div>

                              )}

                            </div>

                          </td>


                          {/* PAYOUT */}

                          <td>

                            <div className="officer-payout">

                              <span>
                                RATE
                              </span>

                              <strong>
                                ₹22.50/kg
                              </strong>

                              <small>
                                Estimated payout
                              </small>

                              <b>
                                ₹{payout}
                              </b>

                            </div>

                          </td>


                          {/* ACTION */}

                          <td>

                            <button
                              className="officer-procure-btn"
                              onClick={() =>
                                handleProcure(order.id)
                              }
                              disabled={
                                isProcuring === order.id
                              }
                            >

                              {isProcuring === order.id ? (
                                <>
                                  <span className="officer-spinner"></span>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <span>📦</span>
                                  Complete Procurement
                                </>
                              )}

                            </button>

                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            )}

          </section>


          {/* PROCESS INFORMATION */}

          <section className="officer-process-grid">

            <div className="officer-info-card">

              <div className="officer-info-icon">
                ◷
              </div>

              <div>

                <strong>
                  Slot assignment
                </strong>

                <p>
                  Select the procurement date and enter
                  the required time manually. The farmer
                  receives an SMS confirmation.
                </p>

              </div>

            </div>


            <div className="officer-info-card">

              <div className="officer-info-icon">
                ₹
              </div>

              <div>

                <strong>
                  DBT calculation
                </strong>

                <p>
                  Procurement payout is calculated using
                  the configured rate of ₹22.50 per kilogram.
                </p>

              </div>

            </div>


            <div
              id="officer-security"
              className="officer-info-card"
            >

              <div className="officer-info-icon">
                ✓
              </div>

              <div>

                <strong>
                  Verified workflow
                </strong>

                <p>
                  Only applications marked
                  <b> VAO Verified </b>
                  in your jurisdiction enter this queue.
                </p>

              </div>

            </div>

          </section>


          {/* SECURITY FOOTER */}

          <section className="officer-security-banner">

            <div className="officer-security-icon">
              ✓
            </div>

            <div>

              <strong>
                FarmFlow AI procurement system active
              </strong>

              <p>
                Verified farmer records, procurement
                scheduling and DBT processing are managed
                through the secure workflow.
              </p>

            </div>

            <div className="officer-system-status">
              <span></span>
              System active
            </div>

          </section>

        </div>

      </main>


      {/* DOCUMENT MODAL */}

      {modalImage && (

        <div
          className="officer-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalImage(null);
            }
          }}
        >

          <div className="officer-document-modal">

            <div className="officer-modal-header">

              <div>

                <div className="officer-modal-kicker">
                  VERIFIED DOCUMENT
                </div>

                <h3>
                  Signed Patta & Chitta Certificate
                </h3>

                <p>
                  Review the verified farmer document.
                </p>

              </div>

              <button
                className="officer-modal-close"
                onClick={() =>
                  setModalImage(null)
                }
                aria-label="Close preview"
              >
                ×
              </button>

            </div>


            <div className="officer-document-preview">

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

                <div className="officer-image-preview">

                  <img
                    src={modalImage}
                    alt="Patta Document"
                  />

                </div>

              )}

            </div>


            <div className="officer-modal-footer">

              <div className="officer-modal-note">
                <span>🔒</span>
                Signed certificate preview
              </div>

              <button
                className="officer-modal-close-btn"
                onClick={() =>
                  setModalImage(null)
                }
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

export default OfficerDashboard;