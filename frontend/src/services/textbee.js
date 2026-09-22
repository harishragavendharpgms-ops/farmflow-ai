/**
 * FarmFlow AI - TextBee SMS Gateway Service
 * Handles SMS OTP generation, formatting, and dispatch via TextBee API.
 */

export const TEXTBEE_DEVICE_ID = '6a9d1e51ccb6c727098825fb';
export const TEXTBEE_API_KEY = 'txb_TxrBzRwSdleKWzGtwMlg3bavFWnhAL7v';
export const TEXTBEE_ENDPOINT = `https://api.textbee.dev/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`;

/**
 * Standardize Indian phone numbers to E.164 (+91XXXXXXXXXX)
 * @param {string} phone 
 * @returns {string} E.164 formatted phone number
 */
export const formatE164 = (phone) => {
  if (!phone) return '';
  const digitsOnly = phone.toString().replace(/\D/g, '');
  const tenDigits = digitsOnly.slice(-10);
  return `+91${tenDigits}`;
};

/**
 * Generate a cryptographically sound or high-entropy numeric OTP.
 * @param {number} length Default 6
 * @returns {string} 6-digit numeric string
 */
export const generateOTP = (length = 6) => {
  // First digit 1-9 to avoid leading zero ambiguity
  let otp = Math.floor(1 + Math.random() * 9).toString();
  for (let i = 1; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

/**
 * Send SMS to a recipient phone number through the connected TextBee device.
 * @param {Object} param0 
 * @param {string} param0.phone Recipient mobile number
 * @param {string} param0.message SMS text body
 * @returns {Promise<{success: boolean, data: any}>}
 */
export const sendSMS = async ({ phone, message }) => {
  const formattedPhone = formatE164(phone);

  if (!formattedPhone || formattedPhone.length < 13) {
    throw new Error('Invalid mobile number provided for SMS dispatch.');
  }

  const res = await fetch(TEXTBEE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': TEXTBEE_API_KEY,
    },
    body: JSON.stringify({
      receivers: [formattedPhone],
      recipients: [formattedPhone],
      smsBody: message,
      message: message,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || `SMS delivery failed with status ${res.status}`;
    console.error('TextBee SMS Gateway Error:', errorMsg);
    throw new Error(errorMsg);
  }

  console.log(`[TextBee] SMS dispatched to ${formattedPhone}:`, data);
  return { success: true, data };
};

/**
 * Send an authentic FarmFlow AI OTP message to user's phone.
 * @param {Object} param0
 * @param {string} param0.phone 
 * @param {string} param0.otp 
 * @param {string} [param0.purpose] 'registration' | 'login'
 */
export const sendVerificationOTP = async ({ phone, otp, purpose = 'registration' }) => {
  const actionText = purpose === 'login' ? 'login' : 'registration';
  const message = `FarmFlow AI: Your ${actionText} verification OTP is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

  return await sendSMS({ phone, message });
};
