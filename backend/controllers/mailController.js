// controllers/mailController.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Check for essential environment variables during module load
if (!process.env.BREVO_API_KEY) {
  console.error("CRITICAL: BREVO_API_KEY is not set. Email sending will fail.");
}
if (!process.env.YOUR_RECEIVING_EMAIL) {
  console.error("CRITICAL: YOUR_RECEIVING_EMAIL is not set. Recipient for contact messages is unknown.");
}
if (!process.env.BREVO_SENDER_EMAIL) {
  console.warn("WARNING: BREVO_SENDER_EMAIL is not set. Using a default 'noreply' which might not be verified in Brevo.");
}

const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Basic email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  if (!process.env.BREVO_API_KEY || !process.env.YOUR_RECEIVING_EMAIL) {
    console.error("Email configuration missing on server.");
    return res.status(500).json({ success: false, message: 'Server email configuration error.' });
  }

  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const sender = {
    email: process.env.BREVO_SENDER_EMAIL || `contact@${req.hostname}`,
    name: 'Voicebox Anonymous Contact Form',
  };

  const receivers = [{ email: process.env.YOUR_RECEIVING_EMAIL }];

  try {
    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: `New Voicebox Contact from ${name}`,
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <small>This email was sent via the Voicebox Anonymous contact form.</small>
          </body>
        </html>
      `,
      replyTo: { email, name },
    });

    console.log(`📧 Email sent from ${email} to ${process.env.YOUR_RECEIVING_EMAIL}`);
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('❌ Error sending email:', error.response?.body || error.message);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
};

module.exports = {
  sendContactEmail,
};