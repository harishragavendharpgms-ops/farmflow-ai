import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email === 'admin@farmflow.com' && password === 'admin123') {
      const adminData = { name: 'System Admin', email, role: 'admin' };
      sessionStorage.setItem('farmflow_user', JSON.stringify(adminData));
      navigate('/admin');
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);
      
      let userData;
      
      if (!querySnapshot.empty) {
        userData = querySnapshot.docs[0].data();
      } else {
        // Dynamically create name from email (e.g. rohit@gmail.com -> Rohit)
        const namePart = email.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        userData = { name: formattedName, email: email, role: 'farmer' };
      }

      if (rememberMe) {
        localStorage.setItem('farmflow_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('farmflow_user', JSON.stringify(userData));
      }
      
      if (userData.role === 'officer') navigate('/officer');
      else navigate('/dashboard');

    } catch (error) {
      console.error("Error logging in: ", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: '#2e7d32', textAlign: 'center', marginBottom: '30px' }}>🌱 FarmFlow AI Login</h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold' }}>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} placeholder="Enter your email" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold' }}>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} placeholder="Enter your password" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
            <label htmlFor="remember" style={{ color: '#555', cursor: 'pointer' }}>Save login info</label>
          </div>
          <button type="submit" style={{ padding: '14px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;