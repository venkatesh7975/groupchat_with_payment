require('dotenv').config();
const { sendOTPEmail } = require('./config/email');

async function testEmailConfig() {
  console.log('Testing email configuration...');
  console.log('EMAIL:', process.env.EMAIL ? 'Set' : 'Not set');
  console.log('PASSWORD:', process.env.PASSWORD ? 'Set' : 'Not set');
  
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    console.error('❌ Email credentials not configured in .env file');
    console.log('Please add EMAIL and PASSWORD to your .env file');
    return;
  }

  console.log('\nAttempting to send test email...');
  
  const success = await sendOTPEmail(
    process.env.EMAIL, // Send to yourself for testing
    '123456',
    'test'
  );

  if (success) {
    console.log('✅ Email sent successfully!');
    console.log('Check your inbox for the test email.');
  } else {
    console.log('❌ Email sending failed');
    console.log('Common solutions:');
    console.log('1. Use Gmail App Password (not your main password)');
    console.log('2. Enable 2-Factor Authentication on your Google account');
    console.log('3. Generate App Password: Google Account → Security → App Passwords');
    console.log('4. Check your internet connection');
  }
}

testEmailConfig().catch(console.error); 