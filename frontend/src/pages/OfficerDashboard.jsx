import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  
  // Load initial orders
  const [orders, setOrders] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('farmflow_orders') || '[]');
    return saved.reverse(); // Show newest orders at the top
  });

  // Auto-sync every 2 seconds to catch orders made in other tabs
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const savedOrders = JSON.parse(localStorage.getItem('farmflow_orders') || '[]');
      setOrders(savedOrders.reverse());
    }, 2000);
    return () => clearInterval(syncInterval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

  const updateOrderStatus = (id, newStatus) => {
    // Read the absolute latest data before updating to prevent bugs
    const currentOrders = JSON.parse(localStorage.getItem('farmflow_orders') || '[]');
    const updatedOrders = currentOrders.map(order => order.id === id ? { ...order, status: newStatus } : order);
    
    localStorage.setItem('farmflow_orders', JSON.stringify(updatedOrders));
    setOrders([...updatedOrders].reverse());
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '24px' }}>📋 Officer Procurement Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      {/* ORDERS TABLE */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2e7d32', fontSize: '18px' }}>Pending Farmer Applications</h3>
        
        {orders.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#777', margin: 0 }}>No procurement orders found.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Date & Time</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Item (Qty)</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Location</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Status</th>
                <th style={{ padding: '12px 10px', fontSize: '14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 10px', color: '#555', fontSize: '14px' }}>{order.datetime}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#2c3e50', fontSize: '14px' }}>{order.item} <br/><span style={{fontSize: '12px', color: '#777'}}>{order.quantity} Units</span></td>
                  <td style={{ padding: '12px 10px', color: '#777', fontSize: '14px' }}>📍 {order.location}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', 
                      backgroundColor: order.status === 'Pending' ? '#fff3cd' : order.status === 'Approved' ? '#d4edda' : '#f8d7da',
                      color: order.status === 'Pending' ? '#856404' : order.status === 'Approved' ? '#155724' : '#721c24'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', display: 'flex', gap: '8px' }}>
                    {order.status === 'Pending' ? (
                      <>
                        <button onClick={() => updateOrderStatus(order.id, 'Approved')} style={{ padding: '6px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Approve</button>
                        <button onClick={() => updateOrderStatus(order.id, 'Rejected')} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Reject</button>
                      </>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '12px', fontStyle: 'italic' }}>Reviewed</span>
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