import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: OTP
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    // Simulate sending an OTP to the user's phone/email
    setMessage('Verification code sent to your email and phone.');
    setStep(2); 
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    
    // In a real app, you would check the OTP here. For the hackathon, we accept any code.
    try {
      const response = await axios.post("https://farmflow-ai-84t0.onrender.com/register", formData);
      setMessage(`Verification successful! Redirecting to login...`);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.detail || err.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', fontFamily: 'sans-serif' }}>
      <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>{step === 1 ? 'Create Account' : 'Verify Identity'}</h2>
        <p style={{ color: '#777', marginBottom: '30px' }}>
          {step === 1 ? 'Join FarmFlow AI today' : `Enter the 4-digit code sent to ${formData.phone}`}
        </p>
        
        {step === 1 ? (
          <form onSubmit={handleInitialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" name="name" placeholder="Full Name" required onChange={handleChange} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <input type="tel" name="phone" placeholder="Phone Number" required onChange={handleChange} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
            <input type="password" name="password" placeholder="Password" required onChange={handleChange} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }} />
            
            <button type="submit" style={{ padding: '14px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" maxLength="4" placeholder="e.g. 1234" required value={otp} onChange={(e) => setOtp(e.target.value)} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', fontSize: '20px', letterSpacing: '5px' }} />
            <button type="submit" disabled={loading} style={{ padding: '14px', backgroundColor: loading ? '#ccc' : '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
              {loading ? 'Verifying...' : 'Verify & Register'}
            </button>
          </form>
        )}

        {message && <p style={{ marginTop: '15px', color: message.includes('Error') ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>{message}</p>}
        
        {step === 1 && (
          <p style={{ marginTop: '20px', color: '#555' }}>
            Already have an account? <Link to="/login" style={{ color: '#2e7d32', textDecoration: 'none', fontWeight: 'bold' }}>Log in here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;