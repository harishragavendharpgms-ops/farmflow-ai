import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const initialRates = { "Rice (Paddy)": 22.50, "Wheat": 25.00 }; // Shortened for space

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('procurement');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const [activeOrders, setActiveOrders] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', email: '' });
  const [availableZones, setAvailableZones] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('farmflow_user') || sessionStorage.getItem('farmflow_user');
    if (savedUser) setUserProfile(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const fetchZones = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'vao'));
      const snap = await getDocs(q);
      setAvailableZones([...new Set(snap.docs.map(d => d.data().zone).filter(Boolean))]);
    };
    fetchZones();
  }, []);

  useEffect(() => {
    if (!userProfile.email) return;
    const q = query(collection(db, 'orders'), where('userEmail', '==', userProfile.email));
    const unsub = onSnapshot(q, (snap) => setActiveOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [userProfile.email]);

  const [orderingItem, setOrderingItem] = useState(null);
  const [orderDetails, setOrderDetails] = useState({ zone: '', address: '', quantity: '', pattaChitta: '' });
  const [pattaFile, setPattaFile] = useState(null);

  const submitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      if (pattaFile) {
        const storageRef = ref(storage, `patta_chitta/${Date.now()}_${pattaFile.name}`);
        await uploadBytes(storageRef, pattaFile);
        fileUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'orders'), {
        userEmail: userProfile.email,
        item: orderingItem, 
        quantity: orderDetails.quantity, 
        zone: orderDetails.zone, 
        address: orderDetails.address,
        pattaChitta: orderDetails.pattaChitta,
        documentUrl: fileUrl, 
        datetime: 'TBD by Officer', // No longer selected by farmer
        status: 'Pending VAO', // Starts with VAO
        createdAt: new Date().toISOString()
      });
      alert(`Success! Application sent to VAO in ${orderDetails.zone}.`);
      setOrderingItem(null); setOrderDetails({ zone: '', address: '', quantity: '', pattaChitta: '' }); setPattaFile(null);
    } catch (error) { alert("Failed to submit."); } finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ padding: '20px', flexGrow: 1 }}>
        
        {/* Simplified View for Order Status */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
          <h3>My Procurements</h3>
          {activeOrders.map(o => (
            <div key={o.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
              <strong>{o.item}</strong> ({o.quantity}kg) - Zone: {o.zone} <br/>
              Status: <span style={{ fontWeight: 'bold', color: o.status.includes('VAO') ? '#9c27b0' : '#2e7d32' }}>{o.status}</span> <br/>
              Slot: <em>{o.datetime}</em>
            </div>
          ))}
        </div>

        {/* Apply Procurement */}
        {!orderingItem ? (
          <button onClick={() => setOrderingItem('Rice (Paddy)')} style={{ padding: '10px', background: '#4caf50', color: 'white', border: 'none', cursor: 'pointer' }}>Sell Rice</button>
        ) : (
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', maxWidth: '500px' }}>
            <h3>Apply for {orderingItem}</h3>
            <form onSubmit={submitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="number" required placeholder="Quantity (kg)" value={orderDetails.quantity} onChange={e => setOrderDetails({...orderDetails, quantity: e.target.value})} style={{ padding: '10px' }} />
              <select required value={orderDetails.zone} onChange={e => setOrderDetails({...orderDetails, zone: e.target.value})} style={{ padding: '10px' }}>
                <option value="">-- Select Zone --</option>
                {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
              <input type="text" required placeholder="Farm Address" value={orderDetails.address} onChange={e => setOrderDetails({...orderDetails, address: e.target.value})} style={{ padding: '10px' }} />
              <input type="text" required placeholder="Patta/Chitta Number" value={orderDetails.pattaChitta} onChange={e => setOrderDetails({...orderDetails, pattaChitta: e.target.value})} style={{ padding: '10px' }} />
              <input type="file" accept=".jpg,.png,.pdf" required onChange={e => setPattaFile(e.target.files[0])} style={{ padding: '10px' }} />
              
              {/* Removed Date/Time Inputs */}
              
              <button type="submit" disabled={isSubmitting} style={{ padding: '10px', background: '#2e7d32', color: 'white', border: 'none', cursor: 'pointer' }}>{isSubmitting ? 'Uploading...' : 'Submit to VAO'}</button>
              <button type="button" onClick={() => setOrderingItem(null)} style={{ padding: '10px', cursor: 'pointer' }}>Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;