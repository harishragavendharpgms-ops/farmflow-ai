import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Create Officer State
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerZone, setOfficerZone] = useState('');
  
  // Users List & Edit State
  const [usersList, setUsersList] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  // Fetch ALL users (Farmers & Officers) in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort so officers appear at the top
      users.sort((a, b) => {
        if (a.role === 'officer' && b.role !== 'officer') return -1;
        if (a.role !== 'officer' && b.role === 'officer') return 1;
        return 0;
      });
      setUsersList(users);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

  // --- CRUD OPERATIONS ---

  const createOfficer = async (e) => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'users'), where('email', '==', officerEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('An account with this email already exists!');
        return;
      }

      await addDoc(collection(db, 'users'), {
        name: officerName,
        email: officerEmail,
        password: officerPassword, 
        role: 'officer',
        zone: officerZone,
        createdAt: new Date().toISOString()
      });
      
      alert(`Officer ${officerName} successfully created!`);
      setOfficerName(''); setOfficerEmail(''); setOfficerPassword(''); setOfficerZone('');
    } catch (error) {
      console.error("Error creating officer: ", error);
      alert("Failed to create officer account.");
    }
  };

  const deleteUser = async (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to delete ${name}? This cannot be undone.`)) {
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
        email: editingUser.email,
        role: editingUser.role,
        zone: editingUser.zone || ''
      });
      setEditingUser(null);
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error updating user: ", error);
      alert("Failed to update user.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '40px', fontFamily: "'Segoe UI', sans-serif", position: 'relative' }}>
      
      {/* EDIT MODAL */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Edit User</h3>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" required value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="email" required value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              
              <select required value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="farmer">Farmer</option>
                <option value="officer">Officer</option>
              </select>

              {editingUser.role === 'officer' && (
                <input type="text" required placeholder="Assigned Zone" value={editingUser.zone} onChange={(e) => setEditingUser({...editingUser, zone: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flexGrow: 1, padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px', backgroundColor: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #ddd', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>🛡️ Admin Control Panel</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* CREATE OFFICER FORM */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
          <h3 style={{ color: '#2e7d32', marginBottom: '20px', marginTop: 0 }}>Create Procurement Officer</h3>
          <form onSubmit={createOfficer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" required placeholder="Officer Full Name" value={officerName} onChange={(e) => setOfficerName(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            <input type="email" required placeholder="Officer Email" value={officerEmail} onChange={(e) => setOfficerEmail(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            
            <input type="text" required placeholder="Location / Zone (e.g., North Zone)" value={officerZone} onChange={(e) => setOfficerZone(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            
            <input type="password" required placeholder="Temporary Password" value={officerPassword} onChange={(e) => setOfficerPassword(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            <button type="submit" style={{ padding: '14px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Register Officer</button>
          </form>
        </div>

        {/* USER MANAGEMENT TABLE */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px', marginTop: 0 }}>Manage All Users</h3>
          
          {usersList.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic' }}>No users found in database.</p>
          ) : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px 10px' }}>Name</th>
                  <th style={{ padding: '12px 10px' }}>Email</th>
                  <th style={{ padding: '12px 10px' }}>Role</th>
                  <th style={{ padding: '12px 10px' }}>Zone</th>
                  <th style={{ padding: '12px 10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#2c3e50' }}>{user.name}</td>
                    <td style={{ padding: '12px 10px', color: '#555' }}>{user.email}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: user.role === 'officer' ? '#e3f2fd' : '#e8f5e9', color: user.role === 'officer' ? '#1976d2' : '#2e7d32' }}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#777' }}>{user.zone || '-'}</td>
                    <td style={{ padding: '12px 10px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingUser(user)} style={{ padding: '6px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit</button>
                      <button onClick={() => deleteUser(user.id, user.name)} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
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