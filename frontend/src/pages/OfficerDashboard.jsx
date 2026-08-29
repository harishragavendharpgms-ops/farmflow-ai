import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [slotData, setSlotData] = useState({});

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

  const handleApproveWithSlot = async (id) => {
    if (!slotData[id]?.date || !slotData[id]?.time) return alert("Please select Date and Time first.");
    try {
      await updateDoc(doc(db, 'orders', id), { 
        status: 'Approved',
        datetime: `${slotData[id].date} | ${slotData[id].time}`
      });
    } catch (error) { alert("Failed to approve."); }
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, 'orders', id), { status });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>📋 Officer Dashboard - Zone: {userProfile.zone}</h2>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: '#ff6b6b', color: 'white', padding: '10px', border: 'none', borderRadius: '5px' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '2px solid #eee' }}><th>Application</th><th>VAO Status</th><th>Action / Set Slot</th></tr></thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px 10px' }}>
                  <strong>{order.item} ({order.quantity}kg)</strong><br/>{order.userEmail}
                </td>
                <td style={{ padding: '15px 10px' }}>
                  {order.status === 'Pending VAO' ? (
                    <span style={{ color: '#f57c00' }}>⏳ Waiting for VAO</span>
                  ) : (
                    <div>
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ {order.status}</span><br/>
                      <small style={{ color: '#9c27b0' }}>{order.vaoSignature}</small>
                      {order.documentUrl && <><br/><a href={order.documentUrl} target="_blank" style={{ fontSize: '11px' }}>View Doc</a></>}
                    </div>
                  )}
                </td>
                <td style={{ padding: '15px 10px' }}>
                  
                  {order.status === 'VAO Verified' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <input type="date" onChange={e => setSlotData({...slotData, [order.id]: {...slotData[order.id], date: e.target.value}})} style={{ padding: '5px' }} />
                      <select onChange={e => setSlotData({...slotData, [order.id]: {...slotData[order.id], time: e.target.value}})} style={{ padding: '5px' }}>
                        <option value="">-- Time --</option><option value="09:00 - 12:00">Morning</option><option value="12:00 - 17:00">Afternoon</option>
                      </select>
                      <button onClick={() => handleApproveWithSlot(order.id)} style={{ background: '#4caf50', color: 'white', padding: '5px', border: 'none', cursor: 'pointer' }}>Approve & Set Slot</button>
                    </div>
                  )}

                  {order.status === 'Approved' && (
                    <button onClick={() => updateStatus(order.id, 'Procured')} style={{ background: '#2196f3', color: 'white', padding: '8px', border: 'none', cursor: 'pointer' }}>Mark Procured</button>
                  )}

                  {order.status === 'Procured' && <span style={{ color: '#aaa' }}>Completed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default OfficerDashboard;