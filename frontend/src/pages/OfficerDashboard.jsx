import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Load shared orders
    const savedOrders = JSON.parse(localStorage.getItem('farmflow_orders') || '[]');
    setOrders(savedOrders.reverse()); // Show newest first
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('farmflow_user');
    sessionStorage.removeItem('farmflow_user');
    navigate('/login');
  };

  const updateOrderStatus = (id, newStatus) => {
    const updatedOrders = orders.map(order => order.id === id ? { ...order, status: newStatus } : order);
    setOrders(updatedOrders);
    localStorage.setItem('farmflow_orders', JSON.stringify(updatedOrders));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '40px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #ddd', paddingBottom: '20px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>📋 Officer Procurement Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2e7d32' }}>Pending Farmer Applications</h3>
        {orders.length === 0 ? <p style={{ fontStyle: 'italic', color: '#777' }}>No procurement orders found.</p> : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '15px 10px' }}>Date & Time</th>
                <th style={{ padding: '15px 10px' }}>Item (Qty)</th>
                <th style={{ padding: '15px 10px' }}>Location</th>
                <th style={{ padding: '15px 10px' }}>Current Status</th>
                <th style={{ padding: '15px 10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 10px', color: '#555' }}>{order.datetime}</td>
                  <td style={{ padding: '15px 10px', fontWeight: 'bold', color: '#2c3e50' }}>{order.item} ({order.quantity})</td>
                  <td style={{ padding: '15px 10px', color: '#777' }}>📍 {order.location}</td>
                  <td style={{ padding: '15px 10px' }}>
                    <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', 
                      backgroundColor: order.status === 'Pending' ? '#fff3cd' : order.status === 'Approved' ? '#d4edda' : '#f8d7da',
                      color: order.status === 'Pending' ? '#856404' : order.status === 'Approved' ? '#155724' : '#721c24'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '15px 10px', display: 'flex', gap: '10px' }}>
                    {order.status === 'Pending' && (
                      <>
                        <button onClick={() => updateOrderStatus(order.id, 'Approved')} style={{ padding: '6px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                        <button onClick={() => updateOrderStatus(order.id, 'Rejected')} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                      </>
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