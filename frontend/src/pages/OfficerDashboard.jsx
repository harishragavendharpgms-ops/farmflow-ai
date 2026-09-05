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

  // Helper function to send SMS via the Vercel serverless API route
  const triggerSms = async (phoneNumber, message) => {
    if (!phoneNumber || phoneNumber === 'N/A') return;
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, body: message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
      console.log('SMS sent successfully:', data.sid);
    } catch (err) {
      console.warn('SMS dispatch failed (Check Twilio trial restrictions):', err.message);
    }
  };

  const handleSaveTimeSlot = async (id) => {
    const input = slotInputs[id];
    if (!input || !input.date || !input.time) {
      alert("Please select a date and enter the time manually.");
      return;
    }
    
    const combinedSlot = `${input.date} at ${input.time}`;
    const order = orders.find(o => o.id === id);

    try {
      await updateDoc(doc(db, 'orders', id), { 
        datetime: combinedSlot 
      });

      // Dispatch SMS alert to the farmer using their exact schema field (userPhone)
      await triggerSms(order.userPhone, `FarmFlow AI: Your slot is confirmed on ${combinedSlot} at ${order.zone}.`);

      alert(`Time slot successfully assigned: ${combinedSlot}`);
    } catch (error) {
      console.error(error);
      alert("Failed to assign time slot.");
    }
  };

  const handleProcure = async (id) => {
    const order = orders.find(o => o.id === id);
    const estimatedRate = 22.50; 
    const totalPayout = ((parseFloat(order.quantity) || 0) * estimatedRate).toFixed(2);

    try {
      await updateDoc(doc(db, 'orders', id), { 
        status: 'Procured',
        paymentStatus: 'Paid via DBT',
        payoutAmount: totalPayout,
        procuredAt: new Date().toISOString()
      });

      // Dispatch payout SMS alert to the farmer
      await triggerSms(order.userPhone, `FarmFlow AI: Procurement complete! A payout of INR ${totalPayout} has been processed via DBT.`);

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
                        style={{ marginTop: '5px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'block' }}
                      >
                        👁️ View Signed Certificate & Document
                      </button>
                    )}

                    {order.vaoSignatureDetails ? (
                      <div style={{ 
                        marginTop: '10px',
                        border: '2px solid #000', 
                        padding: '6px', 
                        width: '150px', 
                        textAlign: 'center', 
                        fontFamily: 'monospace', 
                        fontSize: '11px',
                        lineHeight: '1.3',
                        backgroundColor: '#fff',
                        color: '#000'
                      }}>
                        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '2px', marginBottom: '2px', letterSpacing: '2px' }}>
                          --- -----
                        </div>
                        <div style={{ fontWeight: 'bold' }}>Digitally signed:</div>
                        <div style={{ fontWeight: 'bold', margin: '3px 0', textTransform: 'uppercase' }}>{order.vaoSignatureDetails.name}</div>
                        <div style={{ fontSize: '10px' }}>{order.vaoSignatureDetails.designation}</div>
                        <div style={{ marginTop: '4px' }}>{order.vaoSignatureDetails.date}</div>
                        <div>{order.vaoSignatureDetails.time}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'orange', display: 'block', marginTop: '5px' }}>Pending VAO Stamp</span>
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
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '80%', maxWidth: '800px', height: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 5px 25px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Verified Patta & Chitta Certificate Preview</h3>
            
            <div style={{ width: '100%', flex: 1, overflow: 'hidden', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
              {modalImage.startsWith('data:application/pdf') || modalImage.toLowerCase().includes('.pdf') ? (
                <iframe src={modalImage} title="PDF Document Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <img src={modalImage} alt="Patta Document" style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}
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