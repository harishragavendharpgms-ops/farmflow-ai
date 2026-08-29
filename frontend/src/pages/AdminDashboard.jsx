import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPassword, setOfficerPassword] = useState('');
  const [officerZone, setOfficerZone] = useState('');

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
        zone: officerZone, // Assign the Zone to the Officer
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #ddd', paddingBottom: '20px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>🛡️ Admin Control Panel</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
        <h3 style={{ color: '#2e7d32', marginBottom: '20px' }}>Create Procurement Officer</h3>
        <form onSubmit={createOfficer} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="text" required placeholder="Officer Full Name" value={officerName} onChange={(e) => setOfficerName(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
          <input type="email" required placeholder="Officer Email" value={officerEmail} onChange={(e) => setOfficerEmail(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
          <select required value={officerZone} onChange={(e) => setOfficerZone(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }}>
            <option value="">-- Assign a Zone --</option>
            <option value="North Zone">North Zone</option>
            <option value="South Zone">South Zone</option>
            <option value="East Zone">East Zone</option>
            <option value="West Zone">West Zone</option>
            <option value="Central Zone">Central Zone</option>
          </select>
          <input type="password" required placeholder="Temporary Password" value={officerPassword} onChange={(e) => setOfficerPassword(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '6px' }} />
          <button type="submit" style={{ padding: '14px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Register Officer</button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;