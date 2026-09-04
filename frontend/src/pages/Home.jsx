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
      background: 'linear-gradient(135deg, #f1f8e9 0%, #c8e6c9 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      
      {/* Hero Header Section */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        padding: '50px 30px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        width: '100%',
        marginBottom: '40px'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '15px' }}>🌾🤖</div>
        <h1 style={{ color: '#1b5e20', fontSize: '42px', margin: '0 0 15px 0', fontWeight: 'bold' }}>FarmFlow AI</h1>
        <p style={{ color: '#444', fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>
          Your digital agricultural partner. Empowering farmers and officers with smart AI monitoring, accurate weather forecasting, and fast access to land documents.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/register')}
            style={{ padding: '14px 28px', fontSize: '16px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(46, 125, 50, 0.3)' }}
          >
            Get Started
          </button>
          
          <button 
            onClick={() => navigate('/login')}
            style={{ padding: '14px 28px', fontSize: '16px', backgroundColor: 'white', color: '#2e7d32', border: '2px solid #2e7d32', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Log In
          </button>
        </div>
      </div>

      {/* Direct Links: Patta Chitta & Land Document Services */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '35px 30px', 
        borderRadius: '20px', 
        maxWidth: '800px', 
        width: '100%',
        marginBottom: '40px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
        borderLeft: '6px solid #2e7d32',
        textAlign: 'left'
      }}>
        <h2 style={{ color: '#1b5e20', fontSize: '24px', marginBottom: '10px' }}>📜 Official Land & Patta Chitta Services</h2>
        <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>
          Quickly access government portals to verify land ownership, view Chitta extracts, and download official records.
        </p>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a 
            href="https://eservices.tn.gov.in/eservicesnew/land/chittaگر_en.html" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              flex: '1 1 240px', 
              padding: '12px 20px', 
              backgroundColor: '#e8f5e9', 
              color: '#2e7d32', 
              border: '1px solid #a5d6a7', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              fontWeight: '600',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            View Patta & Chitta Download ↗
          </a>
          
          <a 
            href="https://eservices.tn.gov.in/eservicesnew/index.html" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              flex: '1 1 240px', 
              padding: '12px 20px', 
              backgroundColor: '#e8f5e9', 
              color: '#2e7d32', 
              border: '1px solid #a5d6a7', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              fontWeight: '600',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            TN e-Services Portal ↗
          </a>
        </div>
      </div>

      {/* Inspiring Quotes Section */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        padding: '35px 30px', 
        borderRadius: '20px', 
        maxWidth: '800px', 
        width: '100%',
        marginBottom: '40px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.08)'
      }}>
        <blockquote style={{ 
          fontStyle: 'italic', 
          fontSize: '1.2rem', 
          color: '#333', 
          lineHeight: '1.6',
          margin: '0 0 15px 0'
        }}>
          "Agriculture is our wisest pursuit, because it will in the end contribute most to real wealth, good morals, and happiness."
        </blockquote>
        <p style={{ fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>— Thomas Jefferson</p>
      </div>

      {/* Visual Design Grid with Images */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        maxWidth: '800px', 
        width: '100%',
        marginBottom: '40px'
      }}>
        <div style={{ backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854" 
            alt="Farming Landscape" 
            style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
          />
          <div style={{ padding: '15px', color: '#2e7d32', fontWeight: 'bold' }}>Sustainable Fields</div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <img 
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449" 
            alt="Smart Tech Agriculture" 
            style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
          />
          <div style={{ padding: '15px', color: '#2e7d32', fontWeight: 'bold' }}>Smart Analytics & AI</div>
        </div>
      </div>

    </div>
  );
};

export default Home;