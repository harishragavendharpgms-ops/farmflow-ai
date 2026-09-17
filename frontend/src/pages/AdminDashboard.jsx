import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('farmers');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vao',
    zone: '',
    subPlace: ''
  });

  useEffect(() => {
    const savedUser =
      localStorage.getItem('farmflow_user') ||
      sessionStorage.getItem('farmflow_user');

    if (!savedUser) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

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

      setOrders(
        orderSnap.docs.map((orderDoc) => ({
          id: orderDoc.id,
          ...orderDoc.data()
        }))
      );
    } catch (error) {
      console.error('Error fetching admin data:', error);
      alert('Failed to load dashboard data.');
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

      alert(
        'User account created successfully in Firebase Auth & Firestore!'
      );

      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'vao',
        zone: '',
        subPlace: ''
      });

      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating user: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete user.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const farmers = users.filter((u) => u.role === 'farmer');
  const vaos = users.filter((u) => u.role === 'vao');
  const officers = users.filter((u) => u.role === 'officer');

  const pendingOrders = orders.filter(
    (order) => order.status === 'Pending VAO'
  );

  const verifiedOrders = orders.filter(
    (order) => order.status === 'VAO Verified'
  );

  const procuredOrders = orders.filter(
    (order) => order.status === 'Procured'
  );

  const navigationItems = [
    {
      id: 'farmers',
      icon: '🌾',
      label: 'Farmers',
      count: farmers.length
    },
    {
      id: 'vaos',
      icon: '🏛️',
      label: 'Local Revenue Admins',
      count: vaos.length
    },
    {
      id: 'officers',
      icon: '🛡️',
      label: 'Procurement Officers',
      count: officers.length
    },
    {
      id: 'orders',
      icon: '📦',
      label: 'All Orders',
      count: orders.length
    }
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-logo">🌱</div>

          <div>
            <h2>FarmFlow AI</h2>
            <span>Administration</span>
          </div>
        </div>

        <div className="sidebar-section-label">MAIN MENU</div>

        <nav className="admin-navigation">
          <button
            className={`sidebar-item ${
              activeTab === 'create' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('create')}
          >
            <span className="sidebar-icon">➕</span>
            <span>Create Account</span>
          </button>

          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${
                activeTab === item.id ? 'active' : ''
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>

              <span className="sidebar-label">{item.label}</span>

              <span className="sidebar-count">{item.count}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-sidebar-card">
            <div className="sidebar-card-icon">⚙️</div>

            <div>
              <strong>System Control</strong>
              <span>Administrative access</span>
            </div>
          </div>

          <button className="sidebar-logout" onClick={handleLogout}>
            <span>↪</span>
            Log Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="breadcrumb">
              FarmFlow AI <span>/</span> Administration
            </div>

            <h1>Admin Control Center</h1>

            <p>
              Manage users, administrative roles and procurement activity.
            </p>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">A</div>

            <div className="profile-details">
              <strong>System Administrator</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <section className="admin-stat-grid">
          <StatCard
            icon="👨‍🌾"
            label="Registered Farmers"
            value={farmers.length}
            detail="Active farmer accounts"
          />

          <StatCard
            icon="🏛️"
            label="Local Revenue Admins"
            value={vaos.length}
            detail="Verification administrators"
          />

          <StatCard
            icon="🛡️"
            label="Procurement Officers"
            value={officers.length}
            detail="Field procurement team"
          />

          <StatCard
            icon="📦"
            label="Total Orders"
            value={orders.length}
            detail="All procurement applications"
          />
        </section>

        <section className="admin-secondary-stats">
          <div className="mini-stat">
            <div className="mini-stat-icon pending">⏳</div>
            <div>
              <span>Pending Verification</span>
              <strong>{pendingOrders.length}</strong>
            </div>
          </div>

          <div className="mini-stat">
            <div className="mini-stat-icon verified">✓</div>
            <div>
              <span>VAO Verified</span>
              <strong>{verifiedOrders.length}</strong>
            </div>
          </div>

          <div className="mini-stat">
            <div className="mini-stat-icon procured">📦</div>
            <div>
              <span>Completed Procurement</span>
              <strong>{procuredOrders.length}</strong>
            </div>
          </div>
        </section>

        <div className="admin-content">
          {activeTab === 'create' && (
            <CreateAccountSection
              newUser={newUser}
              setNewUser={setNewUser}
              handleCreateUser={handleCreateUser}
              isSubmitting={isSubmitting}
            />
          )}

          {activeTab === 'farmers' && (
            <UserTable
              title="Registered Farmers"
              subtitle="All farmer accounts currently registered in FarmFlow AI."
              list={farmers}
              onDelete={handleDeleteUser}
              icon="🌾"
            />
          )}

          {activeTab === 'vaos' && (
            <UserTable
              title="Local Revenue Administrators"
              subtitle="Officials responsible for local application verification."
              list={vaos}
              onDelete={handleDeleteUser}
              showZone={true}
              icon="🏛️"
            />
          )}

          {activeTab === 'officers' && (
            <UserTable
              title="Procurement Officers"
              subtitle="Officers responsible for procurement operations."
              list={officers}
              onDelete={handleDeleteUser}
              showZone={true}
              icon="🛡️"
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTable orders={orders} />
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, detail }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>

        <span className="stat-live">
          <span></span>
          Live
        </span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-label">{label}</div>

      <div className="stat-detail">{detail}</div>
    </div>
  );
};

const CreateAccountSection = ({
  newUser,
  setNewUser,
  handleCreateUser,
  isSubmitting
}) => {
  return (
    <section className="content-card create-account-card">
      <div className="content-card-header">
        <div className="section-heading">
          <div className="section-heading-icon">➕</div>

          <div>
            <h2>Create New Account</h2>
            <p>
              Add a Farmer, Local Revenue Administrator or Procurement Officer.
            </p>
          </div>
        </div>
      </div>

      <form className="create-form" onSubmit={handleCreateUser}>
        <div className="form-section-title">
          <span>01</span>
          Personal Information
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>

            <div className="input-wrapper">
              <span>👤</span>

              <input
                type="text"
                placeholder="Enter full name"
                required
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    name: e.target.value
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>

            <div className="input-wrapper">
              <span>✉️</span>

              <input
                type="email"
                placeholder="Enter email address"
                required
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    email: e.target.value
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="input-wrapper">
              <span>🔒</span>

              <input
                type="password"
                placeholder="Create secure password"
                required
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    password: e.target.value
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="form-section-title second">
          <span>02</span>
          Role & Jurisdiction
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Account Role</label>

            <div className="input-wrapper">
              <span>🛡️</span>

              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    role: e.target.value
                  })
                }
              >
                <option value="vao">
                  Local Revenue Administrator
                </option>

                <option value="officer">
                  Procurement Officer
                </option>

                <option value="farmer">Farmer</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Zone</label>

            <div className="input-wrapper">
              <span>📍</span>

              <input
                type="text"
                placeholder="e.g. Trichy"
                required
                value={newUser.zone}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    zone: e.target.value
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Sub-Place / Village
              <small>Optional</small>
            </label>

            <div className="input-wrapper">
              <span>🏘️</span>

              <input
                type="text"
                placeholder="Enter village or sub-place"
                value={newUser.subPlace}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    subPlace: e.target.value
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="form-footer">
          <div className="form-security-note">
            <span>🔐</span>

            <div>
              <strong>Secure account creation</strong>
              <p>
                Account credentials are securely registered through Firebase.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="create-account-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                Creating...
              </>
            ) : (
              <>
                Create Account
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

const UserTable = ({
  title,
  subtitle,
  list,
  onDelete,
  showZone = false,
  icon
}) => {
  return (
    <section className="content-card table-card">
      <div className="content-card-header">
        <div className="section-heading">
          <div className="section-heading-icon">{icon}</div>

          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="record-count">
          {list.length} <span>records</span>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>

          <h3>No users found</h3>

          <p>
            There are currently no users in this category.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>

                {showZone && (
                  <th>Zone & Sub-Place</th>
                )}

                <th>Account</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {u.name
                          ? u.name.charAt(0).toUpperCase()
                          : 'U'}
                      </div>

                      <div>
                        <strong>{u.name || 'Unnamed User'}</strong>
                        <span>User ID: {u.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="email-cell">
                      {u.email}
                    </span>
                  </td>

                  {showZone && (
                    <td>
                      <div className="location-cell">
                        <strong>{u.zone || 'None'}</strong>

                        <span>
                          {u.subPlace || 'General'}
                        </span>
                      </div>
                    </td>
                  )}

                  <td>
                    <span className="active-badge">
                      <span></span>
                      Active
                    </span>
                  </td>

                  <td>
                    <button
                      className="delete-button"
                      onClick={() => onDelete(u.id)}
                    >
                      <span>🗑️</span>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const OrdersTable = ({ orders }) => {
  const getStatusClass = (status) => {
    if (status === 'Procured') return 'status-procured';
    if (status === 'VAO Verified') return 'status-verified';
    if (status === 'Pending VAO') return 'status-pending';

    return 'status-default';
  };

  return (
    <section className="content-card table-card">
      <div className="content-card-header">
        <div className="section-heading">
          <div className="section-heading-icon">📦</div>

          <div>
            <h2>All System Procurements</h2>
            <p>
              Complete overview of procurement applications across the system.
            </p>
          </div>
        </div>

        <div className="record-count">
          {orders.length} <span>orders</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>

          <h3>No orders found</h3>

          <p>
            Procurement applications will appear here.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table orders-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Crop & Quantity</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="farmer-order-cell">
                      <strong>
                        {o.userName || 'Farmer'}
                      </strong>

                      <span>{o.userEmail || 'No email'}</span>
                    </div>
                  </td>

                  <td>
                    <div className="crop-cell">
                      <strong>{o.item || 'Unknown Crop'}</strong>

                      <span>
                        {o.quantity || 0} kg
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="location-cell">
                      <strong>
                        {o.zone || 'No Zone'}
                      </strong>

                      <span>
                        {o.subPlace || 'General'}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`order-status ${getStatusClass(
                        o.status
                      )}`}
                    >
                      <span></span>
                      {o.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminDashboard;