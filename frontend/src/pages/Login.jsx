import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase'; // Import auth from firebase.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email === 'admin@farmflow.com' && password === 'admin123') {
      const adminData = { name: 'System Admin', email, role: 'admin' };
      sessionStorage.setItem('farmflow_user', JSON.stringify(adminData));
      navigate('/admin');
      return;
    }

    try {
      // 1. Authenticate securely using Firebase Auth
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);

      // 2. Fetch user profile data from Firestore to get their role and name
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      let userData = { name: 'User', email, role: 'farmer' };
      if (!querySnapshot.empty) {
        userData = querySnapshot.docs[0].data();
      }

      if (rememberMe) localStorage.setItem('farmflow_user', JSON.stringify(userData));
      else sessionStorage.setItem('farmflow_user', JSON.stringify(userData));
      
      // Route based on roles
      if (userData.role === 'officer') navigate('/officer');
      else if (userData.role === 'vao') navigate('/vao');
      else navigate('/dashboard');

    } catch (error) {
      console.error("Error logging in: ", error);
      alert("Login failed: Incorrect email or password.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your registered Email Address above first, then click 'Forgot Password?'");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      alert("Password reset link sent successfully! Check your email inbox.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      alert("Failed to send reset link: " + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: '#2e7d32', textAlign: 'center', marginBottom: '30px' }}>🌱 FarmFlow Login</h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold' }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold' }}>Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '12px', paddingRight: '40px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
              <label htmlFor="remember" style={{ color: '#555', cursor: 'pointer' }}>Save login info</label>
            </div>
            <button type="button" onClick={handleForgotPassword} style={{ background: 'transparent', border: 'none', color: '#1976d2', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" style={{ padding: '14px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Log In</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#555' }}>Don't have an account? <Link to="/register" style={{ color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none' }}>Register Here</Link></p>
      </div>
    </div>
  );
};

export default Login;