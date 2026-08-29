import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('farmer');
  const [userZone, setUserZone] = useState('');
  
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const officers = usersList.filter(user => user.role === 'officer');
  const vaos = usersList.filter(user => user.role === 'vao');
  const farmers = usersList.filter(user => user.role !== 'officer' && user.role !== 'vao');

  const handleLogout = () => { localStorage.removeItem('farmflow_user'); sessionStorage.removeItem('farmflow_user'); navigate('/login'); };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'users'), where('email', '==', userEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) return alert('Email already exists!');

      await addDoc(collection(db, 'users'), {
        name: userName.trim(), email: userEmail.trim().toLowerCase(), password: userPassword, 
        role: userRole, zone: (userRole === 'officer' || userRole === 'vao') ? userZone.trim() : '',
        createdAt: new Date().toISOString()
      });
      alert(`User created successfully!`);
      setUserName(''); setUserEmail(''); setUserPassword(''); setUserZone('');
    } catch (error) { alert("Failed to create account."); }
  };

  const deleteUser = async (id, name) => {
    if (window.confirm(`Delete ${name}?`)) await deleteDoc(doc(db, 'users', id));
  };

  const renderTable = (title, data, color) => (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
      <h3 style={{ color: color, marginTop: 0 }}>{title} ({data.length})</h3>
      {data.length === 0 ? <p>No users found.</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #eee' }}><th>Name</th><th>Email</th><th>Zone</th><th>Actions</th></tr></thead>
          <tbody>
            {data.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{u.name}</td><td style={{ padding: '10px' }}>{u.email}</td><td style={{ padding: '10px' }}>{u.zone || '-'}</td>
                <td style={{ padding: '10px' }}><button onClick={() => deleteUser(u.id, u.name)} style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '40px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>🛡️ Admin Panel</h1><button onClick={handleLogout} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', marginBottom: '30px', maxWidth: '500px' }}>
        <h3 style={{ marginTop: 0 }}>Create User Account</h3>
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" required placeholder="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc' }} />
          <input type="email" required placeholder="Email Address" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc' }} />
          <select value={userRole} onChange={(e) => setUserRole(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc' }}>
            <option value="farmer">Farmer (User)</option>
            <option value="officer">Procurement Officer</option>
            <option value="vao">VAO (Verification Officer)</option>
          </select>
          {(userRole === 'officer' || userRole === 'vao') && <input type="text" required placeholder="Assigned Zone" value={userZone} onChange={(e) => setUserZone(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc' }} />}
          <input type="password" required placeholder="Password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '12px', background: '#2e7d32', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Create Account</button>
        </form>
      </div>

      {renderTable('Manage VAOs', vaos, '#9c27b0')}
      {renderTable('Manage Officers', officers, '#1976d2')}
      {renderTable('Manage Farmers', farmers, '#2e7d32')}
    </div>
  );
};
export default AdminDashboard;