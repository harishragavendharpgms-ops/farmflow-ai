import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('farmers');
  
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'vao', zone: '', subPlace: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user') || sessionStorage.getItem('farmflow_user');
    if (!savedUser) { navigate('/login'); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const userSnap = await getDocs(collection(db, 'users'));
    setUsers(userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const orderSnap = await getDocs(collection(db, 'orders'));
    setOrders(orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users'), newUser);
      alert('User account created successfully with assigned zone & sub-place!');
      setNewUser({ name: '', email: '', password: '', role: 'vao', zone: '', subPlace: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteDoc(doc(db, 'users', id));
      fetchData();
    }
  };

  const handleLogout = () => {
    localStorage.clear(); sessionStorage.clear();
    navigate('/login');
  };

  const farmers = users.filter(u => u.role === 'farmer');
  const vaos = users.filter(u => u.role === 'vao');
  const officers = users.filter(u => u.role === 'officer');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ color: '#2c3e50', margin: 0 }}>👑 Admin Control Panel</h1>
          <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Manage segregated user roles, zones, and procurements.</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Log Out</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('create')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'create' ? '#2e7d32' : 'white', color: activeTab === 'create' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Create Account</button>
        <button onClick={() => setActiveTab('farmers')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'farmers' ? '#2e7d32' : 'white', color: activeTab === 'farmers' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🌾 Farmers ({farmers.length})</button>
        <button onClick={() => setActiveTab('vaos')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'vaos' ? '#2e7d32' : 'white', color: activeTab === 'vaos' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>📝 VAOs ({vaos.length})</button>
        <button onClick={() => setActiveTab('officers')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'officers' ? '#2e7d32' : 'white', color: activeTab === 'officers' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🛡️ Procurement Officers ({officers.length})</button>
        <button onClick={() => setActiveTab('orders')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'orders' ? '#2e7d32' : 'white', color: activeTab === 'orders' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>📦 All Orders ({orders.length})</button>
      </div>

      {activeTab === 'create' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '700px' }}>
          <h3 style={{ color: '#2c3e50', marginTop: 0 }}>Create Officer / VAO / Farmer Account</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <input type="text" placeholder="Full Name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <input type="email" placeholder="Email Address" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <input type="password" placeholder="Password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}>
              <option value="vao">VAO (Verification Officer)</option>
              <option value="officer">Procurement Officer</option>
              <option value="farmer">Farmer</option>
            </select>
            <input type="text" placeholder="Zone (e.g., Trichy)" required value={newUser.zone} onChange={e => setNewUser({...newUser, zone: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <input type="text" placeholder="Sub-Place / Village (e.g., Mandaiyur)" required value={newUser.subPlace} onChange={e => setNewUser({...newUser, subPlace: e.target.value})} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Create Account</button>
          </form>
        </div>
      )}

      {activeTab === 'farmers' && <UserTable title="Registered Farmers" list={farmers} onDelete={handleDeleteUser} />}
      {activeTab === 'vaos' && <UserTable title="Village Administrative Officers (VAOs)" list={vaos} onDelete={handleDeleteUser} showZone={true} />}
      {activeTab === 'officers' && <UserTable title="Procurement Officers" list={officers} onDelete={handleDeleteUser} showZone={true} />}

      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <h3 style={{ color: '#2c3e50', marginTop: 0 }}>All System Procurements</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>Farmer Email</th>
                <th style={{ padding: '10px' }}>Crop & Quantity</th>
                <th style={{ padding: '10px' }}>Zone / Sub-Place</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 10px' }}>{o.userEmail}</td>
                  <td style={{ padding: '12px 10px' }}><strong>{o.item}</strong> ({o.quantity}kg)</td>
                  <td style={{ padding: '12px 10px' }}>{o.zone} {o.subPlace ? `(${o.subPlace})` : ''}</td>
                  <td style={{ padding: '12px 10px' }}><span style={{ fontWeight: 'bold', color: '#1976d2' }}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const UserTable = ({ title, list, onDelete, showZone = false }) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
    <h3 style={{ color: '#2c3e50', marginTop: 0 }}>{title} ({list.length})</h3>
    {list.length === 0 ? (
      <p style={{ color: '#777', fontStyle: 'italic' }}>No users found in this category.</p>
    ) : (
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px' }}>Email</th>
            {showZone && <th style={{ padding: '10px' }}>Zone & Sub-Place</th>}
            <th style={{ padding: '10px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px 10px' }}><strong>{u.name}</strong></td>
              <td style={{ padding: '12px 10px', color: '#555' }}>{u.email}</td>
              {showZone && (
                <td style={{ padding: '12px 10px' }}>📍 {u.zone || 'None'} / <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{u.subPlace || 'General'}</span></td>
              )}
              <td style={{ padding: '12px 10px' }}>
                <button onClick={() => onDelete(u.id)} style={{ padding: '5px 10px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default AdminDashboard;