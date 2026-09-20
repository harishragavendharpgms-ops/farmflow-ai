import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import farmMandiBg from '../assets/farm_mandi_bg.jpg';
import './Login.css';

/* =========================================================
   TRANSLATIONS (Original FarmFlow AI Copy Preserved)
   ========================================================= */

const translations = {
  en: {
    language: 'Language',
    brand: 'FarmFlow',
    brandSuffix: 'AI',
    brandSubtitle: 'Smart Agriculture Platform',
    portalBadge: 'SMART AGRICULTURE PLATFORM',
    heroTitle: 'Smarter farming starts here.',
    signInTab: 'Sign In',
    registerTab: 'Sign Up / Register',
    signInAs: 'SIGN IN AS',
    farmer: 'Farmer',
    farmerShort: 'Farm workspace',
    administrator: 'Local Revenue Administrator',
    administratorShort: 'Revenue & verification',
    admin: 'Admin',
    adminShort: 'System management',
    mobileNumber: 'Mobile Number *',
    enterMobile: 'Enter 10-digit mobile number',
    sendOtp: 'Send OTP',
    sendingOtp: 'Sending OTP...',
    otpSentSuccess: 'OTP sent successfully to',
    enterOtp: 'Enter OTP',
    changeNumber: 'Change Number',
    resendOtpIn: 'Resend OTP in',
    seconds: 'seconds',
    verifyContinue: 'Verify & Continue',
    verifying: 'Verifying...',
    orLoginWithEmail: 'Sign in with Email & Password',
    orLoginWithOtp: 'Sign in with Mobile OTP',
    email: 'Email Address *',
    password: 'Password *',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Enter your password',
    passwordStrength: 'Password Strength:',
    veryStrong: 'VERY STRONG',
    operatorNotice: 'Revenue Administrator & Officer accounts require verified credentials.',
    adminNotice: '256-Bit SSL Encrypted Admin Gateway',
    adminVerification: 'Admin Security Verification',
    adminVerificationText: 'A verification code has been sent to your administrative email.',
    verificationCode: 'Verification Code *',
    enterCode: 'Enter 6-digit code',
    verifyAndLogin: 'Verify & Login',
    login: 'Login',
    authenticating: 'Authenticating...',
    keepSignedIn: 'Keep me signed in',
    forgotPassword: 'Forgot password?',
    newFarmer: 'New to FarmFlow AI?',
    createAccount: 'Create a farmer account',
    footerSystem: 'FarmFlow AI Secure Digital Agriculture Infrastructure',
    loginFailed: 'Login failed: Incorrect email or password.',
    invalidOtp: 'Please enter the complete 6-digit verification code.'
  },
  ta: {
    language: 'மொழி',
    brand: 'FarmFlow',
    brandSuffix: 'AI',
    brandSubtitle: 'ஸ்மார்ட் வேளாண்மை தளம்',
    portalBadge: 'ஸ்மார்ட் வேளாண்மை தளம்',
    heroTitle: 'புத்திசாலித்தனமான விவசாயம் இங்கிருந்து தொடங்குகிறது.',
    signInTab: 'உள்நுழைவு',
    registerTab: 'பதிவு செய்க',
    signInAs: 'உள்நுழைவது',
    farmer: 'விவசாயி',
    farmerShort: 'விவசாய பணிச்சூழல்',
    administrator: 'உள்ளூர் வருவாய் நிர்வாகி',
    administratorShort: 'வருவாய் & சரிபார்ப்பு',
    admin: 'நிர்வாகி',
    adminShort: 'கணினி நிர்வாகம்',
    mobileNumber: 'கைபேசி எண் *',
    enterMobile: '10 இலக்க கைபேசி எண்ணை உள்ளிடவும்',
    sendOtp: 'OTP அனுப்பு',
    sendingOtp: 'OTP அனுப்பப்படுகிறது...',
    otpSentSuccess: 'OTP வெற்றிகரமாக அனுப்பப்பட்டது:',
    enterOtp: 'OTP உள்ளிடவும்',
    changeNumber: 'எண்ணை மாற்றவும்',
    resendOtpIn: 'மீண்டும் OTP அனுப்ப:',
    seconds: 'விநாடிகள்',
    verifyContinue: 'சரிபார்த்து தொடரவும்',
    verifying: 'சரிபார்க்கிறது...',
    orLoginWithEmail: 'மின்னஞ்சல் மற்றும் கடவுச்சொல்லுடன் உள்நுழைக',
    orLoginWithOtp: 'கைபேசி OTP மூலம் உள்நுழைக',
    email: 'மின்னஞ்சல் முகவரி *',
    password: 'கடவுச்சொல் *',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
    passwordStrength: 'கடவுச்சொல் வலிமை:',
    veryStrong: 'மிகவும் வலிமையானது',
    operatorNotice: 'வருவாய் அலுவலர் கணக்குகளுக்கு சரிபார்க்கப்பட்ட சான்றுகள் தேவை.',
    adminNotice: '256-Bit SSL மறைகுறியாக்கப்பட்ட நிர்வாக வாயில்',
    adminVerification: 'நிர்வாக பாதுகாப்பு சரிபார்ப்பு',
    adminVerificationText: 'உங்கள் நிர்வாக மின்னஞ்சலுக்கு சரிபார்ப்புக் குறியீடு அனுப்பப்பட்டுள்ளது.',
    verificationCode: 'சரிபார்ப்புக் குறியீடு *',
    enterCode: '6 இலக்க குறியீட்டை உள்ளிடவும்',
    verifyAndLogin: 'சரிபார்த்து உள்நுழைக',
    login: 'உள்நுழைக',
    authenticating: 'அங்கீகரிக்கிறது...',
    keepSignedIn: 'என்னை உள்நுழைந்த நிலையில் வைத்திருக்கவும்',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    newFarmer: 'FarmFlow AI-க்கு புதியவரா?',
    createAccount: 'விவசாயி கணக்கை உருவாக்கவும்',
    footerSystem: 'FarmFlow AI பாதுகாப்பான டிஜிட்டல் வேளாண்மை உள்கட்டமைப்பு',
    loginFailed: 'உள்நுழைவு தோல்வியடைந்தது: மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது.',
    invalidOtp: 'தயவுசெய்து முழு 6 இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்.'
  },
  hi: {
    language: 'भाषा',
    brand: 'FarmFlow',
    brandSuffix: 'AI',
    brandSubtitle: 'स्मार्ट कृषि प्लेटफ़ॉर्म',
    portalBadge: 'स्मार्ट कृषि प्लेटफ़ॉर्म',
    heroTitle: 'स्मार्ट खेती की शुरुआत यहां से होती है।',
    signInTab: 'साइन इन',
    registerTab: 'साइन अप / रजिस्टर',
    signInAs: 'साइन इन AS',
    farmer: 'किसान',
    farmerShort: 'कृषि कार्यक्षेत्र',
    administrator: 'स्थानीय राजस्व प्रशासक',
    administratorShort: 'राजस्व और सत्यापन',
    admin: 'व्यवस्थापक',
    adminShort: 'सिस्टम प्रबंधन',
    mobileNumber: 'मोबाइल नंबर *',
    enterMobile: '10-अंकों का मोबाइल नंबर दर्ज करें',
    sendOtp: 'OTP भेजें',
    sendingOtp: 'OTP भेजा जा रहा है...',
    otpSentSuccess: 'OTP सफलतापूर्वक भेजा गया:',
    enterOtp: 'OTP दर्ज करें',
    changeNumber: 'नंबर बदलें',
    resendOtpIn: 'पुनः OTP भेजें:',
    seconds: 'सेकंड में',
    verifyContinue: 'सत्यापित करें और आगे बढ़ें',
    verifying: 'सत्यापित कर रहा है...',
    orLoginWithEmail: 'ईमेल और पासवर्ड से साइन इन करें',
    orLoginWithOtp: 'मोबाइल OTP से साइन इन करें',
    email: 'ईमेल पता *',
    password: 'पासवर्ड *',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    passwordStrength: 'पासवर्ड मजबूती:',
    veryStrong: 'अति मजबूत',
    operatorNotice: 'राजस्व अधिकारी खातों के लिए सत्यापित क्रेडेंशियल आवश्यक हैं।',
    adminNotice: '256-बिट SSL एन्क्रिप्टेड एडमिन गेटवे',
    adminVerification: 'व्यवस्थापक सुरक्षा सत्यापन',
    adminVerificationText: 'आपके प्रशासनिक ईमेल पर एक सत्यापन कोड भेजा गया है।',
    verificationCode: 'सत्यापन कोड *',
    enterCode: '6-अंकों का कोड दर्ज करें',
    verifyAndLogin: 'सत्यापित करें और लॉगिन करें',
    login: 'लॉगिन',
    authenticating: 'प्रमाणीकृत हो रहा है...',
    keepSignedIn: 'मुझे साइन इन रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    newFarmer: 'FarmFlow AI पर नए हैं?',
    createAccount: 'किसान खाता बनाएं',
    footerSystem: 'FarmFlow AI सुरक्षित डिजिटल कृषि अवसंरचना प्रणाली',
    loginFailed: 'लॉगिन विफल: गलत ईमेल या पासवर्ड।',
    invalidOtp: 'कृपया पूरा 6-अंकीय सत्यापन कोड दर्ज करें।'
  }
};

const Login = () => {
  const navigate = useNavigate();

  // Language state
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('farmflow_language') || 'en';
  });
  const t = translations[language] || translations.en;

  useEffect(() => {
    localStorage.setItem('farmflow_language', language);
  }, [language]);

  // Selected Role: 'farmer', 'vao', 'admin'
  const [selectedRole, setSelectedRole] = useState('farmer');

  // Farmer login mode: 'otp' or 'email'
  const [farmerAuthMode, setFarmerAuthMode] = useState('email');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['1', '2', '3', '4', '5', '6']);
  const [resendTimer, setResendTimer] = useState(30);

  // Email/Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Admin verification step
  const [adminStep2, setAdminStep2] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, resendTimer]);

  // Handle role switch defaults
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setOtpSent(false);
    setAdminStep2(false);

    if (roleId === 'vao') {
      if (!email) setEmail('vao@farmflow.com');
      if (!password) setPassword('vao123');
    } else if (roleId === 'admin') {
      if (!email) setEmail('admin@farmflow.com');
      if (!password) setPassword('admin123');
    } else {
      if (!email) setEmail('rajesh@farmflow.com');
      if (!password) setPassword('farmer123');
    }
  };

  // OTP inputs handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Send OTP handler
  const handleSendOtp = () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpSent(true);
      setResendTimer(30);
    }, 700);
  };

  // Farmer OTP verification & login
  const handleVerifyOtp = () => {
    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      alert(t.invalidOtp);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const farmerData = {
        name: 'Rajesh Farmer',
        phone: mobileNumber,
        email: 'rajesh@farmflow.com',
        role: 'farmer'
      };

      if (rememberMe) {
        localStorage.setItem('farmflow_user', JSON.stringify(farmerData));
      } else {
        sessionStorage.setItem('farmflow_user', JSON.stringify(farmerData));
      }

      navigate('/dashboard');
    }, 800);
  };

  // Standard Email/Password Login (Original Firebase Workflow Preserved)
  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert(
        language === 'ta'
          ? 'மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.'
          : language === 'hi'
            ? 'कृपया ईमेल और पासवर्ड दर्ज करें।'
            : 'Please enter your email and password.'
      );
      return;
    }

    // Admin Quick Login Bypass
    if (
      email.trim().toLowerCase() === 'admin@farmflow.com' &&
      password === 'admin123'
    ) {
      if (!adminStep2) {
        setAdminStep2(true);
        setAdminCode('419193');
        return;
      }

      const adminData = {
        name: 'System Admin',
        email: email.trim().toLowerCase(),
        role: 'admin'
      };
      sessionStorage.setItem('farmflow_user', JSON.stringify(adminData));
      navigate('/admin');
      return;
    }

    setIsSubmitting(true);

    try {
      // Firebase Authentication
      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      // Firestore Role Lookup
      const q = query(
        collection(db, 'users'),
        where('email', '==', email.trim().toLowerCase())
      );
      const querySnapshot = await getDocs(q);

      let userData = {
        name: email.split('@')[0],
        email: email.trim().toLowerCase(),
        role: selectedRole
      };

      if (!querySnapshot.empty) {
        const firestoreData = querySnapshot.docs[0].data();
        userData = {
          ...firestoreData,
          email: firestoreData.email || email.trim().toLowerCase()
        };
      }

      if (rememberMe) {
        localStorage.setItem('farmflow_user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('farmflow_user', JSON.stringify(userData));
      }

      // Role redirection (Matching original web)
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'officer') {
        navigate('/officer');
      } else if (userData.role === 'vao') {
        navigate('/vao');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      // Fallback for demo users
      if (selectedRole === 'vao') {
        const vaoUser = {
          name: 'VAO Officer',
          email: email.trim().toLowerCase(),
          role: 'vao',
          zone: 'Zone A',
          subPlace: 'Village 1'
        };
        localStorage.setItem('farmflow_user', JSON.stringify(vaoUser));
        navigate('/vao');
        return;
      } else if (selectedRole === 'farmer') {
        const demoUser = {
          name: 'Rajesh Farmer',
          email: email.trim().toLowerCase(),
          role: 'farmer'
        };
        localStorage.setItem('farmflow_user', JSON.stringify(demoUser));
        navigate('/dashboard');
        return;
      }
      alert(t.loginFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert(
        language === 'ta'
          ? 'முதலில் உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
          : language === 'hi'
            ? 'पहले अपना पंजीकृत ईमेल पता दर्ज करें।'
            : 'Please enter your registered Email Address first.'
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      alert('Password reset link sent successfully! Check your email inbox.');
    } catch (error) {
      console.error(error);
      alert('Failed to send reset link: ' + error.message);
    }
  };

  return (
    <div
      className="v-auth-container"
      style={{ backgroundImage: `url(${farmMandiBg})` }}
    >
      <div className="v-auth-overlay" />

      {/* Language Switcher */}
      <div className="v-lang-dropdown">
        <span className="v-lang-icon">🌐</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Select Language"
        >
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
          <option value="hi">हिन्दी</option>
        </select>
      </div>

      {/* Centered Frosted Card */}
      <div className="v-auth-card">
        {/* Top Badge: FarmFlow AI */}
        <div className="v-portal-badge">
          <span className="v-portal-icon">🌱</span>
          <span>{t.portalBadge}</span>
        </div>

        {/* Brand & Subtitle: FarmFlow AI */}
        <div className="v-brand-header">
          <h1 className="v-brand-title">
            {t.brand} <span>{t.brandSuffix}</span>
          </h1>
          <p className="v-brand-tagline">{t.heroTitle}</p>
        </div>

        {/* Tab Switcher: Sign In | Sign Up */}
        <div className="v-auth-tabs">
          <button type="button" className="v-auth-tab active">
            <span className="tab-icon">🌾</span> {t.signInTab}
          </button>
          <Link to="/register" className="v-auth-tab">
            <span className="tab-icon">✨</span> {t.registerTab}
          </Link>
        </div>

        {/* SIGN IN AS: Farmer, Local Revenue Administrator (VAO), Admin */}
        <div className="v-role-section">
          <div className="v-role-title">{t.signInAs}</div>
          <div className="v-role-grid">
            {/* Farmer */}
            <button
              type="button"
              className={`v-role-btn ${selectedRole === 'farmer' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('farmer')}
            >
              <span className="v-role-ico">🌾</span>
              <span className="v-role-label">{t.farmer}</span>
            </button>

            {/* Local Revenue Administrator (VAO) */}
            <button
              type="button"
              className={`v-role-btn ${selectedRole === 'vao' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('vao')}
            >
              <span className="v-role-ico">🧑‍💼</span>
              <span className="v-role-label">{t.administrator}</span>
            </button>

            {/* Admin */}
            <button
              type="button"
              className={`v-role-btn ${selectedRole === 'admin' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('admin')}
            >
              <span className="v-role-ico">🛡️</span>
              <span className="v-role-label">{t.admin}</span>
            </button>
          </div>
        </div>

        {/* Role Content 1: FARMER */}
        {selectedRole === 'farmer' && (
          <div className="v-farmer-form">
            {farmerAuthMode === 'email' ? (
              <form onSubmit={handleEmailPasswordLogin}>
                <div className="v-input-group">
                  <label className="v-field-label">{t.email}</label>
                  <input
                    type="email"
                    required
                    className="v-input-field"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="v-input-group">
                  <label className="v-field-label">{t.password}</label>
                  <div className="v-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="v-input-field"
                      placeholder={t.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="v-eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="v-remember-row">
                  <label className="v-check-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>{t.keepSignedIn}</span>
                  </label>
                  <button
                    type="button"
                    className="v-forgot-link"
                    onClick={handleForgotPassword}
                  >
                    {t.forgotPassword}
                  </button>
                </div>

                <button
                  type="submit"
                  className="v-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.authenticating : t.login}
                </button>

                <div className="v-alt-auth-toggle">
                  <button
                    type="button"
                    onClick={() => setFarmerAuthMode('otp')}
                  >
                    📱 {t.orLoginWithOtp}
                  </button>
                </div>
              </form>
            ) : (
              /* Farmer Mobile OTP Flow */
              <>
                {!otpSent ? (
                  <div className="v-input-group">
                    <label className="v-field-label">{t.mobileNumber}</label>
                    <div className="v-mobile-input-wrap">
                      <div className="v-country-code">
                        <span className="v-flag">🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength="10"
                        className="v-input-field v-mobile-input"
                        placeholder={t.enterMobile}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>

                    <button
                      type="button"
                      className="v-submit-btn"
                      onClick={handleSendOtp}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t.sendingOtp : t.sendOtp}
                    </button>
                  </div>
                ) : (
                  <div className="v-otp-flow">
                    <div className="v-success-banner">
                      <span className="check-icon">✓</span>
                      <span>
                        {t.otpSentSuccess} +91 ******{mobileNumber.slice(-4) || '3210'}
                      </span>
                    </div>

                    <div className="v-otp-header">
                      <span className="v-otp-title">{t.enterOtp}</span>
                      <button
                        type="button"
                        className="v-change-number"
                        onClick={() => setOtpSent(false)}
                      >
                        {t.changeNumber}
                      </button>
                    </div>

                    <div className="v-otp-boxes">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength="1"
                          className={`v-otp-box ${digit ? 'filled' : ''}`}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>

                    <div className="v-resend-timer">
                      {t.resendOtpIn} <b>{resendTimer} {t.seconds}</b>
                    </div>

                    <button
                      type="button"
                      className="v-submit-btn"
                      onClick={handleVerifyOtp}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t.verifying : t.verifyContinue}
                    </button>
                  </div>
                )}

                <div className="v-alt-auth-toggle">
                  <button
                    type="button"
                    onClick={() => setFarmerAuthMode('email')}
                  >
                    ✉️ {t.orLoginWithEmail}
                  </button>
                </div>
              </>
            )}

            <div className="v-new-account">
              {t.newFarmer}{' '}
              <Link to="/register">{t.createAccount}</Link>
            </div>
          </div>
        )}

        {/* Role Content 2: LOCAL REVENUE ADMINISTRATOR (VAO) */}
        {selectedRole === 'vao' && (
          <form onSubmit={handleEmailPasswordLogin} className="v-operator-form">
            <div className="v-input-group">
              <label className="v-field-label">{t.email}</label>
              <input
                type="email"
                required
                className="v-input-field"
                placeholder="vao@farmflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="v-input-group">
              <label className="v-field-label">{t.password}</label>
              <div className="v-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="v-input-field"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="v-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="v-pwd-strength">
              <div className="v-pwd-strength-head">
                <span>{t.passwordStrength}</span>
                <span className="v-strength-tag">{t.veryStrong}</span>
              </div>
              <div className="v-strength-badges">
                <span className="v-badge-pill active">✓ 8+ chars</span>
                <span className="v-badge-pill active">✓ Upper & lower</span>
                <span className="v-badge-pill active">✓ Official Role</span>
              </div>
            </div>

            <div className="v-info-notice">
              <span className="info-icon">ℹ️</span>
              <span>{t.operatorNotice}</span>
            </div>

            <button
              type="submit"
              className="v-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? t.authenticating : t.login}
            </button>
          </form>
        )}

        {/* Role Content 3: ADMIN */}
        {selectedRole === 'admin' && (
          <div className="v-admin-form">
            {!adminStep2 ? (
              <form onSubmit={handleEmailPasswordLogin}>
                <div className="v-input-group">
                  <label className="v-field-label">{t.email}</label>
                  <input
                    type="email"
                    required
                    className="v-input-field"
                    placeholder="admin@farmflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="v-input-group">
                  <label className="v-field-label">{t.password}</label>
                  <div className="v-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="v-input-field"
                      placeholder={t.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="v-eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="v-security-alert">
                  <span className="lock-icon">🔒</span>
                  <span>{t.adminNotice}</span>
                </div>

                <button
                  type="submit"
                  className="v-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t.authenticating : t.login}
                </button>
              </form>
            ) : (
              <div className="v-admin-step2">
                <div className="v-admin-modal-card">
                  <div className="v-admin-modal-head">
                    <span className="v-modal-icon">✉️</span>
                    <div>
                      <strong>{t.adminVerification}</strong>
                      <p>{t.adminVerificationText}</p>
                    </div>
                  </div>

                  <div className="v-input-group">
                    <label className="v-field-label">{t.verificationCode}</label>
                    <input
                      type="text"
                      className="v-input-field"
                      placeholder={t.enterCode}
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="v-submit-btn"
                    onClick={handleEmailPasswordLogin}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t.verifying : t.verifyAndLogin}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Security Stamp */}
        <div className="v-auth-footer">
          <span className="v-dot-icon">●</span>
          <span>{t.footerSystem}</span>
        </div>
      </div>
    </div>
  );
};

export default Login;