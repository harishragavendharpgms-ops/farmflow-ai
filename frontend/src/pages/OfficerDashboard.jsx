import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', zone: '', email: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user') || sessionStorage.getItem('farmflow_user');
    if (savedUser) {
      setUserProfile(JSON.parse(savedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!userProfile.zone) return; 

    const q = query(collection(db, 'orders'), where('zone', '==', userProfile.zone));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(ordersData);
    });
    
    return () => unsubscribe();
  }, [userProfile.zone]);

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order: ", error);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '24px' }}>📋 Officer Dashboard</h1>
          <p style={{ color: '#4caf50', margin: '5px 0 0 0', fontWeight: 'bold' }}>
            👤 {userProfile.name} | 📍 Assigned Region: {userProfile.zone || 'Loading...'}
          </p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2e7d32', fontSize: '18px' }}>Pending Applications in {userProfile.zone}</h3>
        
        {orders.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#777', margin: 0 }}>No orders found for your assigned zone.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Date & Farmer</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Item (Qty)</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Location & Patta Chitta</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Status</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 10px', color: '#555', fontSize: '14px' }}>
                    {order.datetime} <br/>
                    <span style={{fontSize: '12px', color: '#2196f3', fontWeight: 'bold'}}>{order.userEmail}</span>
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>
                    {order.item} <br/><span style={{fontSize: '12px', color: '#777'}}>{order.quantity} Units</span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#777', fontSize: '14px' }}>
                    📍 {order.address} <br/>
                    <span style={{fontSize: '12px', color: '#d84315', fontWeight: 'bold'}}>📄 Patta: {order.pattaChitta || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', 
                      backgroundColor: order.status === 'Pending' ? '#fff3cd' : order.status === 'Approved' ? '#d4edda' : order.status === 'Procured' ? '#cce5ff' : '#f8d7da',
                      color: order.status === 'Pending' ? '#856404' : order.status === 'Approved' ? '#155724' : order.status === 'Procured' ? '#004085' : '#721c24'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    
                    {order.status === 'Pending' && (
                      <>
                        <button onClick={() => updateOrderStatus(order.id, 'Approved')} style={{ padding: '6px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Approve</button>
                        <button onClick={() => updateOrderStatus(order.id, 'Rejected')} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Reject</button>
                      </>
                    )}
                    
                    {order.status === 'Approved' && (
                      <button onClick={() => updateOrderStatus(order.id, 'Procured')} style={{ padding: '6px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Mark Procured</button>
                    )}

                    {(order.status === 'Rejected' || order.status === 'Procured') && (
                      <span style={{ color: '#aaa', fontSize: '12px', fontStyle: 'italic', padding: '6px 0' }}>
                        {order.status === 'Procured' ? 'Completed ✅' : 'Reviewed'}
                      </span>
                    )}

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