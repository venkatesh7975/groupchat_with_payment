const nodemailer = require('nodemailer');

let transporter = null;

const getGmailTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      },
      // Add connection timeout and retry settings
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });
  }
  return transporter;
};

const sendOTPEmail = async (to, otp, type = 'login') => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL || !process.env.PASSWORD) {
      console.error('Email credentials not configured in .env file');
      return false;
    }

    const transport = getGmailTransporter();
    const subject = type === 'login' ? 'Your Login OTP' : 'Your Password Reset OTP';
    
    const info = await transport.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p>Your OTP is: <strong style="font-size: 24px; color: #007bff;">${otp}</strong></p>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    
    console.log('OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    
    // Provide specific error messages
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check your EMAIL and PASSWORD in .env file');
    } else if (error.code === 'ECONNECTION') {
      console.error('Connection failed. Check your internet connection');
    } else if (error.code === 'ESOCKET') {
      console.error('Socket error. This might be due to firewall or network issues');
    }
    
    return false;
  }
};

module.exports = {
  getGmailTransporter,
  sendOTPEmail
}; 