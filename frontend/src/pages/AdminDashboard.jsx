import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state for users (farmers, officers, vaos)
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Hover states for visual analytics
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredPie, setHoveredPie] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vao',
    zone: '',
    subPlace: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userSnap = await getDocs(collection(db, 'users'));
      setUsers(
        userSnap.docs.map((userDoc) => ({
          id: userDoc.id,
          ...userDoc.data()
        }))
      );

      const orderSnap = await getDocs(collection(db, 'orders'));
      const ordersList = orderSnap.docs.map((orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data()
      }));

      ordersList.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email.trim().toLowerCase(),
        newUser.password
      );

      const user = userCredential.user;
      const userProfile = {
        uid: user.uid,
        name: newUser.name,
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        zone: newUser.zone || '',
        subPlace: newUser.subPlace || 'General',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      alert(`User account (${newUser.role.toUpperCase()}) created successfully!`);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'vao',
        zone: '',
        subPlace: ''
      });
      fetchData();
      if (newUser.role === 'vao') setActiveTab('vaos');
      else if (newUser.role === 'officer') setActiveTab('officers');
      else setActiveTab('farmers');
    } catch (err) {
      console.error(err);
      alert('Error creating user: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (window.confirm(`Are you sure you want to delete user account "${userName || id}"?`)) {
      try {
        await deleteDoc(doc(db, 'users', id));
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete user.');
      }
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'farmer',
      zone: user.zone || '',
      subPlace: user.subPlace || ''
    });
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingUser(true);
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        name: editingUser.name.trim(),
        phone: editingUser.phone.trim(),
        role: editingUser.role,
        zone: editingUser.zone.trim(),
        subPlace: editingUser.subPlace.trim()
      });
      alert('User details updated successfully!');
      setEditingUser(null);
      fetchData();
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user: ' + err.message);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm(`Are you sure you want to remove procurement order ID: ${id}?`)) {
      try {
        await deleteDoc(doc(db, 'orders', id));
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete order.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

  // Real user categorizations from Firestore
  const farmers = useMemo(() => users.filter((u) => u.role === 'farmer'), [users]);
  const vaos = useMemo(() => users.filter((u) => u.role === 'vao'), [users]);
  const officers = useMemo(
    () => users.filter((u) => u.role === 'officer' || u.role === 'operator'),
    [users]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'Pending VAO'),
    [orders]
  );
  const verifiedOrders = useMemo(
    () => orders.filter((o) => o.status === 'VAO Verified'),
    [orders]
  );
  const procuredOrders = useMemo(
    () => orders.filter((o) => o.status === 'Procured'),
    [orders]
  );

  // Filtered lists for search
  const filteredFarmers = useMemo(() => {
    if (!searchTerm) return farmers;
    const term = searchTerm.toLowerCase();
    return farmers.filter(
      (f) =>
        f.name?.toLowerCase().includes(term) ||
        f.email?.toLowerCase().includes(term) ||
        f.zone?.toLowerCase().includes(term) ||
        f.phone?.includes(term)
    );
  }, [farmers, searchTerm]);

  const filteredVaos = useMemo(() => {
    if (!searchTerm) return vaos;
    const term = searchTerm.toLowerCase();
    return vaos.filter(
      (v) =>
        v.name?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term) ||
        v.zone?.toLowerCase().includes(term) ||
        v.subPlace?.toLowerCase().includes(term)
    );
  }, [vaos, searchTerm]);

  const filteredOfficers = useMemo(() => {
    if (!searchTerm) return officers;
    const term = searchTerm.toLowerCase();
    return officers.filter(
      (o) =>
        o.name?.toLowerCase().includes(term) ||
        o.email?.toLowerCase().includes(term) ||
        o.zone?.toLowerCase().includes(term) ||
        o.subPlace?.toLowerCase().includes(term)
    );
  }, [officers, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.userName?.toLowerCase().includes(term) ||
        o.item?.toLowerCase().includes(term) ||
        o.id?.toLowerCase().includes(term) ||
        o.zone?.toLowerCase().includes(term) ||
        o.vaoSignatureDetails?.name?.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  return (
    <div className="v-adm-shell">
      {/* SIDEBAR */}
      <aside className="v-adm-sidebar">
        <div className="v-adm-brand">
          <span className="v-adm-leaf">🌱</span>
          <div>
            <strong>FarmFlow <span>AI</span></strong>
            <small>ADMIN CONSOLE</small>
          </div>
        </div>

        <div className="v-adm-menu-label">MAIN NAVIGATION</div>

        <nav className="v-adm-nav">
          <button
            type="button"
            className={`v-adm-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSearchTerm(''); }}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`v-adm-nav-btn ${activeTab === 'farmers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('farmers'); setSearchTerm(''); }}
          >
            <span>🌾</span>
            <span>Farmers</span>
            <span className="v-nav-badge">{farmers.length}</span>
          </button>

          <button
            type="button"
            className={`v-adm-nav-btn ${activeTab === 'vaos' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vaos'); setSearchTerm(''); }}
          >
            <span>🏛️</span>
            <span>Revenue Admins (VAO)</span>
            <span className="v-nav-badge highlight">{vaos.length}</span>
          </button>

          <button
            type="button"
            className={`v-adm-nav-btn ${activeTab === 'officers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('officers'); setSearchTerm(''); }}
          >
            <span>🛡️</span>
            <span>Procurement Officers</span>
            <span className="v-nav-badge">{officers.length}</span>
          </button>

          <button
            type="button"
            className={`v-adm-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
          >
            <span>📦</span>
            <span>All Procurements</span>
            <span className="v-nav-badge">{orders.length}</span>
          </button>

          <button
            type="button"
            className={`v-adm-nav-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveTab('create'); setSearchTerm(''); }}
          >
            <span>➕</span>
            <span>Add User</span>
          </button>
        </nav>

        <div className="v-adm-sidebar-bottom">
          <div className="v-admin-badge-footer">
            <div className="v-admin-avatar">A</div>
            <div>
              <strong>Super Administrator</strong>
              <small>All Permissions Active</small>
            </div>
          </div>
          <button type="button" className="v-adm-bottom-btn v-adm-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="v-adm-main">
        {/* TOP BAR */}
        <header className="v-adm-topbar">
          <div className="v-adm-topbar-left">
            <span className="topbar-logo-text">FarmFlow AI Administration Portal</span>
          </div>

          <div className="v-adm-topbar-right">
            <div className="v-admin-user-pill">
              <span className="v-dollar-icon">🛡️</span>
              <span>System Administrator</span>
            </div>
          </div>
        </header>

        {/* ========================================================
            TAB 1: SYSTEM OVERVIEW & CHARTS
            ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="v-adm-content">
            <div className="v-adm-page-header">
              <h1>System Overview</h1>
              <p>Real-time statistics across farmers, revenue administration, and mandi procurement centres.</p>
            </div>

            {/* 5 KPI Stat Cards */}
            <div className="v-adm-stat-cards-row">
              <div className="v-adm-stat-card bar-green" onClick={() => setActiveTab('farmers')} style={{ cursor: 'pointer' }}>
                <small>Total Farmers</small>
                <h2>{farmers.length}</h2>
                <div className="v-stat-sub">Registered across zones</div>
              </div>

              <div className="v-adm-stat-card bar-blue" onClick={() => setActiveTab('vaos')} style={{ cursor: 'pointer' }}>
                <small>Revenue Admins (VAO)</small>
                <h2>{vaos.length}</h2>
                <div className="v-stat-sub">Jurisdiction officers</div>
              </div>

              <div className="v-adm-stat-card bar-purple" onClick={() => setActiveTab('officers')} style={{ cursor: 'pointer' }}>
                <small>Procurement Officers</small>
                <h2>{officers.length}</h2>
                <div className="v-stat-sub">Mandi field staff</div>
              </div>

              <div className="v-adm-stat-card bar-yellow" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
                <small>Pending VAO Review</small>
                <h2>{pendingOrders.length}</h2>
                <div className="v-stat-sub">Awaiting verification</div>
              </div>

              <div className="v-adm-stat-card bar-pink" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
                <small>Total Procurements</small>
                <h2>{orders.length}</h2>
                <div className="v-stat-sub">{procuredOrders.length} fully procured</div>
              </div>
            </div>

            {/* Analytics Row: Bar Chart & Donut Chart */}
            <div className="v-adm-charts-grid">
              {/* Chart 1: Procurement by Centre */}
              <div className="v-adm-chart-card">
                <div className="v-chart-card-head">
                  <h4>Procurement Volume by Centre (Current Week)</h4>
                </div>

                <div className="v-barchart-container">
                  <div className="v-barchart-legend">
                    <span><i className="sq-green" /> Grade A (Quintals)</span>
                    <span><i className="sq-blue" /> Grade B (Quintals)</span>
                  </div>

                  <div className="v-svg-barchart">
                    {[
                      { name: 'Trichy Central', a: 420, b: 260 },
                      { name: 'Lalgudi Mandi', a: 310, b: 380 },
                      { name: 'Manapparai Centre', a: 220, b: 490 },
                      { name: 'Thuraiyur APMC', a: 350, b: 410 }
                    ].map((centre) => (
                      <div
                        key={centre.name}
                        className="v-barchart-col"
                        onMouseEnter={() => setHoveredBar(centre)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div className="v-bars-wrapper">
                          <div
                            className="v-bar bar-grade-a"
                            style={{ height: `${(centre.a / 600) * 150}px` }}
                          />
                          <div
                            className="v-bar bar-grade-b"
                            style={{ height: `${(centre.b / 600) * 150}px` }}
                          />
                        </div>
                        <span className="v-bar-label">{centre.name}</span>

                        {hoveredBar?.name === centre.name && (
                          <div className="v-bar-tooltip">
                            <strong>{centre.name}</strong>
                            <div>Grade A: {centre.a} Qtl</div>
                            <div>Grade B: {centre.b} Qtl</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart 2: Crop Distribution Donut Chart */}
              <div className="v-adm-chart-card">
                <div className="v-chart-card-head">
                  <h4>Crop Distribution (Active Mandi Intake)</h4>
                </div>

                <div className="v-piechart-container">
                  <svg viewBox="0 0 200 200" width="220" height="220" className="v-pie-svg">
                    <path
                      d="M 100 100 L 100 10 A 90 90 0 0 1 179.3 142.3 Z"
                      fill="#10b981"
                      className="pie-slice"
                      onMouseEnter={() => setHoveredPie({ crop: 'Paddy', percent: '35%', qty: '420 Qtl' })}
                      onMouseLeave={() => setHoveredPie(null)}
                    />
                    <path
                      d="M 100 100 L 179.3 142.3 A 90 90 0 0 1 56.4 180.2 Z"
                      fill="#f59e0b"
                      className="pie-slice"
                      onMouseEnter={() => setHoveredPie({ crop: 'Wheat', percent: '25%', qty: '300 Qtl' })}
                      onMouseLeave={() => setHoveredPie(null)}
                    />
                    <path
                      d="M 100 100 L 56.4 180.2 A 90 90 0 0 1 20.7 57.7 Z"
                      fill="#3b82f6"
                      className="pie-slice"
                      onMouseEnter={() => setHoveredPie({ crop: 'Maize', percent: '22%', qty: '264 Qtl' })}
                      onMouseLeave={() => setHoveredPie(null)}
                    />
                    <path
                      d="M 100 100 L 20.7 57.7 A 90 90 0 0 1 100 10 Z"
                      fill="#8b5cf6"
                      className="pie-slice"
                      onMouseEnter={() => setHoveredPie({ crop: 'Cotton', percent: '18%', qty: '216 Qtl' })}
                      onMouseLeave={() => setHoveredPie(null)}
                    />
                    <circle cx="100" cy="100" r="32" fill="#ffffff" />
                  </svg>

                  <div className="v-pie-legend">
                    <div><span style={{ background: '#10b981' }} /> Paddy 35%</div>
                    <div><span style={{ background: '#f59e0b' }} /> Wheat 25%</div>
                    <div><span style={{ background: '#3b82f6' }} /> Maize 22%</div>
                    <div><span style={{ background: '#8b5cf6' }} /> Cotton 18%</div>
                  </div>

                  {hoveredPie && (
                    <div className="v-pie-tooltip-box">
                      <strong>{hoveredPie.crop}: {hoveredPie.percent}</strong>
                      <small>{hoveredPie.qty}</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: LOCAL REVENUE ADMINISTRATORS (VAO)
            ======================================================== */}
        {activeTab === 'vaos' && (
          <div className="v-adm-content">
            <div className="v-adm-page-header-row">
              <div className="v-adm-page-header">
                <h1>Local Revenue Administrators (VAO)</h1>
                <p>Village Administrative Officers assigned to verify farmer land records and Patta/Chitta.</p>
              </div>

              <div className="v-adm-actions-bar">
                <div className="v-adm-search-input">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search VAO by name, email, or zone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button onClick={() => setSearchTerm('')}>×</button>}
                </div>
                <button
                  type="button"
                  className="v-btn-green-sm"
                  onClick={() => { setNewUser({ ...newUser, role: 'vao' }); setActiveTab('create'); }}
                >
                  ➕ Add VAO Account
                </button>
              </div>
            </div>

            <div className="v-adm-table-card">
              <div className="v-table-responsive">
                <table className="v-clean-table v-adm-table">
                  <thead>
                    <tr>
                      <th>OFFICER NAME</th>
                      <th>EMAIL ADDRESS</th>
                      <th>JURISDICTION ZONE</th>
                      <th>SUB-PLACE / VILLAGE</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVaos.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="v-empty-table-cell">
                          <div className="v-empty-table-box">
                            <span className="v-empty-emoji">🏛️</span>
                            <strong>No Local Revenue Administrators Found</strong>
                            <p>
                              {searchTerm
                                ? 'No VAO accounts match your search query.'
                                : 'No VAO officer accounts have been registered yet.'}
                            </p>
                            <button
                              type="button"
                              className="v-btn-green-sm"
                              onClick={() => { setNewUser({ ...newUser, role: 'vao' }); setActiveTab('create'); }}
                            >
                              Provision VAO Account
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredVaos.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <div className="v-user-cell">
                              <div className="v-avatar-circle v-avatar-purple">
                                {(v.name || 'V').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{v.name || 'Unnamed VAO'}</strong>
                                <small>ID: {v.id.slice(0, 8)}...</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="v-email-text">{v.email}</span>
                          </td>
                          <td>
                            <span className="v-zone-chip">
                              📍 {v.zone || 'Unassigned'}
                            </span>
                          </td>
                          <td>
                            <span className="v-subplace-chip">
                              🏘️ {v.subPlace || 'General'}
                            </span>
                          </td>
                          <td>
                            <span className="pill-badge pill-badge-green">Active Officer</span>
                          </td>
                          <td>
                            <div className="v-action-buttons-group">
                              <button
                                type="button"
                                className="v-btn-op-action edit"
                                onClick={() => handleOpenEditUser(v)}
                                title="Edit VAO Account"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="v-btn-op-action revoke"
                                onClick={() => handleDeleteUser(v.id, v.name)}
                                title="Delete VAO Account"
                              >
                                Delete
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
        )}

        {/* ========================================================
            TAB 3: PROCUREMENT OFFICERS
            ======================================================== */}
        {activeTab === 'officers' && (
          <div className="v-adm-content">
            <div className="v-adm-page-header-row">
              <div className="v-adm-page-header">
                <h1>Procurement Officers</h1>
                <p>Mandi and APMC field officers responsible for token intake, physical inspection, and DBT.</p>
              </div>

              <div className="v-adm-actions-bar">
                <div className="v-adm-search-input">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search officer by name, email, or mandi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button onClick={() => setSearchTerm('')}>×</button>}
                </div>
                <button
                  type="button"
                  className="v-btn-green-sm"
                  onClick={() => { setNewUser({ ...newUser, role: 'officer' }); setActiveTab('create'); }}
                >
                  ➕ Add Officer Account
                </button>
              </div>
            </div>

            <div className="v-adm-table-card">
              <div className="v-table-responsive">
                <table className="v-clean-table v-adm-table">
                  <thead>
                    <tr>
                      <th>OFFICER NAME</th>
                      <th>EMAIL ADDRESS</th>
                      <th>ASSIGNED ZONE</th>
                      <th>MANDI / CENTRE</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfficers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="v-empty-table-cell">
                          <div className="v-empty-table-box">
                            <span className="v-empty-emoji">🛡️</span>
                            <strong>No Procurement Officers Found</strong>
                            <p>
                              {searchTerm
                                ? 'No officer accounts match your search query.'
                                : 'No procurement officers registered yet in your system.'}
                            </p>
                            <button
                              type="button"
                              className="v-btn-green-sm"
                              onClick={() => { setNewUser({ ...newUser, role: 'officer' }); setActiveTab('create'); }}
                            >
                              Provision Officer Account
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOfficers.map((op) => (
                        <tr key={op.id}>
                          <td>
                            <div className="v-user-cell">
                              <div className="v-avatar-circle v-avatar-blue">
                                {(op.name || 'O').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{op.name || 'Unnamed Officer'}</strong>
                                <small>ID: {op.id.slice(0, 8)}...</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="v-email-text">{op.email}</span>
                          </td>
                          <td>
                            <span className="v-zone-chip">
                              📍 {op.zone || 'General'}
                            </span>
                          </td>
                          <td>
                            <span className="v-subplace-chip">
                              🏢 {op.subPlace || 'Main APMC Yard'}
                            </span>
                          </td>
                          <td>
                            <span className="pill-badge pill-badge-green">Active Officer</span>
                          </td>
                          <td>
                            <div className="v-action-buttons-group">
                              <button
                                type="button"
                                className="v-btn-op-action edit"
                                onClick={() => handleOpenEditUser(op)}
                                title="Edit Officer Account"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="v-btn-op-action revoke"
                                onClick={() => handleDeleteUser(op.id, op.name)}
                                title="Delete Officer Account"
                              >
                                Delete
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
        )}

        {/* ========================================================
            TAB 4: FARMERS LIST
            ======================================================== */}
        {activeTab === 'farmers' && (
          <div className="v-adm-content">
            <div className="v-adm-page-header-row">
              <div className="v-adm-page-header">
                <h1>Registered Farmers</h1>
                <p>Active farmers across procurement zones with linked land and crops.</p>
              </div>

              <div className="v-adm-actions-bar">
                <div className="v-adm-search-input">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search farmer by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button onClick={() => setSearchTerm('')}>×</button>}
                </div>
              </div>
            </div>

            <div className="v-adm-table-card">
              <div className="v-table-responsive">
                <table className="v-clean-table v-adm-table">
                  <thead>
                    <tr>
                      <th>FARMER NAME</th>
                      <th>EMAIL ADDRESS</th>
                      <th>CONTACT PHONE</th>
                      <th>ZONE & SUB-PLACE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFarmers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="v-empty-table-cell">
                          <div className="v-empty-table-box">
                            <span className="v-empty-emoji">🌾</span>
                            <strong>No Farmers Registered</strong>
                            <p>Farmers who register on FarmFlow AI will appear in this directory.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFarmers.map((farmer) => (
                        <tr key={farmer.id}>
                          <td>
                            <div className="v-user-cell">
                              <div className="v-avatar-circle v-avatar-green">
                                {(farmer.name || 'F').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{farmer.name || 'Registered Farmer'}</strong>
                                <small>UID: {farmer.id.slice(0, 8)}...</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="v-email-text">{farmer.email || 'N/A'}</span>
                          </td>
                          <td>
                            <span className="v-phone-text">📞 {farmer.phone || 'N/A'}</span>
                          </td>
                          <td>
                            <span className="v-zone-chip">
                              📍 {farmer.zone || 'General'} {farmer.subPlace ? `• ${farmer.subPlace}` : ''}
                            </span>
                          </td>
                          <td>
                            <div className="v-action-buttons-group">
                              <button
                                type="button"
                                className="v-btn-op-action edit"
                                onClick={() => handleOpenEditUser(farmer)}
                                title="Edit Farmer Account"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="v-btn-op-action revoke"
                                onClick={() => handleDeleteUser(farmer.id, farmer.name)}
                                title="Delete Farmer Account"
                              >
                                Delete
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
        )}

        {/* ========================================================
            TAB 5: ALL ORDERS & PROCUREMENTS (WITH VAO COLUMN)
            ======================================================== */}
        {activeTab === 'orders' && (
          <div className="v-adm-content">
            <div className="v-adm-page-header-row">
              <div className="v-adm-page-header">
                <h1>All System Procurements</h1>
                <p>Complete lifecycle overview of farmer bookings, VAO verifications, and mandi procurements.</p>
              </div>

              <div className="v-adm-actions-bar">
                <div className="v-adm-search-input">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search by farmer, crop, ID, or VAO..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button onClick={() => setSearchTerm('')}>×</button>}
                </div>
              </div>
            </div>

            <div className="v-adm-table-card">
              <div className="v-table-responsive">
                <table className="v-clean-table v-adm-table">
                  <thead>
                    <tr>
                      <th>APPLICATION ID & FARMER</th>
                      <th>CROP & QUANTITY</th>
                      <th>MANDI / LOCATION</th>
                      <th style={{ minWidth: '200px' }}>VAO VERIFICATION STATUS</th>
                      <th>OVERALL STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="v-empty-table-cell">
                          <div className="v-empty-table-box">
                            <span className="v-empty-emoji">📦</span>
                            <strong>No Procurement Orders Found</strong>
                            <p>Orders submitted by farmers will be displayed here in real time.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const isVaoVerified = o.status === 'VAO Verified' || o.status === 'Procured' || Boolean(o.vaoSignatureDetails);
                        const vaoOfficer = o.vaoSignatureDetails?.name || (isVaoVerified ? 'Assigned VAO' : null);
                        const vaoDate = o.vaoSignatureDetails?.date;

                        return (
                          <tr key={o.id}>
                            <td>
                              <div className="v-order-farmer-cell">
                                <strong>{o.userName || 'Farmer'}</strong>
                                <small>App ID: {o.id.slice(0, 10)}</small>
                                <span className="v-email-text">{o.userEmail || o.userPhone || ''}</span>
                              </div>
                            </td>
                            <td>
                              <div className="v-crop-info-cell">
                                <span className="v-crop-name-pill">🌾 {o.item || 'Crop'}</span>
                                <b>{o.quantity || 0} kg</b>
                              </div>
                            </td>
                            <td>
                              <span className="v-zone-chip">
                                📍 {o.zone || 'No Zone'} {o.subPlace ? `• ${o.subPlace}` : ''}
                              </span>
                            </td>
                            {/* VAO COLUMN: Never empty */}
                            <td>
                              {isVaoVerified ? (
                                <div className="v-vao-verified-box">
                                  <div className="v-vao-verified-tag">
                                    <span>✓</span> Verified by {vaoOfficer}
                                  </div>
                                  {vaODate && <small className="v-vao-date">On {vaODate}</small>}
                                  {o.pattaChitta && <small className="v-patta-chip">Patta: {o.pattaChitta}</small>}
                                </div>
                              ) : o.status === 'Pending VAO' ? (
                                <div className="v-vao-pending-box">
                                  <span className="pill-badge pill-badge-yellow">⏳ Pending VAO Review</span>
                                  <small className="v-vao-hint">Zone: {o.zone || 'Local'}</small>
                                </div>
                              ) : (
                                <span className="v-text-muted">Awaiting VAO Action</span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`pill-badge ${
                                  o.status === 'Procured'
                                    ? 'pill-badge-green'
                                    : o.status === 'VAO Verified'
                                    ? 'pill-badge-blue'
                                    : 'pill-badge-yellow'
                                }`}
                              >
                                {o.status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="v-btn-op-action revoke"
                                onClick={() => handleDeleteOrder(o.id)}
                                title="Delete Order"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: ADD USER FORM
            ======================================================== */}
        {activeTab === 'create' && (
          <div className="v-adm-content">
            <div className="v-adm-page-header">
              <h1>Provision User Account</h1>
              <p>Create credentials for Local Revenue Administrators (VAO), Procurement Officers, or Farmers.</p>
            </div>

            <div className="v-adm-form-card">
              <form onSubmit={handleCreateUser}>
                <div className="v-adm-form-grid">
                  <div className="v-form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@farmflow.gov.in"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Assigned System Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="vao">🏛️ Local Revenue Administrator (VAO)</option>
                      <option value="officer">🛡️ Procurement Officer / Mandi Staff</option>
                      <option value="farmer">🌾 Farmer</option>
                    </select>
                  </div>

                  <div className="v-form-field">
                    <label>Jurisdiction District / Zone</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Trichy"
                      value={newUser.zone}
                      onChange={(e) => setNewUser({ ...newUser, zone: e.target.value })}
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Sub-Place / Village / Mandi Yard</label>
                    <input
                      type="text"
                      placeholder="e.g. Lalgudi Central / APMC #402"
                      value={newUser.subPlace}
                      onChange={(e) => setNewUser({ ...newUser, subPlace: e.target.value })}
                    />
                  </div>
                </div>

                <div className="v-form-footer-action">
                  <div className="v-security-note">
                    <span>🔐</span>
                    <div>
                      <strong>Encrypted Firebase Security</strong>
                      <small>User will be authenticated via Firebase Auth and registered in Firestore.</small>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="v-btn-green-step"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Provision User Account ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {editingUser && (
          <div
            className="v-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingUser(null);
            }}
          >
            <div className="v-edit-modal-card">
              <div className="v-edit-modal-header">
                <div>
                  <small className="v-edit-kicker">USER MANAGEMENT CONSOLE</small>
                  <h3>Edit User Account Details</h3>
                </div>
                <button
                  type="button"
                  className="v-modal-close-btn"
                  onClick={() => setEditingUser(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveUserEdit} className="v-edit-modal-form">
                <div className="v-form-grid-2">
                  <div className="v-form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingUser.name}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Email Address (Account ID)</label>
                    <input
                      type="email"
                      disabled
                      value={editingUser.email}
                      title="Account email is managed by Firebase Auth"
                      style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Contact Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={editingUser.phone}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="v-form-field">
                    <label>System Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                    >
                      <option value="farmer">🌾 Farmer</option>
                      <option value="vao">🏛️ Local Revenue Administrator (VAO)</option>
                      <option value="officer">🛡️ Procurement Officer</option>
                    </select>
                  </div>

                  <div className="v-form-field">
                    <label>Jurisdiction District / Zone</label>
                    <input
                      type="text"
                      placeholder="e.g. Trichy"
                      value={editingUser.zone}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, zone: e.target.value })
                      }
                    />
                  </div>

                  <div className="v-form-field">
                    <label>Sub-Place / Village / Mandi Centre</label>
                    <input
                      type="text"
                      placeholder="e.g. Lalgudi Central / APMC Yard #4"
                      value={editingUser.subPlace}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, subPlace: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="v-edit-modal-footer">
                  <button
                    type="button"
                    className="v-btn-modal-cancel"
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="v-btn-modal-save"
                    disabled={isUpdatingUser}
                  >
                    {isUpdatingUser ? 'Saving Changes...' : 'Save Changes ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;