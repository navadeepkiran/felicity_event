import QRCode from 'qrcode';
import pkg from 'nodemailer';
const { createTransport } = pkg;
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Generate QR Code
export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
};

// Email transporter configuration
const getTransporter = () => {
  // Support both Brevo (production) and Gmail (development)
  const emailService = process.env.EMAIL_SERVICE || 'brevo';
  
  if (emailService === 'brevo') {
    // Brevo/Sendinblue SMTP - Best for production (300 emails/day free)
    // Works reliably on deployed servers (Render, Vercel, etc.)
    return createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER || process.env.EMAIL_USER,
        pass: process.env.BREVO_PASSWORD || process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 60000, // Increased to 60 seconds for Render
      greetingTimeout: 60000,
      socketTimeout: 60000,
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100
    });
  } else {
    // Gmail SMTP - Works for local development only
    return createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000
    });
  }
};

// Send ticket email using Brevo API (works on Render - no SMTP blocking)
export const sendTicketEmail = async (recipientEmail, registration, event) => {
  try {
    const emailService = process.env.EMAIL_SERVICE || 'brevo';
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .ticket-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          .qr-code { text-align: center; margin: 20px 0; }
          .qr-code img { max-width: 300px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Successful!</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>Your registration for <strong>${event.eventName}</strong> has been confirmed.</p>
            
            <div class="ticket-info">
              <h3>Ticket Details</h3>
              <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
              <p><strong>Event:</strong> ${event.eventName}</p>
              <p><strong>Date:</strong> ${new Date(event.eventStartDate).toLocaleDateString()}</p>
              <p><strong>Amount Paid:</strong> ₹${registration.amountPaid}</p>
            </div>

            <div class="qr-code">
              <h3>Your QR Code</h3>
              <p>Please show this QR code at the event venue for entry:</p>
              <img src="${registration.qrCode}" alt="QR Code" />
            </div>

            <p><strong>Important:</strong> Please save this email or take a screenshot of the QR code for easy access at the event.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Felicity Event Management</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (emailService === 'brevo') {
      // Use Brevo REST API (works on Render - uses HTTPS, not blocked)
      const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_PASSWORD;
      const senderEmail = process.env.BREVO_USER || process.env.EMAIL_USER;
      
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { email: senderEmail, name: 'Felicity Events' },
          to: [{ email: recipientEmail }],
          subject: `Registration Confirmed - ${event.eventName}`,
          htmlContent: emailHtml
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      console.log(`✅ Ticket email sent via Brevo API to ${recipientEmail}`, response.data.messageId);
      return true;
      
    } else {
      // Fallback to Gmail SMTP for local development
      const transporter = getTransporter();
      
      const mailOptions = {
        from: `"Felicity Events" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `Registration Confirmed - ${event.eventName}`,
        html: emailHtml
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Ticket email sent to ${recipientEmail}`, result.messageId);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Email send error:', error.response?.data || error.message || error);
    console.log('ℹ️  Note: QR code is still available in user dashboard even if email fails');
    return false;
  }
};

// Generate random password
export const generatePassword = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validate IIIT email
export const isValidIIITEmail = (email) => {
  const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in'];
  return iiitDomains.some(domain => email.toLowerCase().endsWith(domain));
};
