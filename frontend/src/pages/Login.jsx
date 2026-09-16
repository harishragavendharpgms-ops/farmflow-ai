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

import './Login.css';

/* =========================================================
   TRANSLATIONS
   ========================================================= */

const translations = {
  en: {
    language: 'Language',

    brand: 'FarmFlow',
    smartPlatform: 'SMART AGRICULTURE PLATFORM',

    heroTitle1: 'Smarter farming starts',
    heroTitle2: ' here.',

    heroDescription:
      'Manage farms, monitor market opportunities, understand weather conditions and track procurement through one intelligent platform.',

    marketIntelligence: 'Market intelligence',
    marketDescription:
      'Make informed crop decisions.',

    aiInsights: 'AI-powered insights',
    aiDescription:
      'Turn agricultural data into action.',

    digitalWorkflows: 'Digital workflows',
    digitalDescription:
      'Reduce paperwork and delays.',

    welcome: 'Welcome back',
    signInDescription:
      'Choose your workspace and sign in.',

    signInAs: 'SIGN IN AS',
    selectRole: 'Select your role',

    farmer: 'Farmer',
    farmerShort: 'Farm workspace',
    farmerDescription:
      'Manage your farm, crops and market activities.',

    administrator: 'Local Revenue Administrator',
    administratorShort: 'Revenue & verification',
    administratorDescription:
      'Verify farmer applications and land documents.',

    admin: 'Admin',
    adminShort: 'System management',
    adminDescription:
      'Manage users, workflows and platform operations.',

    workspace: 'workspace',

    email: 'Email address',
    password: 'Password',

    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Enter your password',

    keepSignedIn: 'Keep me signed in',
    forgotPassword: 'Forgot password?',

    continueAs: 'Continue as',

    signingIn: 'Signing in...',

    newToFarmFlow: 'New to FarmFlow?',
    createFarmerAccount: 'Create a farmer account',

    security:
      'Your account information is protected with secure authentication.'
  },

  ta: {
    language: 'மொழி',

    brand: 'FarmFlow',
    smartPlatform: 'ஸ்மார்ட் வேளாண்மை தளம்',

    heroTitle1: 'புத்திசாலித்தனமான விவசாயம்',
    heroTitle2: ' இங்கிருந்து தொடங்குகிறது.',

    heroDescription:
      'விவசாயங்களை நிர்வகிக்கவும், சந்தை வாய்ப்புகளை கண்காணிக்கவும், வானிலை நிலவரங்களை அறியவும் மற்றும் கொள்முதலை ஒரே புத்திசாலித்தனமான தளத்தில் கண்காணிக்கவும்.',

    marketIntelligence: 'சந்தை நுண்ணறிவு',
    marketDescription:
      'சிறந்த பயிர் முடிவுகளை எடுக்கவும்.',

    aiInsights: 'AI நுண்ணறிவுகள்',
    aiDescription:
      'வேளாண்மை தரவுகளை செயல்பாடுகளாக மாற்றவும்.',

    digitalWorkflows: 'டிஜிட்டல் பணிச்செயல்கள்',
    digitalDescription:
      'ஆவணப் பணிகளையும் தாமதங்களையும் குறைக்கவும்.',

    welcome: 'மீண்டும் வரவேற்கிறோம்',
    signInDescription:
      'உங்கள் பணிச்சூழலைத் தேர்ந்தெடுத்து உள்நுழையுங்கள்.',

    signInAs: 'உள்நுழைவது',
    selectRole: 'உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்',

    farmer: 'விவசாயி',
    farmerShort: 'விவசாய பணிச்சூழல்',
    farmerDescription:
      'உங்கள் விவசாயம், பயிர்கள் மற்றும் சந்தை நடவடிக்கைகளை நிர்வகிக்கவும்.',

    administrator: 'உள்ளூர் வருவாய் நிர்வாகி',
    administratorShort: 'வருவாய் மற்றும் சரிபார்ப்பு',
    administratorDescription:
      'விவசாயி விண்ணப்பங்கள் மற்றும் நில ஆவணங்களை சரிபார்க்கவும்.',

    admin: 'நிர்வாகி',
    adminShort: 'கணினி நிர்வாகம்',
    adminDescription:
      'பயனர்கள், பணிச்செயல்கள் மற்றும் தள செயல்பாடுகளை நிர்வகிக்கவும்.',

    workspace: 'பணிச்சூழல்',

    email: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',

    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',

    keepSignedIn: 'என்னை உள்நுழைந்த நிலையில் வைத்திருங்கள்',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',

    continueAs: 'தொடரவும்',

    signingIn: 'உள்நுழைகிறது...',

    newToFarmFlow: 'FarmFlow-க்கு புதியவரா?',
    createFarmerAccount: 'விவசாயி கணக்கை உருவாக்கவும்',

    security:
      'உங்கள் கணக்கு தகவல்கள் பாதுகாப்பான அங்கீகாரத்தால் பாதுகாக்கப்படுகின்றன.'
  },

  hi: {
    language: 'भाषा',

    brand: 'FarmFlow',
    smartPlatform: 'स्मार्ट कृषि प्लेटफ़ॉर्म',

    heroTitle1: 'स्मार्ट खेती की शुरुआत',
    heroTitle2: ' यहां से होती है।',

    heroDescription:
      'खेतों को प्रबंधित करें, बाजार के अवसरों पर नजर रखें, मौसम की स्थिति समझें और खरीद प्रक्रिया को एक बुद्धिमान प्लेटफ़ॉर्म से ट्रैक करें।',

    marketIntelligence: 'बाजार जानकारी',
    marketDescription:
      'फसल से जुड़े बेहतर निर्णय लें।',

    aiInsights: 'AI आधारित जानकारी',
    aiDescription:
      'कृषि डेटा को उपयोगी कार्यों में बदलें।',

    digitalWorkflows: 'डिजिटल कार्यप्रवाह',
    digitalDescription:
      'कागजी काम और देरी कम करें।',

    welcome: 'वापसी पर स्वागत है',
    signInDescription:
      'अपना कार्यक्षेत्र चुनें और साइन इन करें।',

    signInAs: 'साइन IN AS',
    selectRole: 'अपनी भूमिका चुनें',

    farmer: 'किसान',
    farmerShort: 'कृषि कार्यक्षेत्र',
    farmerDescription:
      'अपने खेत, फसल और बाजार गतिविधियों को प्रबंधित करें।',

    administrator: 'स्थानीय राजस्व प्रशासक',
    administratorShort: 'राजस्व और सत्यापन',
    administratorDescription:
      'किसान आवेदन और भूमि दस्तावेज़ों का सत्यापन करें।',

    admin: 'व्यवस्थापक',
    adminShort: 'सिस्टम प्रबंधन',
    adminDescription:
      'उपयोगकर्ताओं, कार्यप्रवाह और प्लेटफ़ॉर्म संचालन को प्रबंधित करें।',

    workspace: 'कार्यस्थान',

    email: 'ईमेल पता',
    password: 'पासवर्ड',

    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',

    keepSignedIn: 'मुझे साइन इन रखें',
    forgotPassword: 'पासवर्ड भूल गए?',

    continueAs: 'जारी रखें',

    signingIn: 'साइन इन हो रहा है...',

    newToFarmFlow: 'FarmFlow पर नए हैं?',
    createFarmerAccount: 'किसान खाता बनाएं',

    security:
      'आपकी खाता जानकारी सुरक्षित प्रमाणीकरण द्वारा सुरक्षित है।'
  }
};

const Login = () => {
  const navigate = useNavigate();

  /* =======================================================
     LANGUAGE
  ======================================================== */

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('farmflow_language') || 'en';
  });

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('farmflow_language', language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem(
      'farmflow_language',
      newLanguage
    );
  };

  /* =======================================================
     ROLE
  ======================================================== */

  const [selectedRole, setSelectedRole] =
    useState('farmer');

  const roles = [
    {
      id: 'farmer',
      icon: '🌾',
      title: t.farmer,
      shortDescription: t.farmerShort,
      description: t.farmerDescription
    },
    {
      id: 'vao',
      icon: '🧑‍💼',
      title: t.administrator,
      shortDescription: t.administratorShort,
      description: t.administratorDescription
    },
    {
      id: 'admin',
      icon: '🛡️',
      title: t.admin,
      shortDescription: t.adminShort,
      description: t.adminDescription
    }
  ];

  /* =======================================================
     LOGIN STATE
  ======================================================== */

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /* =======================================================
     LOGIN
  ======================================================== */

  const handleLogin = async (e) => {
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

    /* =====================================================
       ADMIN LOGIN
    ====================================================== */

    if (
      email.trim().toLowerCase() ===
        'admin@farmflow.com' &&
      password === 'admin123'
    ) {
      const adminData = {
        name: 'System Admin',
        email: email.trim().toLowerCase(),
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
      /* ===================================================
         FIREBASE AUTH
      ==================================================== */

      await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      /* ===================================================
         GET FIRESTORE USER
      ==================================================== */

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
        email: email.trim().toLowerCase(),
        role: 'farmer'
      };

      if (!querySnapshot.empty) {
        const firestoreData =
          querySnapshot.docs[0].data();

        userData = {
          ...firestoreData,
          email:
            firestoreData.email ||
            email.trim().toLowerCase()
        };
      }

      /* ===================================================
         SAVE SESSION
      ==================================================== */

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

      /* ===================================================
         REDIRECT
         
         IMPORTANT:
         Firebase role values remain unchanged.
         
         vao = Local Revenue Administrator in UI
         officer = Officer internally
      ==================================================== */

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
      console.error(
        'Error logging in:',
        error
      );

      alert(
        language === 'ta'
          ? 'உள்நுழைவு தோல்வியடைந்தது: மின்னஞ்சல் அல்லது கடவுச்சொல் தவறாக உள்ளது.'
          : language === 'hi'
            ? 'साइन इन विफल: ईमेल या पासवर्ड गलत है।'
            : 'Login failed: Incorrect email or password.'
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
     FORGOT PASSWORD
  ======================================================== */

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert(
        language === 'ta'
          ? 'முதலில் உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சல் முகவரியை உள்ளிட்டு பின்னர் "கடவுச்சொல் மறந்துவிட்டதா?" என்பதை அழுத்தவும்.'
          : language === 'hi'
            ? 'पहले अपना पंजीकृत ईमेल पता दर्ज करें और फिर "पासवर्ड भूल गए?" पर क्लिक करें।'
            : "Please enter your registered Email Address above first, then click 'Forgot Password?'"
      );

      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase()
      );

      alert(
        language === 'ta'
          ? 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு வெற்றிகரமாக அனுப்பப்பட்டது! உங்கள் மின்னஞ்சலை சரிபார்க்கவும்.'
          : language === 'hi'
            ? 'पासवर्ड रीसेट लिंक सफलतापूर्वक भेज दिया गया है! अपना ईमेल जांचें।'
            : 'Password reset link sent successfully! Check your email inbox.'
      );

    } catch (error) {
      console.error(
        'Error sending password reset email:',
        error
      );

      alert(
        language === 'ta'
          ? 'மீட்டமைப்பு இணைப்பை அனுப்ப முடியவில்லை: ' +
            error.message
          : language === 'hi'
            ? 'रीसेट लिंक भेजने में विफल: ' +
              error.message
            : 'Failed to send reset link: ' +
              error.message
      );
    }
  };

  const selectedRoleData = roles.find(
    (role) => role.id === selectedRole
  );

  /* =======================================================
     RENDER
  ======================================================== */

  return (
    <div className="login-page">

      {/* ===================================================
          LEFT BRAND PANEL
      ==================================================== */}

      <div className="login-brand-panel">

        <div className="login-brand-content">

          <Link
            to="/"
            className="login-brand"
          >
            <span className="login-brand-icon">
              🌱
            </span>

            <span>
              {t.brand} <b>AI</b>
            </span>
          </Link>

          <div className="login-brand-copy">

            <div className="login-eyebrow">
              {t.smartPlatform}
            </div>

            <h1>
              {t.heroTitle1}
              <span>{t.heroTitle2}</span>
            </h1>

            <p>
              {t.heroDescription}
            </p>

          </div>

          <div className="login-feature-list">

            <div className="login-feature">

              <span>✓</span>

              <div>

                <strong>
                  {t.marketIntelligence}
                </strong>

                <small>
                  {t.marketDescription}
                </small>

              </div>

            </div>

            <div className="login-feature">

              <span>✓</span>

              <div>

                <strong>
                  {t.aiInsights}
                </strong>

                <small>
                  {t.aiDescription}
                </small>

              </div>

            </div>

            <div className="login-feature">

              <span>✓</span>

              <div>

                <strong>
                  {t.digitalWorkflows}
                </strong>

                <small>
                  {t.digitalDescription}
                </small>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================
          RIGHT LOGIN AREA
      ==================================================== */}

      <div className="login-form-panel">

        <div className="login-mobile-brand">

          <Link
            to="/"
            className="login-brand"
          >
            <span className="login-brand-icon">
              🌱
            </span>

            <span>
              {t.brand} <b>AI</b>
            </span>

          </Link>

        </div>

        <div className="login-card">

          {/* =================================================
              LANGUAGE SELECTOR
          ================================================== */}

          <div className="login-language">

            <span>🌐</span>

            <span className="login-language-label">
              {t.language}
            </span>

            <select
              value={language}
              onChange={(e) =>
                changeLanguage(e.target.value)
              }
              aria-label={t.language}
            >
              <option value="en">
                English
              </option>

              <option value="ta">
                தமிழ்
              </option>

              <option value="hi">
                हिन्दी
              </option>
            </select>

          </div>

          {/* =================================================
              HEADER
          ================================================== */}

          <div className="login-card-header">

            <div className="login-avatar">
              {selectedRoleData.icon}
            </div>

            <div>

              <h2>
                {t.welcome}
              </h2>

              <p>
                {t.signInDescription}
              </p>

            </div>

          </div>

          {/* =================================================
              ROLE SELECTOR
          ================================================== */}

          <div className="login-role-section">

            <div className="login-role-heading">

              <span>
                {t.signInAs}
              </span>

              <small>
                {t.selectRole}
              </small>

            </div>

            <div className="login-role-grid">

              {roles.map((role) => (

                <button
                  key={role.id}
                  type="button"
                  className={`login-role-card ${
                    selectedRole === role.id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setSelectedRole(role.id)
                  }
                >

                  <div className="role-active-check">
                    {selectedRole === role.id
                      ? '✓'
                      : ''}
                  </div>

                  <div className="role-icon">
                    {role.icon}
                  </div>

                  <strong>
                    {role.title}
                  </strong>

                  <span>
                    {role.shortDescription}
                  </span>

                </button>

              ))}

            </div>

            {/* SELECTED ROLE INFO */}

            <div className="selected-role-info">

              <span className="selected-role-icon">
                {selectedRoleData.icon}
              </span>

              <div>

                <strong>
                  {selectedRoleData.title}{' '}
                  {t.workspace}
                </strong>

                <p>
                  {selectedRoleData.description}
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              LOGIN FORM
          ================================================== */}

          <form onSubmit={handleLogin}>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                {t.email}
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
                  placeholder={t.emailPlaceholder}
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
                {t.password}
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
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword
                    ? '◉'
                    : '○'}
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
                    setRememberMe(
                      e.target.checked
                    )
                  }
                />

                <span>
                  {t.keepSignedIn}
                </span>

              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={
                  handleForgotPassword
                }
              >
                {t.forgotPassword}
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
                  {t.signingIn}
                </>
              ) : (
                <>
                  {t.continueAs}{' '}
                  {selectedRoleData.title}

                  <span>→</span>
                </>
              )}

            </button>

          </form>

          {/* =================================================
              CREATE ACCOUNT
          ================================================== */}

          <div className="login-divider">

            <span>
              {t.newToFarmFlow}
            </span>

          </div>

          <Link
            to="/register"
            className="create-account-link"
          >
            {t.createFarmerAccount}
            <span>→</span>
          </Link>

          {/* SECURITY */}

          <p className="login-security">
            🔐 {t.security}
          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;