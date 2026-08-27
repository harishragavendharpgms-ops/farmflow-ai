import React, { useState } from 'react';
import axios from 'axios';
import './Register.css'; // Assuming you have standard CSS

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
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
      const response = await axios.post("https://farmflow-ai-84t0.onrender.com/register", formData);
      setMessage(`Success! Welcome, ${response.data.email}`);
      // Redirect to login here if needed
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
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
          {loading ? 'Connecting to Server...' : 'Create Account'}
        </button>
      </form>

      {message && <p style={{ marginTop: '15px', color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
};

export default Register;