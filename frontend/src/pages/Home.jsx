import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import farmMandiBg from '../assets/farm_mandi_bg.jpg';
import './Home.css';

const translations = {
  en: {
    language: 'Language',
    brand: 'AgriProcure',
    smartPlatform: 'SMART AGRICULTURE PLATFORM',

    heroTitle1: 'Better decisions for',
    heroTitle2: 'every harvest.',

    heroDescription:
      'AgriProcure brings market intelligence, weather signals, procurement workflows and land-document verification into one simple workspace for farmers and field officers.',

    getStarted: 'Get started',
    alreadyAccount: 'I already have an account · Sign in',

    secureAccess: 'Secure role-based access',
    liveData: 'Live market & weather data',

    farmIntelligence: 'Farm intelligence',
    live: 'LIVE',
    marketSignal: "Today's market signal",
    favourable: 'Favourable',
    opportunity: '↑ 8.4% opportunity',

    weather: 'Weather',
    goodFieldWork: 'Good for field work',

    procurement: 'Procurement',
    activeApplications: '3 active applications',

    aiRecommendation: 'AI recommendation',
    aiText:
      'Review wheat rates before confirming your next delivery slot.',

    onePlatform: 'ONE PLATFORM',
    everythingNeeds: 'Everything your farm workflow needs.',
    everythingDescription:
      'Designed to reduce paperwork, improve visibility and help teams act faster.',

    marketIntelligence: 'Market intelligence',
    marketDescription:
      'Track crop rates and trends so you can make better selling and procurement decisions.',

    aiInsights: 'AI insights',
    aiDescription:
      'Turn weather and market signals into practical recommendations for the week ahead.',

    digitalVerification: 'Digital verification',
    verificationDescription:
      'Move land documents and applications through farmer, administrator and officer workflows.',

    officialServices: 'OFFICIAL SERVICES',
    landRecords: 'Land records, one click away.',
    landDescription:
      'Access the Tamil Nadu e-Services portal for land ownership, Patta and Chitta records.',
    openServices: 'Open TN e-Services',

    footerText: 'Smarter agriculture. Simpler workflows.',

    signIn: 'Sign in',
    createAccount: 'Create account'
  },

  ta: {
    language: 'மொழி',
    brand: 'AgriProcure',
    smartPlatform: 'ஸ்மார்ட் வேளாண்மை தளம்',

    heroTitle1: 'ஒவ்வொரு அறுவடைக்கும்',
    heroTitle2: 'சிறந்த முடிவுகள்.',

    heroDescription:
      'AgriProcure மூலம் சந்தை தகவல்கள், வானிலை தகவல்கள், கொள்முதல் செயல்முறைகள் மற்றும் நில ஆவண சரிபார்ப்பை ஒரே எளிய தளத்தில் நிர்வகிக்கலாம்.',

    getStarted: 'தொடங்குங்கள்',
    alreadyAccount: 'ஏற்கனவே கணக்கு உள்ளது · உள்நுழைக',

    secureAccess: 'பாதுகாப்பான பங்கு அடிப்படையிலான அணுகல்',
    liveData: 'நேரடி சந்தை மற்றும் வானிலை தகவல்கள்',

    farmIntelligence: 'விவசாய நுண்ணறிவு',
    live: 'நேரலை',
    marketSignal: 'இன்றைய சந்தை நிலவரம்',
    favourable: 'சாதகமானது',
    opportunity: '↑ 8.4% வாய்ப்பு',

    weather: 'வானிலை',
    goodFieldWork: 'வயல் பணிக்கு ஏற்றது',

    procurement: 'கொள்முதல்',
    activeApplications: '3 செயல்பாட்டில் உள்ள விண்ணப்பங்கள்',

    aiRecommendation: 'AI பரிந்துரை',
    aiText:
      'அடுத்த விநியோக நேரத்தை உறுதி செய்வதற்கு முன் கோதுமை விலைகளை சரிபார்க்கவும்.',

    onePlatform: 'ஒரே தளம்',
    everythingNeeds: 'உங்கள் விவசாய பணிகளுக்குத் தேவையான அனைத்தும்.',
    everythingDescription:
      'ஆவணப் பணிகளை குறைத்து, தகவல் தெளிவை அதிகரித்து, பணிகளை வேகமாக செய்யும் வகையில் வடிவமைக்கப்பட்டுள்ளது.',

    marketIntelligence: 'சந்தை நுண்ணறிவு',
    marketDescription:
      'பயிர்களின் விலை மற்றும் சந்தை போக்குகளை கண்காணித்து சிறந்த விற்பனை மற்றும் கொள்முதல் முடிவுகளை எடுக்கலாம்.',

    aiInsights: 'AI நுண்ணறிவுகள்',
    aiDescription:
      'வானிலை மற்றும் சந்தை தகவல்களை அடுத்த வாரத்திற்கான பயனுள்ள பரிந்துரைகளாக மாற்றுங்கள்.',

    digitalVerification: 'டிஜிட்டல் சரிபார்ப்பு',
    verificationDescription:
      'விவசாயி, உள்ளூர் வருவாய் நிர்வாகி மற்றும் அலுவலர் செயல்முறைகளில் நில ஆவணங்கள் மற்றும் விண்ணப்பங்களை நிர்வகிக்கலாம்.',

    officialServices: 'அதிகாரப்பூர்வ சேவைகள்',
    landRecords: 'நில பதிவுகள் — ஒரே கிளிக்கில்.',
    landDescription:
      'நில உரிமை, பட்டா மற்றும் சிட்டா பதிவுகளுக்கான தமிழ்நாடு e-Services தளத்தை அணுகுங்கள்.',
    openServices: 'TN e-Services திறக்கவும்',

    footerText: 'புத்திசாலித்தனமான வேளாண்மை. எளிமையான பணிச்சூழல்.',

    signIn: 'உள்நுழைக',
    createAccount: 'கணக்கை உருவாக்கவும்'
  },

  hi: {
    language: 'भाषा',
    brand: 'AgriProcure',
    smartPlatform: 'स्मार्ट कृषि प्लेटफ़ॉर्म',

    heroTitle1: 'हर फसल के लिए',
    heroTitle2: 'बेहतर निर्णय।',

    heroDescription:
      'AgriProcure किसानों और क्षेत्रीय अधिकारियों के लिए बाजार जानकारी, मौसम संकेत, खरीद प्रक्रियाओं और भूमि दस्तावेज़ सत्यापन को एक सरल प्लेटफ़ॉर्म में लाता है।',

    getStarted: 'शुरू करें',
    alreadyAccount: 'मेरे पास पहले से खाता है · साइन इन',

    secureAccess: 'सुरक्षित भूमिका-आधारित पहुंच',
    liveData: 'लाइव बाजार और मौसम डेटा',

    farmIntelligence: 'कृषि जानकारी',
    live: 'लाइव',
    marketSignal: 'आज का बाजार संकेत',
    favourable: 'अनुकूल',
    opportunity: '↑ 8.4% अवसर',

    weather: 'मौसम',
    goodFieldWork: 'खेत के काम के लिए अच्छा',

    procurement: 'खरीद',
    activeApplications: '3 सक्रिय आवेदन',

    aiRecommendation: 'AI सुझाव',
    aiText:
      'अगली डिलीवरी स्लॉट की पुष्टि करने से पहले गेहूं की कीमतों की समीक्षा करें।',

    onePlatform: 'एक प्लेटफ़ॉर्म',
    everythingNeeds: 'आपके कृषि कार्य के लिए आवश्यक सब कुछ।',
    everythingDescription:
      'कागजी काम कम करने, जानकारी को बेहतर बनाने और टीमों को तेजी से काम करने में मदद करने के लिए बनाया गया है।',

    marketIntelligence: 'बाजार जानकारी',
    marketDescription:
      'फसल की कीमतों और बाजार के रुझानों को ट्रैक करके बेहतर बिक्री और खरीद निर्णय लें।',

    aiInsights: 'AI जानकारी',
    aiDescription:
      'मौसम और बाजार संकेतों को आने वाले सप्ताह के लिए उपयोगी सुझावों में बदलें।',

    digitalVerification: 'डिजिटल सत्यापन',
    verificationDescription:
      'किसान, स्थानीय राजस्व प्रशासक और अधिकारी प्रक्रियाओं के माध्यम से भूमि दस्तावेज़ और आवेदनों को प्रबंधित करें।',

    officialServices: 'आधिकारिक सेवाएं',
    landRecords: 'भूमि रिकॉर्ड — एक क्लिक में।',
    landDescription:
      'भूमि स्वामित्व, पट्टा और चिट्टा रिकॉर्ड के लिए तमिलनाडु e-Services पोर्टल तक पहुंचें।',
    openServices: 'TN e-Services खोलें',

    footerText: 'स्मार्ट कृषि। सरल कार्यप्रवाह।',

    signIn: 'साइन इन',
    createAccount: 'खाता बनाएं'
  }
};

const Home = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('farmflow_language') || 'en';
  });

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('farmflow_language', language);
  }, [language]);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('farmflow_language', newLanguage);
  };

  return (
    <div className="home-page">
      <div
        className="home-bg-layer"
        style={{ backgroundImage: `url(${farmMandiBg})` }}
      />
      <div className="home-bg-overlay" />

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <header className="home-nav">

        <div
          className="home-brand"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate('/');
            }
          }}
        >
          <span>🌱</span>
          Agri<b>Procure</b>
        </div>

        <div className="home-nav-actions">

          {/* LANGUAGE SELECTOR */}

          <div className="home-language">

            <span>🌐</span>

            <select
              value={language}
              onChange={(e) =>
                changeLanguage(e.target.value)
              }
              aria-label={t.language}
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
              <option value="hi">हिन्दी</option>
            </select>

          </div>

          <button
            className="home-nav-login"
            onClick={() => navigate('/login')}
          >
            {t.signIn}
          </button>

          <button
            className="home-nav-cta"
            onClick={() => navigate('/register')}
          >
            {t.createAccount}
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main>

        {/* HERO */}

        <section className="home-hero">

          <div className="home-hero-copy">

            <div className="home-eyebrow">
              {t.smartPlatform}
            </div>

            <h1>
              {t.heroTitle1}{' '}
              <span>{t.heroTitle2}</span>
            </h1>

            <p>
              {t.heroDescription}
            </p>

            <div className="home-actions">

              <button
                className="home-primary"
                onClick={() => navigate('/register')}
              >
                {t.getStarted}
                <span>→</span>
              </button>

              <button
                className="home-secondary"
                onClick={() => navigate('/login')}
              >
                <span>🔑</span> {t.alreadyAccount}
              </button>

            </div>

            <div className="home-trust">

              <span>✓</span>
              {t.secureAccess}

              <span>✓</span>
              {t.liveData}

            </div>

          </div>

          {/* HERO PREVIEW */}

          <div className="home-hero-panel">

            <div className="home-panel-glow"></div>

            <div className="home-panel-top">

              <span>
                {t.farmIntelligence}
              </span>

              <span className="live-dot">
                ● {t.live}
              </span>

            </div>

            <div className="home-metric">

              <div>

                <small>
                  {t.marketSignal}
                </small>

                <strong>
                  {t.favourable}
                </strong>

                <em>
                  {t.opportunity}
                </em>

              </div>

              <div className="metric-chart">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>

            </div>

            <div className="home-panel-grid">

              <div>
                <span>🌤️</span>

                <small>
                  {t.weather}
                </small>

                <b>
                  {t.goodFieldWork}
                </b>
              </div>

              <div>
                <span>📦</span>

                <small>
                  {t.procurement}
                </small>

                <b>
                  {t.activeApplications}
                </b>
              </div>

            </div>

            <div className="home-ai-note">

              <span>✦</span>

              <div>

                <b>
                  {t.aiRecommendation}
                </b>

                <p>
                  {t.aiText}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            SERVICES
        ================================================== */}

        <section className="home-services">

          <div className="section-heading">

            <div>

              <span>
                {t.onePlatform}
              </span>

              <h2>
                {t.everythingNeeds}
              </h2>

            </div>

            <p>
              {t.everythingDescription}
            </p>

          </div>

          <div className="service-grid">

            <article>

              <div className="service-icon">
                📈
              </div>

              <h3>
                {t.marketIntelligence}
              </h3>

              <p>
                {t.marketDescription}
              </p>

            </article>

            <article>

              <div className="service-icon">
                🤖
              </div>

              <h3>
                {t.aiInsights}
              </h3>

              <p>
                {t.aiDescription}
              </p>

            </article>

            <article>

              <div className="service-icon">
                🧾
              </div>

              <h3>
                {t.digitalVerification}
              </h3>

              <p>
                {t.verificationDescription}
              </p>

            </article>

          </div>

        </section>

        {/* =================================================
            LAND SERVICES
        ================================================== */}

        <section className="home-land">

          <div>

            <div className="land-tag">
              {t.officialServices}
            </div>

            <h2>
              {t.landRecords}
            </h2>

            <p>
              {t.landDescription}
            </p>

          </div>

          <a
            href="https://eservices.tn.gov.in/eservicesnew/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.openServices} ↗
          </a>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="home-footer">

        <div>
          🌱 <strong>AgriProcure</strong>
        </div>

        <p>
          {t.footerText}
        </p>

      </footer>

    </div>
  );
};

export default Home;