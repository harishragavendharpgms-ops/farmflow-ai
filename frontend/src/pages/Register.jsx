import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase'; 
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  
  // States for eye toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match! Please re-type correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim().toLowerCase(), 
        formData.password
      );
      const user = userCredential.user;

      // 2. Save user details in Firestore using their Auth UID
      const userDoc = {
        uid: user.uid,
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        role: 'farmer',
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      alert("Registration successful!");
      navigate('/login');
    } catch (error) {
      console.error(error);
      alert("Registration failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: "'Segoe UI', sans-serif" }}>
      <h2 style={{ textAlign: 'center', color: '#2e7d32', margin: '0 0 20px 0' }}>Farmer Registration</h2>
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Full Name" 
          required 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
        />
        
        <input 
          type="email" 
          placeholder="Email Address" 
          required 
          value={formData.email} 
          onChange={e => setFormData({...formData, email: e.target.value})} 
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
        />
        
        <input 
          type="tel" 
          placeholder="Phone Number (e.g. 9876543210)" 
          required 
          value={formData.phone} 
          onChange={e => setFormData({...formData, phone: e.target.value})} 
          style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
        />

        {/* Password Field with Eye Toggle */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            required 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}
          >
            {showPassword ? "👁️" : "🙈"}
          </button>
        </div>

        {/* Re-type Password Field with Eye Toggle */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input 
            type={showConfirmPassword ? "text" : "password"} 
            placeholder="Re-type Password" 
            required 
            value={formData.confirmPassword} 
            onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
            style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} 
          />
          <button 
            type="button" 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }}
          >
            {showConfirmPassword ? "👁️" : "🙈"}
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting} 
          style={{ padding: '12px', background: isSubmitting ? '#999' : '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '16px' }}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', color: '#555' }}>
        Already have an account? <Link to="/login" style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link>
      </p>
    </div>
  );
};

export default Register;