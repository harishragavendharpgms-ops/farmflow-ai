import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [modalImage, setModalImage] = useState(null); 
  const [slotInputs, setSlotInputs] = useState({}); 

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user') || sessionStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
    else navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!userProfile.zone) return; 

    const q = query(
      collection(db, 'orders'), 
      where('zone', '==', userProfile.zone)
    );

    const unsub = onSnapshot(q, (snap) => {
      const allZoneOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const filtered = allZoneOrders.filter(o => {
        const matchesSubPlace = userProfile.subPlace ? o.subPlace === userProfile.subPlace : true;
        return matchesSubPlace && o.status === 'VAO Verified';
      });

      setOrders(filtered);
    });

    return () => unsub();
  }, [userProfile]);

  const handleInputChange = (orderId, field, value) => {
    setSlotInputs(prev => ({
      ...prev,
      [orderId]: {
        date: field === 'date' ? value : (prev[orderId]?.date || ''),
        time: field === 'time' ? value : (prev[orderId]?.time || '')
      }
    }));
  };

  const handleSaveTimeSlot = async (id) => {
    const input = slotInputs[id];
    if (!input || !input.date || !input.time) {
      alert("Please select a date and enter the time manually.");
      return;
    }
    const combinedSlot = `${input.date} at ${input.time}`;
    try {
      await updateDoc(doc(db, 'orders', id), { 
        datetime: combinedSlot 
      });
      alert(`Time slot successfully assigned: ${combinedSlot}`);
    } catch (error) {
      console.error(error);
      alert("Failed to assign time slot.");
    }
  };

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

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <h3 style={{ color: '#2e7d32', marginTop: 0 }}>Ready for Procurement (VAO Verified)</h3>
        {orders.length === 0 ? (
          <p style={{ color: '#777', fontStyle: 'italic' }}>No verified applications pending procurement in your jurisdiction.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '750px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px 10px' }}>Farmer & Crop</th>
                <th style={{ padding: '12px 10px' }}>Location & Document</th>
                <th style={{ padding: '12px 10px' }}>Schedule Date & Manual Time</th>
                <th style={{ padding: '12px 10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 10px' }}>
                    <strong>{order.item} ({order.quantity}kg)</strong><br/>
                    <span style={{ fontSize: '13px', color: '#2c3e50', fontWeight: 'bold' }}>👤 {order.userName || 'Farmer'}</span><br/>
                    <span style={{ fontSize: '12px', color: '#2196f3' }}>✉️ {order.userEmail}</span><br/>
                    <span style={{ fontSize: '12px', color: '#e67e22', fontWeight: 'bold' }}>📞 {order.userPhone || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '15px 10px' }}>
                    📍 <strong>{order.zone}</strong> / <span style={{ color: '#2e7d32' }}>{order.subPlace || 'General'}</span><br/>
                    {order.documentUrl && (
                      <button 
                        onClick={() => setModalImage(order.documentUrl)} 
                        style={{ marginTop: '5px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        👁️ View Document
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '15px 10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input 
                        type="date" 
                        onChange={(e) => handleInputChange(order.id, 'date', e.target.value)}
                        style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', width: '150px' }}
                      />
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="Type time (e.g. 10:30 AM)" 
                          onChange={(e) => handleInputChange(order.id, 'time', e.target.value)}
                          style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', width: '150px' }}
                        />
                        <button 
                          onClick={() => handleSaveTimeSlot(order.id)} 
                          style={{ padding: '6px 10px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                        >
                          Set
                        </button>
                      </div>
                    </div>
                    {order.datetime && order.datetime !== 'TBD by Officer' && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#2e7d32', marginTop: '4px', fontWeight: 'bold' }}>Current: {order.datetime}</span>
                    )}
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

      {modalImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 5px 25px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Patta / Chitta Document Preview</h3>
            <div style={{ maxWidth: '100%', maxHeight: '70vh', overflow: 'auto', marginBottom: '15px' }}>
              <img src={modalImage} alt="Patta Document" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '6px' }} />
            </div>
            <button onClick={() => setModalImage(null)} style={{ padding: '8px 20px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;