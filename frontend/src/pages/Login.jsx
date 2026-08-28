import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Seed default admin and mock database on first load
  useEffect(() => {
    const existingUsers = JSON.parse(localStorage.getItem('farmflow_users') || '[]');
    if (existingUsers.length === 0) {
      localStorage.setItem('farmflow_users', JSON.stringify([
        { name: 'System Admin', email: 'admin@farmflow.com', password: 'admin123', role: 'admin' }
      ]));
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('farmflow_users') || '[]');
    
    // Check if user exists in our local "database" (Admin or Officer)
    const existingUser = users.find(u => u.email === email && u.password === password);
    
    // If not found, default to a standard Farmer for demo purposes
    const userData = existingUser || { name: 'Farmer User', email: email, role: 'farmer' };

    if (rememberMe) {
      localStorage.setItem('farmflow_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('farmflow_user', JSON.stringify(userData));
    }
    
    // Route based on role
    if (userData.role === 'admin') navigate('/admin');
    else if (userData.role === 'officer') navigate('/officer');
    else navigate('/dashboard');
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