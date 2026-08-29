import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const VAODashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [modalImage, setModalImage] = useState(null); // State for image preview modal

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
      const filtered = userProfile.subPlace 
        ? allZoneOrders.filter(o => !o.subPlace || o.subPlace === userProfile.subPlace)
        : allZoneOrders;
        
      setOrders(filtered);
    });

    return () => unsub();
  }, [userProfile]);

  const handleVerify = async (order) => {
    try {
      const eSignature = `Digitally Verified by VAO ${userProfile.name} (${userProfile.subPlace || userProfile.zone}) on ${new Date().toLocaleDateString()}`;
      await updateDoc(doc(db, 'orders', order.id), { 
        status: 'VAO Verified', 
        vaoSignature: eSignature,
        documentUrl: order.documentUrl 
      });
      alert("Document successfully E-Signed and sent to Procurement Officer!");
    } catch (error) { 
      console.error(error);
      alert("Failed to verify."); 
    }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '15px' }}>
        <div>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>📝 VAO Dashboard</h2>
          <p style={{ color: '#9c27b0', margin: '5px 0 0 0', fontWeight: 'bold' }}>👤 {userProfile.name} | 📍 Zone: {userProfile.zone} ({userProfile.subPlace || 'General Jurisdiction'})</p>
        </div>
        <button onClick={handleLogout} style={{ background: '#ff6b6b', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Log Out</button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#2e7d32', marginTop: 0 }}>Pending Document Verifications</h3>
        {orders.filter(o => o.status === 'Pending VAO').length === 0 ? (
          <p style={{ color: '#777', fontStyle: 'italic' }}>No pending applications requiring your verification in your jurisdiction.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px 10px' }}>Farmer & Location</th>
                <th style={{ padding: '12px 10px' }}>Patta Details</th>
                <th style={{ padding: '12px 10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.filter(o => o.status === 'Pending VAO').map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 10px' }}>
                    <strong>{order.item} ({order.quantity}kg)</strong><br/>
                    <span style={{ fontSize: '12px', color: '#2196f3' }}>{order.userEmail}</span><br/>
                    <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>📍 {order.zone} / {order.subPlace || 'General'}</span>
                  </td>
                  <td style={{ padding: '15px 10px' }}>
                    No: <strong>{order.pattaChitta}</strong> <br/>
                    {order.documentUrl && (
                      <button 
                        onClick={() => setModalImage(order.documentUrl)} 
                        style={{ marginTop: '5px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        👁️ View Document
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '15px 10px' }}>
                    <button onClick={() => handleVerify(order)} style={{ padding: '8px 15px', background: '#9c27b0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                      ✍️ E-Sign & Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Image Preview Modal Popup */}
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

export default VAODashboard;