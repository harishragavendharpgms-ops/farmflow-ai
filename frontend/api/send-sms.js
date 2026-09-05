import twilio from 'twilio';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { to, body } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'Recipient phone number and message body are required.' });
  }

  // Vercel securely pulls these from your environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    return res.status(500).json({ error: 'Missing Twilio environment variables on server.' });
  }

  try {
    const client = twilio(accountSid, authToken);

    // Format to E.164 (+91 for India if country code is missing)
    const formattedTo = to.startsWith('+') ? to : `+91${to.replace(/\D/g, '').slice(-10)}`;

    const message = await client.messages.create({
      body: body,
      from: twilioNumber,
      to: formattedTo
    });

    return res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Twilio Error:', error);
    return res.status(500).json({ error: error.message });
  }
}