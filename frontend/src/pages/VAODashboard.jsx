import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';

const VAODashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({});
  const [modalImage, setModalImage] = useState(null); 

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user') || sessionStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
    else navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (!userProfile.zone) return; 
    
    // VAO QUERY: Only filter by Zone so they see all villages/sub-places inside it.
    const q = query(
      collection(db, 'orders'), 
      where('zone', '==', userProfile.zone)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const allZoneOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by newest first
      allZoneOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(allZoneOrders);
    });

    return () => unsub();
  }, [userProfile]);

  const triggerSms = async (phoneNumber, message) => {
    if (!phoneNumber || phoneNumber === 'N/A') return;
    
    let cleanPhone = phoneNumber.toString().replace(/[^\d+]/g, '');
    
    // Auto-format standard 10-digit Indian numbers to E.164 format
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`; 
    }

    // --- TEXTBEE CREDENTIALS ---
    const TEXTBEE_DEVICE_ID = "6a9d1e51ccb6c727098825fb"; 
    const TEXTBEE_API_KEY = "txb_TxrBzRwSdleKWzGtwMlg3bavFWnhAL7v";

    try {
      const res = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': TEXTBEE_API_KEY
        },
        body: JSON.stringify({ 
          receivers: [cleanPhone], 
          smsBody: message 
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to send SMS via TextBee');
      console.log('SMS sent successfully via TextBee:', data);
    } catch (err) {
      console.warn('TextBee SMS dispatch failed:', err.message);
    }
  };

  const handleVerify = async (order) => {
    try {
      const now = new Date();
      const vaoName = userProfile.name || 'VAO Officer';
      const vaoDesignation = userProfile.subPlace ? `VAO / ${userProfile.subPlace}` : 'Village Administrative Officer';
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();

      // Generate a signed PDF containing the official Government Digital Signature Box stamp
      const docPdf = new jsPDF();
      
      // Document Header
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(16);
      docPdf.text("FARMFLOW AI - OFFICIAL VERIFIED CERTIFICATE", 20, 20);
      
      docPdf.setFontSize(11);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(`Application ID: ${order.id}`, 20, 35);
      docPdf.text(`Farmer Name: ${order.userName || 'N/A'}`, 20, 45);
      docPdf.text(`Crop/Item: ${order.item} (${order.quantity}kg)`, 20, 55);
      docPdf.text(`Zone / Location: ${order.zone} ${order.subPlace ? `/ ${order.subPlace}` : ''}`, 20, 65);
      docPdf.text(`Patta/Chitta No: ${order.pattaChitta || 'N/A'}`, 20, 75);
      
      docPdf.line(20, 85, 190, 85);

      // Draw Government Digital Signature Box inside the PDF
      docPdf.rect(130, 100, 65, 45); // Box outline
      docPdf.setFont("courier", "normal");
      docPdf.setFontSize(9);
      docPdf.text("--- -----", 147, 107, { align: "center" });
      docPdf.setFont("courier", "bold");
      docPdf.text("Digitally signed:", 162, 114, { align: "center" });
      docPdf.text(vaoName.toUpperCase(), 162, 121, { align: "center" });
      docPdf.setFont("courier", "normal");
      docPdf.setFontSize(8);
      docPdf.text(vaoDesignation, 162, 127, { align: "center" });
      docPdf.text(dateStr, 162, 134, { align: "center" });
      docPdf.text(timeStr, 162, 140, { align: "center" });

      // Output signed PDF as a Base64 string data URL
      const signedPdfBase64 = docPdf.output('datauristring');

      // Update Firestore with status, signature metadata, and the newly signed PDF
      await updateDoc(doc(db, 'orders', order.id), { 
        status: 'VAO Verified', 
        vaoSignatureDetails: {
          name: vaoName,
          designation: vaoDesignation,
          date: dateStr,
          time: timeStr
        },
        documentUrl: signedPdfBase64 
      });

      // Send SMS alert to farmer
      await triggerSms(order.userPhone, `FarmFlow AI: Your application for ${order.quantity}kg ${order.item} has been successfully verified and E-Signed by the VAO.`);

      alert("Document successfully E-Signed, stamped inside the PDF, and SMS alert sent to Farmer!");
    } catch (error) { 
      console.error(error);
      alert("Failed to verify and sign document."); 
    }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', padding: '20px', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', borderBottom: '2px solid #ddd', paddingBottom: '15px' }}>
        <div>
          <h2 style={{ color: '#2c3e50', margin: 0 }}>📝 VAO Dashboard</h2>
          <p style={{ color: '#9c27b0', margin: '5px 0 0 0', fontWeight: 'bold' }}>👤 {userProfile.name} | 📍 Zone: {userProfile.zone}</p>
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
                    <span style={{ fontSize: '13px', color: '#2c3e50', fontWeight: 'bold' }}>👤 {order.userName || 'Farmer'}</span><br/>
                    <span style={{ fontSize: '12px', color: '#2196f3' }}>✉️ {order.userEmail}</span><br/>
                    <span style={{ fontSize: '12px', color: '#e67e22', fontWeight: 'bold' }}>📞 {order.userPhone || 'N/A'}</span><br/>
                    <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold', display: 'inline-block', marginTop: '4px' }}>📍 {order.zone} {order.subPlace ? `/ ${order.subPlace}` : ''}</span>
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

      {modalImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '80%', maxWidth: '800px', height: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 5px 25px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Patta / Chitta Document Preview</h3>
            
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

export default VAODashboard;