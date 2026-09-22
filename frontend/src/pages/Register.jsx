import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { generateOTP, sendVerificationOTP } from "../services/textbee";
import "./Register.css";

const translations = {
  en: {
    language: "Language",
    brandTitle: "FarmFlow AI",
    brandSubtitle: "Smart agriculture. Simple management. Better outcomes.",
    brandDescription:
      "A digital platform connecting farmers, local administrators and agricultural officers through one intelligent workflow.",

    badge: "Farmer Registration",

    title: "Create your account",
    subtitle:
      "Join FarmFlow AI and manage your farming journey digitally.",

    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",

    email: "Email Address",
    emailPlaceholder: "Enter your email address",

    phone: "Phone Number",
    phonePlaceholder: "Enter your phone number",

    password: "Password",
    passwordPlaceholder: "Create a password",

    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Re-enter your password",

    showPassword: "Show password",
    hidePassword: "Hide password",

    createAccount: "Create Account",
    creatingAccount: "Creating Account...",

    alreadyAccount: "Already have an account?",
    login: "Login",

    secure:
      "Your information is securely stored with Firebase.",

    passwordMismatch: "Passwords do not match.",
    phoneAlreadyRegistered: "This phone number is already registered. Please login or use a different phone number.",
    invalidPhone: "Please enter a valid 10-digit phone number.",

    success:
      "Registration successful! Please login.",

    // OTP Verification Translations
    otpBadge: "Phone Verification",
    otpTitle: "Verify your phone number",
    otpSubtitle: "We sent a 6-digit verification code via SMS to",
    enterOtp: "Enter Verification Code",
    resendOtpIn: "Resend code in",
    resendOtp: "Resend Code",
    seconds: "s",
    verifyAndCreate: "Verify & Create Account",
    verifying: "Verifying Code...",
    changePhone: "Change phone number",
    invalidOtpLength: "Please enter all 6 digits of the verification code.",
    otpMismatch: "Incorrect OTP. Please enter the valid 6-digit code received via SMS.",
    otpSentSuccess: "SMS OTP sent successfully!",
    otpSendFailed: "Failed to send SMS OTP. Please check your connection and phone number.",

    languages: {
      en: "English",
      ta: "தமிழ்",
      hi: "हिन्दी",
    },
  },

  ta: {
    language: "மொழி",
    brandTitle: "FarmFlow AI",
    brandSubtitle:
      "ஸ்மார்ட் விவசாயம். எளிய நிர்வாகம். சிறந்த முடிவுகள்.",
    brandDescription:
      "விவசாயிகள், உள்ளூர் நிர்வாகிகள் மற்றும் வேளாண் அலுவலர்களை ஒரே அறிவார்ந்த செயல்முறையின் மூலம் இணைக்கும் டிஜிட்டல் தளம்.",

    badge: "விவசாயி பதிவு",

    title: "உங்கள் கணக்கை உருவாக்குங்கள்",
    subtitle:
      "FarmFlow AI-ல் இணைந்து உங்கள் விவசாய செயல்பாடுகளை டிஜிட்டல் முறையில் நிர்வகிக்கவும்.",

    fullName: "முழு பெயர்",
    fullNamePlaceholder: "உங்கள் முழு பெயரை உள்ளிடவும்",

    email: "மின்னஞ்சல் முகவரி",
    emailPlaceholder:
      "உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்",

    phone: "தொலைபேசி எண்",
    phonePlaceholder:
      "உங்கள் தொலைபேசி எண்ணை உள்ளிடவும்",

    password: "கடவுச்சொல்",
    passwordPlaceholder:
      "கடவுச்சொல்லை உருவாக்கவும்",

    confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
    confirmPasswordPlaceholder:
      "கடவுச்சொல்லை மீண்டும் உள்ளிடவும்",

    showPassword: "கடவுச்சொல்லைக் காட்டு",
    hidePassword: "கடவுச்சொல்லை மறை",

    createAccount: "கணக்கை உருவாக்கு",
    creatingAccount: "கணக்கு உருவாக்கப்படுகிறது...",

    alreadyAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    login: "உள்நுழை",

    secure:
      "உங்கள் தகவல்கள் Firebase மூலம் பாதுகாப்பாக சேமிக்கப்படுகின்றன.",

    passwordMismatch:
      "கடவுச்சொற்கள் பொருந்தவில்லை.",
    phoneAlreadyRegistered:
      "இந்த தொலைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. உள்நுழையவும் அல்லது வேறு எண்ணைப் பயன்படுத்தவும்.",
    invalidPhone:
      "சரியான 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்.",

    success:
      "பதிவு வெற்றிகரமாக முடிந்தது! தயவுசெய்து உள்நுழையவும்.",

    // OTP Verification Translations
    otpBadge: "தொலைபேசி சரிபார்ப்பு",
    otpTitle: "உங்கள் தொலைபேசி எண்ணை சரிபார்க்கவும்",
    otpSubtitle: "6 இலக்க சரிபார்ப்புக் குறியீடு SMS மூலம் அனுப்பப்பட்டது:",
    enterOtp: "சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்",
    resendOtpIn: "மீண்டும் குறியீடு அனுப்ப:",
    resendOtp: "மீண்டும் குறியீட்டை அனுப்பு",
    seconds: "விநாடி",
    verifyAndCreate: "சரிபார்த்து கணக்கை உருவாக்கவும்",
    verifying: "சரிபார்க்கிறது...",
    changePhone: "தொலைபேசி எண்ணை மாற்றவும்",
    invalidOtpLength: "முழுமையான 6 இலக்க சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்.",
    otpMismatch: "தவறான OTP. SMS மூலம் பெறப்பட்ட சரியான 6 இலக்க குறியீட்டை உள்ளிடவும்.",
    otpSentSuccess: "SMS OTP வெற்றிகரமாக அனுப்பப்பட்டது!",
    otpSendFailed: "SMS OTP அனுப்புவதில் தோல்வி. தயவுசெய்து உங்கள் எண்ணை சரிபார்க்கவும்.",

    languages: {
      en: "English",
      ta: "தமிழ்",
      hi: "हिन्दी",
    },
  },

  hi: {
    language: "भाषा",
    brandTitle: "FarmFlow AI",
    brandSubtitle:
      "स्मार्ट कृषि। सरल प्रबंधन। बेहतर परिणाम।",
    brandDescription:
      "किसानों, स्थानीय प्रशासकों और कृषि अधिकारियों को एक बुद्धिमान डिजिटल कार्यप्रवाह के माध्यम से जोड़ने वाला प्लेटफ़ॉर्म।",

    badge: "किसान पंजीकरण",

    title: "अपना खाता बनाएं",
    subtitle:
      "FarmFlow AI से जुड़ें और अपनी कृषि गतिविधियों को डिजिटल रूप से प्रबंधित करें।",

    fullName: "पूरा नाम",
    fullNamePlaceholder:
      "अपना पूरा नाम दर्ज करें",

    email: "ईमेल पता",
    emailPlaceholder:
      "अपना ईमेल पता दर्ज करें",

    phone: "फ़ोन नंबर",
    phonePlaceholder:
      "अपना फ़ोन नंबर दर्ज करें",

    password: "पासवर्ड",
    passwordPlaceholder:
      "पासवर्ड बनाएं",

    confirmPassword: "पासवर्ड की पुष्टि करें",
    confirmPasswordPlaceholder:
      "अपना पासवर्ड फिर से दर्ज करें",

    showPassword: "पासवर्ड दिखाएं",
    hidePassword: "पासवर्ड छिपाएं",

    createAccount: "खाता बनाएं",
    creatingAccount: "खाता बनाया जा रहा है...",

    alreadyAccount:
      "क्या आपके पास पहले से खाता है?",
    login: "लॉगिन",

    secure:
      "आपकी जानकारी Firebase द्वारा सुरक्षित रूप से संग्रहीत की जाती है।",

    passwordMismatch:
      "पासवर्ड मेल नहीं खाते।",
    phoneAlreadyRegistered:
      "यह फ़ोन नंबर पहले से पंजीकृत है। कृपया लॉगिन करें या दूसरा नंबर उपयोग करें।",
    invalidPhone:
      "कृपया एक मान्य 10-अंकीय फ़ोन नंबर दर्ज करें।",

    success:
      "पंजीकरण सफल हुआ! कृपया लॉगिन करें।",

    // OTP Verification Translations
    otpBadge: "फ़ोन सत्यापन",
    otpTitle: "अपना फ़ोन नंबर सत्यापित करें",
    otpSubtitle: "6-अंकीय सत्यापन कोड SMS द्वारा भेजा गया:",
    enterOtp: "सत्यापन कोड दर्ज करें",
    resendOtpIn: "पुनः कोड भेजें:",
    resendOtp: "पुनः कोड भेजें",
    seconds: "सेकंड",
    verifyAndCreate: "सत्यापित करें और खाता बनाएं",
    verifying: "सत्यापित हो रहा है...",
    changePhone: "फ़ोन नंबर बदलें",
    invalidOtpLength: "कृपया पूरा 6-अंकीय सत्यापन कोड दर्ज करें।",
    otpMismatch: "गलत OTP। कृपया SMS द्वारा प्राप्त सही 6-अंकीय कोड दर्ज करें।",
    otpSentSuccess: "SMS OTP सफलतापूर्वक भेजा गया!",
    otpSendFailed: "SMS OTP भेजने में विफल। कृपया अपना फ़ोन नंबर जांचें।",

    languages: {
      en: "English",
      ta: "தமிழ்",
      hi: "हिन्दी",
    },
  },
};

const Register = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(
    localStorage.getItem("farmflow_language") || "en"
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  // OTP Verification State
  const [step, setStep] = useState("details"); // 'details' | 'otp'
  const [sentOtp, setSentOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);

  const t = translations[language];

  // OTP Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("farmflow_language", lang);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // OTP Input event handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`reg-otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`reg-otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const targetIdx = Math.min(pasted.length, 5);
    const el = document.getElementById(`reg-otp-input-${targetIdx}`);
    if (el) el.focus();
  };

  // Step 1: Pre-validate & Send OTP via TextBee
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert(t.passwordMismatch);
      return;
    }

    const rawPhone = formData.phone.trim();
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length < 10) {
      alert(t.invalidPhone);
      return;
    }

    setLoading(true);

    try {
      // Check if phone number is already registered across Firestore users
      const phoneSearchVariants = [
        cleanPhone,
        `+91${cleanPhone}`,
        `+91 ${cleanPhone}`,
        `0${cleanPhone}`,
        rawPhone
      ];
      const uniqueVariants = [...new Set(phoneSearchVariants.filter(Boolean))];

      const phoneQuery = query(
        collection(db, "users"),
        where("phone", "in", uniqueVariants)
      );
      const phoneSnapshot = await getDocs(phoneQuery);

      if (!phoneSnapshot.empty) {
        setLoading(false);
        alert(t.phoneAlreadyRegistered);
        return;
      }

      // Generate 6-digit OTP and send via TextBee SMS Gateway
      const code = generateOTP();
      console.log("[Register] Generated OTP for", cleanPhone, ":", code);

      await sendVerificationOTP({ phone: cleanPhone, otp: code, purpose: 'registration' });

      setSentOtp(code);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendTimer(30);
      setStep("otp");
      alert(t.otpSentAlert || t.otpSentSuccess);
    } catch (error) {
      console.error("Registration OTP dispatch error:", error);
      alert(t.otpSendFailed || "Failed to send OTP via SMS. Please check your phone number and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP via TextBee
  const handleResendOtp = async () => {
    if (loading || resendTimer > 0) return;
    const cleanPhone = formData.phone.trim().replace(/\D/g, '').slice(-10);
    setLoading(true);
    try {
      const code = generateOTP();
      console.log("[Register] Resending OTP for", cleanPhone, ":", code);
      await sendVerificationOTP({ phone: cleanPhone, otp: code, purpose: 'registration' });
      setSentOtp(code);
      setResendTimer(30);
      alert(t.otpSentAlert || t.otpSentSuccess);
    } catch (err) {
      console.error("Resend OTP error:", err);
      alert(t.otpSendFailed || "Failed to resend SMS OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Strictly verify OTP and create account
  const handleVerifyOtpAndCreateAccount = async () => {
    const enteredCode = otpDigits.join("").trim();
    if (enteredCode.length < 6) {
      alert(t.invalidOtpLength);
      return;
    }

    if (enteredCode !== sentOtp) {
      alert(t.otpMismatch);
      return;
    }

    setLoading(true);
    const cleanPhone = formData.phone.trim().replace(/\D/g, '').slice(-10);

    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          formData.email.trim().toLowerCase(),
          formData.password
        );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        phoneVerified: true,
        role: "farmer",
        createdAt: new Date().toISOString(),
      });

      alert(t.success);
      navigate("/login");
    } catch (error) {
      console.error("Registration account creation error:", error);

      let message = error.message;

      if (error.code === "auth/email-already-in-use") {
        message =
          language === "ta"
            ? "இந்த மின்னஞ்சல் ஏற்கனவே பயன்படுத்தப்பட்டுள்ளது."
            : language === "hi"
            ? "यह ईमेल पहले से उपयोग में है।"
            : "This email is already in use.";
      } else if (error.code === "auth/weak-password") {
        message =
          language === "ta"
            ? "கடவுச்சொல் மிகவும் பலவீனமாக உள்ளது."
            : language === "hi"
            ? "पासवर्ड बहुत कमजोर है।"
            : "Password is too weak.";
      } else if (error.code === "auth/invalid-email") {
        message =
          language === "ta"
            ? "தவறான மின்னஞ்சல் முகவரி."
            : language === "hi"
            ? "अमान्य ईमेल पता।"
            : "Invalid email address.";
      }

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      {/* LEFT BRAND PANEL */}
      <section className="register-brand-panel">

        <div className="brand-content">

          <div className="brand-logo">
            <div className="brand-logo-icon">
              🌱
            </div>

            <div>
              <h1>{t.brandTitle}</h1>
              <span>AI AGRICULTURE PLATFORM</span>
            </div>
          </div>

          <div className="brand-main-content">

            <div className="brand-badge">
              🌾 {t.badge}
            </div>

            <h2>{t.brandSubtitle}</h2>

            <p>
              {t.brandDescription}
            </p>

            <div className="brand-features">

              <div className="brand-feature">
                <span className="feature-icon">
                  🚜
                </span>

                <div>
                  <strong>
                    {language === "ta"
                      ? "விவசாய மேலாண்மை"
                      : language === "hi"
                      ? "कृषि प्रबंधन"
                      : "Farm Management"}
                  </strong>

                  <small>
                    {language === "ta"
                      ? "உங்கள் விவசாய செயல்பாடுகளை எளிதாக நிர்வகிக்கவும்."
                      : language === "hi"
                      ? "अपनी कृषि गतिविधियों को आसानी से प्रबंधित करें।"
                      : "Manage your farming activities with ease."}
                  </small>
                </div>
              </div>

              <div className="brand-feature">
                <span className="feature-icon">
                  📊
                </span>

                <div>
                  <strong>
                    {language === "ta"
                      ? "டிஜிட்டல் கண்காணிப்பு"
                      : language === "hi"
                      ? "डिजिटल ट्रैकिंग"
                      : "Digital Tracking"}
                  </strong>

                  <small>
                    {language === "ta"
                      ? "உங்கள் விண்ணப்பங்கள் மற்றும் பயிர்களை கண்காணிக்கவும்."
                      : language === "hi"
                      ? "अपने आवेदन और फसलों को ट्रैक करें।"
                      : "Track your applications and crops digitally."}
                  </small>
                </div>
              </div>

              <div className="brand-feature">
                <span className="feature-icon">
                  🤝
                </span>

                <div>
                  <strong>
                    {language === "ta"
                      ? "அதிகாரிகளுடன் இணைப்பு"
                      : language === "hi"
                      ? "अधिकारियों से कनेक्शन"
                      : "Connected Workflow"}
                  </strong>

                  <small>
                    {language === "ta"
                      ? "உள்ளூர் நிர்வாகிகள் மற்றும் அதிகாரிகளுடன் இணைக்கவும்."
                      : language === "hi"
                      ? "स्थानीय प्रशासकों और अधिकारियों से जुड़ें।"
                      : "Connect with local administrators and officers."}
                  </small>
                </div>
              </div>

            </div>
          </div>

          <div className="brand-footer">
            <span>●</span>

            {language === "ta"
              ? "பாதுகாப்பான டிஜிட்டல் விவசாய தளம்"
              : language === "hi"
              ? "सुरक्षित डिजिटल कृषि प्लेटफ़ॉर्म"
              : "Secure digital agriculture platform"}
          </div>

        </div>

        <div className="brand-decoration decoration-one" />
        <div className="brand-decoration decoration-two" />
        <div className="brand-decoration decoration-three" />

      </section>

      {/* RIGHT REGISTER PANEL */}
      <section className="register-form-panel">

        {/* LANGUAGE SELECTOR */}
        <div className="register-language">

          <label htmlFor="language-select">
            🌐 {t.language}
          </label>

          <select
            id="language-select"
            value={language}
            onChange={(e) =>
              changeLanguage(e.target.value)
            }
          >
            <option value="en">
              🇬🇧 {t.languages.en}
            </option>

            <option value="ta">
              🇮🇳 {t.languages.ta}
            </option>

            <option value="hi">
              🇮🇳 {t.languages.hi}
            </option>
          </select>

        </div>

        <div className="register-card">

          {/* HEADER */}
          <div className="register-header">

            <div className="mobile-register-logo">
              🌱
            </div>

            <div className="register-kicker">
              {step === "otp" ? t.otpBadge : t.badge}
            </div>

            <h2>{step === "otp" ? t.otpTitle : t.title}</h2>

            <p>
              {step === "otp"
                ? `${t.otpSubtitle} +91 ******${formData.phone.replace(/\D/g, '').slice(-4)}`
                : t.subtitle}
            </p>

          </div>

          {step === "otp" ? (
            <div className="register-otp-flow">
              <div className="register-otp-banner">
                <span className="check-icon">✓</span>
                <span>
                  {t.otpSentSuccess} (+91 ******{formData.phone.replace(/\D/g, '').slice(-4)})
                </span>
              </div>

              <div className="register-otp-header">
                <span className="register-otp-title">{t.enterOtp}</span>
                <button
                  type="button"
                  className="register-change-phone"
                  onClick={() => setStep("details")}
                >
                  ← {t.changePhone}
                </button>
              </div>

              <div className="register-otp-boxes">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`reg-otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    className={`register-otp-box ${digit ? "filled" : ""}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div className="register-resend-timer">
                {resendTimer > 0 ? (
                  <span>
                    {t.resendOtpIn} <b>{resendTimer} {t.seconds}</b>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="register-resend-btn"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    🔄 {t.resendOtp}
                  </button>
                )}
              </div>

              <button
                type="button"
                className="register-submit"
                onClick={handleVerifyOtpAndCreateAccount}
                disabled={loading}
              >
                <span>
                  {loading ? t.verifying : t.verifyAndCreate}
                </span>

                {!loading && (
                  <span className="submit-arrow">
                    →
                  </span>
                )}
              </button>
            </div>
          ) : (
            /* FORM */
            <form
              className="register-form"
              onSubmit={handleSubmit}
            >

              {/* NAME */}
              <div className="form-group">

                <label htmlFor="name">
                  <span className="label-icon">
                    👤
                  </span>

                  {t.fullName}
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    👤
                  </span>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t.fullNamePlaceholder}
                    required
                    autoComplete="name"
                  />

                </div>

              </div>

              {/* EMAIL */}
              <div className="form-group">

                <label htmlFor="email">
                  <span className="label-icon">
                    ✉️
                  </span>

                  {t.email}
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ✉️
                  </span>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.emailPlaceholder}
                    required
                    autoComplete="email"
                  />

                </div>

              </div>

              {/* PHONE */}
              <div className="form-group">

                <label htmlFor="phone">
                  <span className="label-icon">
                    📱
                  </span>

                  {t.phone}
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    📱
                  </span>

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t.phonePlaceholder}
                    required
                    autoComplete="tel"
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="form-group">

                <label htmlFor="password">
                  <span className="label-icon">
                    🔒
                  </span>

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
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      t.passwordPlaceholder
                    }
                    required
                    minLength="6"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    aria-label={
                      showPassword
                        ? t.hidePassword
                        : t.showPassword
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>

                </div>

              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">

                <label htmlFor="confirmPassword">
                  <span className="label-icon">
                    🔐
                  </span>

                  {t.confirmPassword}
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔐
                  </span>

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={
                      formData.confirmPassword
                    }
                    onChange={handleChange}
                    placeholder={
                      t.confirmPasswordPlaceholder
                    }
                    required
                    minLength="6"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? t.hidePassword
                        : t.showPassword
                    }
                  >
                    {showConfirmPassword
                      ? "🙈"
                      : "👁️"}
                  </button>

                </div>

              </div>

              {/* SECURITY MESSAGE */}
              <div className="security-message">

                <span className="security-icon">
                  🛡️
                </span>

                <span>
                  {t.secure}
                </span>

              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="register-submit"
                disabled={loading}
              >
                <span>
                  {loading
                    ? t.creatingAccount
                    : t.createAccount}
                </span>

                {!loading && (
                  <span className="submit-arrow">
                    →
                  </span>
                )}

              </button>

            </form>
          )}

          {/* LOGIN */}
          <div className="register-login">

            <span>
              {t.alreadyAccount}
            </span>

            <Link to="/login">
              {t.login}
              <span> →</span>
            </Link>

          </div>

        </div>

        <div className="register-bottom-text">
          © {new Date().getFullYear()} FarmFlow AI
        </div>

      </section>

    </div>
  );
};

export default Register;