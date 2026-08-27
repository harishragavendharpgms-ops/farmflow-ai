import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate(); // 2. Initialize the navigation tool

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post("https://farmflow-ai-84t0.onrender.com/register", formData);
      setMessage(`Success! Redirecting to login...`);
      
      // 3. Wait 1.5 seconds so they can read the message, then redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage(`Error: ${errorMsg}`);
      setLoading(false); // Stop loading only if there's an error
    }
  };

  return (
    <div className="register-container" style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Create Account</h2>
      <p>Join FarmFlow AI and manage your farming smarter</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" name="name" placeholder="Full Name" required onChange={handleChange} style={{ padding: '10px' }} />
        <input type="email" name="email" placeholder="Email" required onChange={handleChange} style={{ padding: '10px' }} />
        <input type="tel" name="phone" placeholder="Phone Number" required onChange={handleChange} style={{ padding: '10px' }} />
        <input type="password" name="password" placeholder="Password" required onChange={handleChange} style={{ padding: '10px' }} />
        
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: loading ? '#ccc' : '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {loading ? 'Processing...' : 'Create Account'}
        </button>
      </form>

      {message && <p style={{ marginTop: '15px', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
};

export default Register;