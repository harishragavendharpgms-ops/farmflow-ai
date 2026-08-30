import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase'; 
import { collection, addDoc } from 'firebase/firestore';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userDoc = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'farmer',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'users'), userDoc);
      localStorage.setItem('farmflow_user', JSON.stringify(userDoc));
      
      alert("Registration successful!");
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert("Registration failed.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: "'Segoe UI', sans-serif" }}>
      <h2 style={{ textAlign: 'center', color: '#2e7d32', margin: '0 0 20px 0' }}>Farmer Registration</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
        <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
        <input type="tel" placeholder="Phone Number (e.g. 9876543210)" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
        <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd' }} />
        <button type="submit" style={{ padding: '12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Register</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#555' }}>Already have an account? <Link to="/login" style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link></p>
    </div>
  );
};

export default Register;