import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const OfficerDashboard = () => {
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

    // Fetch verified orders for this officer's zone
    const q = query(
      collection(db, 'orders'), 
      where('zone', '==', userProfile.zone)
    );

    const unsub = onSnapshot(q, (snap) => {
      const allZoneOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter strictly by the officer's assigned sub-place (if applicable) and ensure VAO verified status
      const filtered = allZoneOrders.filter(o => {
        const matchesSubPlace = userProfile.subPlace ? o.subPlace === userProfile.subPlace : true;
        return matchesSubPlace && o.status === 'VAO Verified';
      });

      setOrders(filtered);
    });

    return () => unsub();
  }, [userProfile]);

  const handleProcure = async (id) => {
    try {
      await updateDoc(doc(db, 'orders', id), { 
        status: 'Procured',
        procuredAt: new Date().toISOString()
      });
      alert("Crop successfully marked as Procured!");
    } catch (error) { 
      console.error(error);
      alert("Failed to update procurement status."); 
    }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '15px' }}>
        <div>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>🛡️ Procurement Officer Dashboard</h2>
          <p style={{ color: '#2e7d32', margin: '5px 0 0 0', fontWeight: 'bold' }}>👤 {userProfile.name} | 📍 Zone: {userProfile.zone} ({userProfile.subPlace || 'General Jurisdiction'})</p>
        </div>
        <button onClick={handleLogout} style={{ background: '#ff6b6b', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#2e7d32', marginTop: 0 }}>Ready for Procurement (VAO Verified)</h3>
        {orders.length === 0 ? (
          <p style={{ color: '#777', fontStyle: 'italic' }}>No verified applications pending procurement in your jurisdiction.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px 10px' }}>Farmer & Crop</th>
                <th style={{ padding: '12px 10px' }}>Location & Sub-Place</th>
                <th style={{ padding: '12px 10px' }}>VAO Signature</th>
                <th style={{ padding: '12px 10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 10px' }}>
                    <strong>{order.item} ({order.quantity}kg)</strong><br/>
                    <span style={{ fontSize: '12px', color: '#2196f3' }}>{order.userEmail}</span>
                  </td>
                  <td style={{ padding: '15px 10px' }}>
                    📍 <strong>{order.zone}</strong> / <span style={{ color: '#2e7d32' }}>{order.subPlace || 'General'}</span><br/>
                    <span style={{ fontSize: '12px', color: '#666' }}>{order.address}</span>
                  </td>
                  <td style={{ padding: '15px 10px', fontSize: '12px', color: '#7b1fa2' }}>
                    {order.vaoSignature || 'Verified'}
                  </td>
                  <td style={{ padding: '15px 10px' }}>
                    <button onClick={() => handleProcure(order.id)} style={{ padding: '8px 15px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                      📦 Complete Procurement
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;