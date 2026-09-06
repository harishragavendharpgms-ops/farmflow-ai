import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipient, message } = req.body;

  if (!recipient || !message) {
    return res.status(400).json({ error: 'Missing recipient or message parameters.' });
  }

  // Your textbee.dev API Key configuration
  const TEXTBEE_API_KEY = 'txb_TxrBzRwSdleKWzGtwMlg3bavFWnhAL7v';

  try {
    const response = await axios.post(
      'https://api.textbee.dev/api/v1/gateway/send-sms',
      {
        recipients: [recipient], // Format expected: E.164 (e.g., +919876543210)
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEXTBEE_API_KEY,
        },
      }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'SMS sent successfully via textbee.dev', 
      data: response.data 
    });
  } catch (error) {
    console.error('Textbee SMS Error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to send SMS through textbee gateway.', 
      details: error.response?.data || error.message 
    });
  }
}