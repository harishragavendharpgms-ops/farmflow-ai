import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function FarmerTracker() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Query orders collection matching the farmer's phone number
      const q = query(collection(db, 'orders'), where('userPhone', '==', phoneNumber));
      const querySnapshot = await getDocs(q);
      const ordersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFarmerOrders(ordersList);
    } catch (err) {
      console.error('Error fetching tracking details:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '30px 20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>🌾 FarmFlow AI - Farmer Portal</h1>
          <p style={{ color: '#555', margin: 0 }}>Track your crop procurement status, verification steps, and DBT payout in real-time.</p>
        </div>

        {/* Search Box */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
          <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <input 
              type="text" 
              placeholder="Enter your registered mobile number..." 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ padding: '12px 15px', width: '65%', border: '1px solid #ddd', borderRadius: '6px', fontSize: '15px' }}
            />
            <button 
              type="submit" 
              style={{ padding: '12px 25px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
            >
              {loading ? 'Searching...' : 'Track Status'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {searched && (
          <div>
            {farmerOrders.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#777' }}>
                <p style={{ fontSize: '16px', margin: 0 }}>No active procurement applications found for <strong>{phoneNumber}</strong>.</p>
              </div>
            ) : (
              farmerOrders.map((order) => (
                <div key={order.id} style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{order.item} ({order.quantity} kg)</h3>
                      <span style={{ fontSize: '13px', color: '#777' }}>Application ID: {order.id}</span>
                    </div>
                    <div>
                      <span style={{ 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '13px', 
                        fontWeight: 'bold',
                        backgroundColor: order.status === 'Procured' ? '#e8f5e9' : '#fff3e0',
                        color: order.status === 'Procured' ? '#2e7d32' : '#e65100'
                      }}>
                        {order.status || 'Pending Verification'}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px', marginBottom: '20px' }}>
                    <div>
                      <p style={{ margin: '5px 0', color: '#555' }}>📍 <strong>Zone / Sub-place:</strong> {order.zone} / {order.subPlace || 'General'}</p>
                      <p style={{ margin: '5px 0', color: '#555' }}>📅 <strong>Assigned Slot:</strong> {order.datetime || 'TBD by Officer'}</p>
                    </div>
                    <div>
                      <p style={{ margin: '5px 0', color: '#555' }}>💳 <strong>DBT Payout Status:</strong> <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>{order.paymentStatus || 'Pending Completion'}</span></p>
                      {order.payoutAmount && (
                        <p style={{ margin: '5px 0', color: '#555' }}>💰 <strong>Disbursed Amount:</strong> ₹{order.payoutAmount}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress Timeline Tracker */}
                  <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#2c3e50' }}>Lifecycle Progress:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', textAlign: 'center' }}>
                      <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>1. Submitted</div>
                      <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>2. VAO Verified</div>
                      <div style={{ color: order.datetime ? '#2e7d32' : '#aaa', fontWeight: order.datetime ? 'bold' : 'normal' }}>3. Slot Scheduled</div>
                      <div style={{ color: order.status === 'Procured' ? '#2e7d32' : '#aaa', fontWeight: order.status === 'Procured' ? 'bold' : 'normal' }}>4. DBT Paid</div>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}