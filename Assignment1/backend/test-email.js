import dotenv from 'dotenv';
import pkg from 'nodemailer';
const { createTransport } = pkg;

dotenv.config();

// Test email configuration
const testEmail = async () => {
  const emailService = process.env.EMAIL_SERVICE || 'brevo';
  
  console.log('🔍 Testing email configuration...\n');
  console.log('Email Service:', emailService.toUpperCase());
  
  if (emailService === 'brevo') {
    console.log('Brevo User:', process.env.BREVO_USER || process.env.EMAIL_USER);
    console.log('Brevo Password Set:', process.env.BREVO_PASSWORD ? 'Yes (hidden)' : 'No');
  } else {
    console.log('Gmail User:', process.env.EMAIL_USER);
    console.log('Gmail Password Set:', process.env.EMAIL_PASSWORD ? 'Yes (hidden)' : 'No');
  }
  console.log('');

  const transporter = emailService === 'brevo' 
    ? createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.BREVO_USER || process.env.EMAIL_USER,
          pass: process.env.BREVO_PASSWORD || process.env.EMAIL_PASSWORD
        },
        tls: { rejectUnauthorized: false }
      })
    : createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: { rejectUnauthorized: false }
      });

  try {
    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const recipientEmail = emailService === 'brevo' 
      ? (process.env.BREVO_USER || process.env.EMAIL_USER)
      : process.env.EMAIL_USER;
      
    const info = await transporter.sendMail({
      from: `"Felicity Events Test" <${recipientEmail}>`,
      to: recipientEmail,
      subject: `✅ ${emailService.toUpperCase()} Test - Felicity Event Management`,
      html: `
        <div style="font-family: Arial; padding: 20px; background-color: #f0f0f0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #22c55e;">✅ Email Configuration Working!</h1>
            <p>Your <strong>${emailService.toUpperCase()}</strong> email service is properly configured and working.</p>
            <p>Tickets will now be sent successfully to participants upon registration.</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Service: ${emailService.toUpperCase()}<br>
              Test sent at: ${new Date().toLocaleString()}<br>
              From: ${recipientEmail}
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log(`\n✨ ${emailService.toUpperCase()} email service is working! Check your inbox at:`, recipientEmail);
    
  } catch (error) {
    console.error('❌ Email configuration error:\n');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  AUTHENTICATION FAILED\n');
      
      if (emailService === 'brevo') {
        console.error('🔧 FIX for Brevo:');
        console.error('   1. Go to: https://app.brevo.com/settings/keys/smtp');
        console.error('   2. Click "Create a new SMTP key"');
        console.error('   3. Name it "Felicity Events" and copy the key');
        console.error('   4. Update .env file:');
        console.error('      BREVO_USER=your-email@gmail.com');
        console.error('      BREVO_PASSWORD=xsmtpsib-your-key-here');
        console.error('   5. Restart the server\n');
      } else {
        console.error('🔧 FIX for Gmail:');
        console.error('   1. Go to: https://myaccount.google.com/security');
        console.error('   2. Enable 2-Step Verification');
        console.error('   3. Click "App passwords"');
        console.error('   4. Generate new password for "Mail"');
        console.error('   5. Update EMAIL_PASSWORD in .env');
        console.error('   6. Restart the server\n');
      }
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('\n⚠️  CONNECTION FAILED\n');
      console.error('🔧 FIX: Check your internet connection or firewall settings');
    }
  }

  process.exit();
};

testEmail();
