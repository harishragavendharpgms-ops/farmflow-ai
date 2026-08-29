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
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(users);
    }, (error) => {
      console.error("Firestore read error:", error);
    });
    return () => unsubscribe();
  }, []);

  const officers = usersList.filter(user => user.role === 'officer');
  const farmers = usersList.filter(user => user.role !== 'officer');

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'users'), where('email', '==', userEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('An account with this email already exists!');
        return;
      }

      await addDoc(collection(db, 'users'), {
        name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        password: userPassword, 
        role: userRole,
        zone: userRole === 'officer' ? userZone.trim() : '',
        createdAt: new Date().toISOString()
      });
      
      alert(`${userRole === 'officer' ? 'Officer' : 'Farmer'} ${userName} successfully created!`);
      setUserName(''); setUserEmail(''); setUserPassword(''); setUserZone('');
    } catch (error) {
      console.error("Error creating user: ", error);
      alert("Failed to create account. Check console logs.");
    }
  };

  const deleteUser = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Error deleting user: ", error);
        alert("Failed to delete user.");
      }
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        name: editingUser.name,
        email: editingUser.email.toLowerCase(),
        role: editingUser.role,
        zone: editingUser.role === 'officer' ? (editingUser.zone || '') : ''
      });
      setEditingUser(null);
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user: ", error);
      alert("Failed to update user.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '40px', fontFamily: "'Segoe UI', sans-serif" }}>
      
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Edit User</h3>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" required value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="email" required value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              
              <select required value={editingUser.role === 'officer' ? 'officer' : 'farmer'} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="farmer">Farmer</option>
                <option value="officer">Officer</option>
              </select>

              {editingUser.role === 'officer' && (
                <input type="text" required placeholder="Assigned Zone" value={editingUser.zone || ''} onChange={(e) => setEditingUser({...editingUser, zone: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flexGrow: 1, padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px', backgroundColor: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #ddd', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>🛡️ Admin Control Panel</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* CREATE USER OR OFFICER */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
          <h3 style={{ color: '#2e7d32', marginBottom: '20px', marginTop: 0 }}>Create User Account</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" required placeholder="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            <input type="email" required placeholder="Email Address" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            
            <select value={userRole} onChange={(e) => setUserRole(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }}>
              <option value="farmer">Farmer (User)</option>
              <option value="officer">Procurement Officer</option>
            </select>

            {userRole === 'officer' && (
              <input type="text" required placeholder="Location / Zone (e.g., North Zone)" value={userZone} onChange={(e) => setUserZone(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            )}

            <input type="password" required placeholder="Password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            <button type="submit" style={{ padding: '14px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              Create {userRole === 'officer' ? 'Officer' : 'Farmer'}
            </button>
          </form>
        </div>

        {/* OFFICERS TABLE */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <h3 style={{ color: '#1976d2', marginBottom: '20px', marginTop: 0 }}>Manage Officers ({officers.length})</h3>
          {officers.length === 0 ? <p style={{ color: '#777', fontStyle: 'italic' }}>No officers found.</p> : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px 10px' }}>Name</th>
                  <th style={{ padding: '12px 10px' }}>Email</th>
                  <th style={{ padding: '12px 10px' }}>Zone</th>
                  <th style={{ padding: '12px 10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#2c3e50' }}>{user.name || 'Unnamed'}</td>
                    <td style={{ padding: '12px 10px', color: '#555' }}>{user.email}</td>
                    <td style={{ padding: '12px 10px', color: '#777' }}>{user.zone || '-'}</td>
                    <td style={{ padding: '12px 10px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingUser(user)} style={{ padding: '6px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit</button>
                      <button onClick={() => deleteUser(user.id, user.name || user.email)} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FARMERS TABLE */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <h3 style={{ color: '#2e7d32', marginBottom: '20px', marginTop: 0 }}>Manage Farmers ({farmers.length})</h3>
          {farmers.length === 0 ? <p style={{ color: '#777', fontStyle: 'italic' }}>No farmers found.</p> : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px 10px' }}>Name</th>
                  <th style={{ padding: '12px 10px' }}>Email</th>
                  <th style={{ padding: '12px 10px' }}>Role</th>
                  <th style={{ padding: '12px 10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {farmers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#2c3e50' }}>{user.name || 'Unnamed'}</td>
                    <td style={{ padding: '12px 10px', color: '#555' }}>{user.email}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                        {(user.role || 'farmer').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingUser(user)} style={{ padding: '6px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit</button>
                      <button onClick={() => deleteUser(user.id, user.name || user.email)} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;