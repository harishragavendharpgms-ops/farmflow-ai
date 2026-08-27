import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      textAlign: 'center',
      padding: '20px'
    }}>
      
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        padding: '50px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🌾🤖</div>
        <h1 style={{ color: '#2e7d32', fontSize: '42px', margin: '0 0 15px 0' }}>FarmFlow AI</h1>
        <p style={{ color: '#555', fontSize: '18px', lineHeight: '1.6', marginBottom: '40px' }}>
          The future of smart agriculture. Harness the power of Artificial Intelligence to monitor soil health, predict weather impacts, and maximize your crop yields.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/register')}
            style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 125, 50, 0.3)' }}
          >
            Get Started
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '15px 30px', fontSize: '18px', backgroundColor: 'white', color: '#2e7d32', border: '2px solid #2e7d32', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Log In
          </button>
        </div>
      </div>

    </div>
  );
};

export default Home;