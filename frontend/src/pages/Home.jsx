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
      background: 'linear-gradient(135deg, #e8f5e9 0%, #a5d6a7 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      
      {/* Hero Card Section */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        padding: '50px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        maxWidth: '700px',
        width: '100%',
        marginBottom: '60px'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🌾🤖</div>
        <h1 style={{ color: '#2e7d32', fontSize: '42px', margin: '0 0 15px 0' }}>FarmFlow AI</h1>
        <p style={{ color: '#555', fontSize: '18px', lineHeight: '1.6', marginBottom: '40px' }}>
          The future of smart agriculture. Harness the power of Artificial Intelligence to monitor soil health, predict weather impacts, and maximize your crop yields.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
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

      {/* Inspiring Quotes Section */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        padding: '40px', 
        borderRadius: '16px', 
        maxWidth: '700px', 
        width: '100%',
        marginBottom: '60px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ color: '#2e7d32', marginBottom: '15px', fontSize: '22px' }}>The Philosophy of Farming</h3>
        <blockquote style={{ 
          fontStyle: 'italic', 
          fontSize: '1.25rem', 
          color: '#444', 
          lineHeight: '1.5',
          borderLeft: '4px solid #2e7d32',
          paddingLeft: '15px',
          margin: '0 auto',
          textAlign: 'left'
        }}>
          "Agriculture is our wisest pursuit, because it will in the end contribute most to real wealth, good morals, and happiness."
        </blockquote>
        <p style={{ marginTop: '15px', fontWeight: 'bold', color: '#666', textAlign: 'right' }}>— Thomas Jefferson</p>
      </div>

      {/* Visual Design Grid with Images */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        maxWidth: '700px', 
        width: '100%',
        marginBottom: '40px'
      }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854" 
            alt="Farming Landscape" 
            style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
          />
          <div style={{ padding: '15px', color: '#333', fontWeight: '600' }}>Sustainable Fields</div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <img 
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449" 
            alt="Smart Tech Agriculture" 
            style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
          />
          <div style={{ padding: '15px', color: '#333', fontWeight: '600' }}>Smart Crop Analytics</div>
        </div>
      </div>

    </div>
  );
};

export default Home;