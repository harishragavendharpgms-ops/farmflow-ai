import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const VAODashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({});

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user') || sessionStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
    else navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!userProfile.zone) return; 
    const q = query(collection(db, 'orders'), where('zone', '==', userProfile.zone));
    const unsub = onSnapshot(q, (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [userProfile.zone]);

  const handleVerify = async (id) => {
    try {
      const eSignature = `Digitally Verified by VAO ${userProfile.name} on ${new Date().toLocaleDateString()}`;
      await updateDoc(doc(db, 'orders', id), { 
        status: 'VAO Verified', 
        vaoSignature: eSignature 
      });
    } catch (error) { alert("Failed to verify."); }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>📝 VAO Dashboard - Zone: {userProfile.zone}</h2>
        <button onClick={handleLogout} style={{ background: '#ff6b6b', color: 'white', padding: '10px', border: 'none', borderRadius: '5px' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
        <h3>Pending Document Verifications</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #eee' }}><th>Farmer</th><th>Patta Details</th><th>Action</th></tr></thead>
          <tbody>
            {orders.filter(o => o.status === 'Pending VAO').map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px 10px' }}>{order.userEmail}</td>
                <td style={{ padding: '15px 10px' }}>
                  No: {order.pattaChitta} <br/>
                  {order.documentUrl && <a href={order.documentUrl} target="_blank" style={{ color: '#1976d2' }}>View Document</a>}
                </td>
                <td style={{ padding: '15px 10px' }}>
                  <button onClick={() => handleVerify(order.id)} style={{ padding: '8px 15px', background: '#9c27b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✍️ E-Sign & Verify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default VAODashboard;