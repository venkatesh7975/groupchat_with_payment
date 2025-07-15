const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_51H2X2X2X2X2X2',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_here'
});

module.exports = razorpay; 