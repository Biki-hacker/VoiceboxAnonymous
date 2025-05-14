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
    return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
  }

  // Basic email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
  }

  if (!process.env.BREVO_API_KEY || !process.env.YOUR_RECEIVING_EMAIL) {
     console.error("Email configuration missing on server.");
     return res.status(500).json({ success: false, message: 'Server configuration error for sending email. Please contact support.' });
  }

  const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

  const sender = {
    email: process.env.BREVO_SENDER_EMAIL || `contact@${req.hostname}`, // A verified sender in Brevo
    name: 'Voicebox Anonymous Contact Form',
  };
  const receivers = [
    {
      email: process.env.YOUR_RECEIVING_EMAIL,
    },
  ];

  try {
    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: `New Voicebox Contact: ${name}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 600px; margin: 20px auto; }
                h1 { color: #2c3e50; }
                p { margin-bottom: 10px; }
                strong { color: #3498db; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>New Contact Form Submission</h1>
                <p>You have received a new message from your Voicebox Anonymous contact form:</p>
                <hr>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><small>This email was sent from the contact form on Voicebox Anonymous.</small></p>
            </div>
        </body>
        </html>
      `,
      replyTo: {
        email: email,
        name: name,
      },
    });
    console.log(`Contact email sent successfully from ${email} to ${process.env.YOUR_RECEIVING_EMAIL}`);
    res.status(200).json({ success: true, message: 'Message sent successfully! We will get back to you soon.' });
  } catch (error) {
    console.error('Error sending contact email via Brevo:', error.response ? error.response.body : error.message);
    let errorMessage = 'Failed to send message due to a server error.';
    if (error.response && error.response.body && error.response.body.message) {
        errorMessage = `Server Error: ${error.response.body.message}`;
    } else if (error.message && error.message.includes('Recipient email address is not valid')) {
        errorMessage = 'The recipient email address configured on the server is not valid.';
    } else if (error.message) {
        errorMessage = `Server Error: ${error.message}`;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
};

module.exports = {
  sendContactEmail,
};