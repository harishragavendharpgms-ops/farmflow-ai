import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const response = await axios.post("https://farmflow-ai-84t0.onrender.com/login", formData);
      setMessage(`Welcome back, ${response.data.name}! Redirecting...`);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.detail || "Could not connect."}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>Welcome Back</h2>
        <p style={{ color: '#777', marginBottom: '30px' }}>Log in to your FarmFlow dashboard</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
          <input type="password" name="password" placeholder="Password" required onChange={handleChange} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
          
          <button type="submit" disabled={loading} style={{ padding: '14px', backgroundColor: loading ? '#ccc' : '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        {message && <p style={{ marginTop: '15px', color: message.includes('Error') ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{message}</p>}
        
        <p style={{ marginTop: '20px', color: '#555' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2e7d32', textDecoration: 'none', fontWeight: 'bold' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;