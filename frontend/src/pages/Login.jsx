import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post("https://farmflow-ai-84t0.onrender.com/login", formData);
      setMessage(`Welcome back, ${response.data.name}!`);
      // Here is where you will eventually redirect them to a Dashboard
    } catch (err) {
      // Safely grab the error detail from FastAPI, or fall back to a generic message
      const errorMsg = err.response?.data?.detail || "Could not connect to server.";
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Login</h2>
      <p>Welcome back to FarmFlow AI</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" name="email" placeholder="Email" 
          required onChange={handleChange} style={{ padding: '10px' }} 
        />
        <input 
          type="password" name="password" placeholder="Password" 
          required onChange={handleChange} style={{ padding: '10px' }} 
        />
        
        <button type="submit" disabled={loading} style={{ 
          padding: '12px', backgroundColor: loading ? '#ccc' : '#007bff', 
          color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' 
        }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '15px', color: message.includes('Error') ? 'red' : 'green' }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Login;