import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email === 'admin@farmflow.com' && password === 'admin123') {
      const adminData = {
        name: 'System Admin',
        email,
        role: 'admin'
      };

      sessionStorage.setItem(
        'farmflow_user',
        JSON.stringify(adminData)
      );

      navigate('/admin');
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const q = query(
        collection(db, 'users'),
        where(
          'email',
          '==',
          email.trim().toLowerCase()
        )
      );

      const querySnapshot = await getDocs(q);

      let userData = {
        name: 'User',
        email,
        role: 'farmer'
      };

      if (!querySnapshot.empty) {
        userData = querySnapshot.docs[0].data();
      }

      if (rememberMe) {
        localStorage.setItem(
          'farmflow_user',
          JSON.stringify(userData)
        );
      } else {
        sessionStorage.setItem(
          'farmflow_user',
          JSON.stringify(userData)
        );
      }

      if (userData.role === 'officer') {
        navigate('/officer');
      } else if (userData.role === 'vao') {
        navigate('/vao');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Error logging in: ', error);

      alert(
        'Login failed: Incorrect email or password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert(
        "Please enter your registered Email Address above first, then click 'Forgot Password?'"
      );
      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase()
      );

      alert(
        'Password reset link sent successfully! Check your email inbox.'
      );

    } catch (error) {
      console.error(
        'Error sending password reset email:',
        error
      );

      alert(
        'Failed to send reset link: ' +
          error.message
      );
    }
  };

  return (
    <div className="login-page">

      {/* LEFT BRAND PANEL */}
      <div className="login-brand-panel">

        <div className="login-brand-content">

          <Link to="/" className="login-brand">
            <span className="login-brand-icon">
              🌱
            </span>

            <span>
              FarmFlow <b>AI</b>
            </span>
          </Link>

          <div className="login-brand-copy">

            <div className="login-eyebrow">
              SMART AGRICULTURE PLATFORM
            </div>

            <h1>
              Smarter farming starts
              <span> here.</span>
            </h1>

            <p>
              Manage your farm, monitor market
              opportunities, understand weather
              conditions and track procurement —
              all from one intelligent platform.
            </p>

          </div>

          <div className="login-feature-list">

            <div className="login-feature">
              <span>✓</span>
              <div>
                <strong>Market intelligence</strong>
                <small>
                  Make informed crop decisions.
                </small>
              </div>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <div>
                <strong>AI-powered insights</strong>
                <small>
                  Turn agricultural data into action.
                </small>
              </div>
            </div>

            <div className="login-feature">
              <span>✓</span>
              <div>
                <strong>Digital workflows</strong>
                <small>
                  Reduce paperwork and delays.
                </small>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* LOGIN PANEL */}
      <div className="login-form-panel">

        <div className="login-mobile-brand">
          <Link to="/" className="login-brand">
            <span className="login-brand-icon">
              🌱
            </span>

            <span>
              FarmFlow <b>AI</b>
            </span>
          </Link>
        </div>

        <div className="login-card">

          <div className="login-card-header">

            <div className="login-avatar">
              👨‍🌾
            </div>

            <div>
              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to continue to your farm workspace.
              </p>
            </div>

          </div>

          <form onSubmit={handleLogin}>

            {/* EMAIL */}
            <div className="form-group">

              <label htmlFor="email">
                Email address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? '◉' : '○'}
                </button>

              </div>

            </div>

            {/* OPTIONS */}
            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span>
                  Keep me signed in
                </span>

              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>

            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
            >

              {isSubmitting ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span>→</span>
                </>
              )}

            </button>

          </form>

          <div className="login-divider">
            <span>New to FarmFlow?</span>
          </div>

          <Link
            to="/register"
            className="create-account-link"
          >
            Create a farmer account
            <span>→</span>
          </Link>

          <p className="login-security">
            🔐 Your account information is protected
            with secure authentication.
          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;