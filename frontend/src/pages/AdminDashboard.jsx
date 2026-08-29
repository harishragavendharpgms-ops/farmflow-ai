import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerZone, setOfficerZone] = useState('');
  const [officersList, setOfficersList] = useState([]);

  // Fetch all registered officers in real-time
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'officer'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const officers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOfficersList(officers);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

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
        zone: officerZone, // The location/zone assigned by admin
        createdAt: new Date().toISOString()
      });
      
      alert(`Officer ${officerName} successfully created for ${officerZone}!`);
      setOfficerName(''); setOfficerEmail(''); setOfficerPassword(''); setOfficerZone('');
      
    } catch (error) {
      console.error("Error creating officer: ", error);
      alert("Failed to create officer account.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '40px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #ddd', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>🛡️ Admin Control Panel</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* CREATE OFFICER FORM */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h3 style={{ color: '#2e7d32', marginBottom: '20px', marginTop: 0 }}>Create Procurement Officer</h3>
          <form onSubmit={createOfficer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" required placeholder="Officer Full Name" value={officerName} onChange={(e) => setOfficerName(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            <input type="email" required placeholder="Officer Email" value={officerEmail} onChange={(e) => setOfficerEmail(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            
            <input type="text" required placeholder="Location / Zone (e.g., North Zone, Mumbai Market)" value={officerZone} onChange={(e) => setOfficerZone(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            <p style={{ fontSize: '12px', color: '#666', margin: '-10px 0 0 0' }}>This location will automatically show up for farmers to select.</p>

            <input type="password" required placeholder="Temporary Password" value={officerPassword} onChange={(e) => setOfficerPassword(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
            <button type="submit" style={{ padding: '14px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Register Officer</button>
          </form>
        </div>

        {/* LIST OF REGISTERED OFFICERS & ZONES */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px', marginTop: 0 }}>Active Officers & Locations</h3>
          {officersList.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic' }}>No officers created yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {officersList.map(off => (
                <div key={off.id} style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid #2e7d32' }}>
                  <strong style={{ fontSize: '16px', color: '#2c3e50' }}>{off.name}</strong>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>📧 {off.email}</p>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#2e7d32', fontWeight: 'bold' }}>📍 Assigned Location: {off.zone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;