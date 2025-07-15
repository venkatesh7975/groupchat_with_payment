require('dotenv').config();
const razorpay = require('./config/razorpay');

async function testRazorpayConfig() {
  console.log('Testing Razorpay configuration...');
  console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set');
  console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not set');
  
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('❌ Razorpay credentials not configured in .env file');
    console.log('Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file');
    return;
  }

  console.log('\nAttempting to create test order...');
  
  try {
    const options = {
      amount: 100, // ₹1 in paise
      currency: 'INR',
      receipt: `test_order_${Date.now()}`,
      notes: {
        purpose: 'test'
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('✅ Test order created successfully!');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount);
    console.log('Currency:', order.currency);
  } catch (error) {
    console.log('❌ Razorpay test failed');
    console.log('Error:', error.message);
    console.log('Status Code:', error.statusCode);
    
    if (error.statusCode === 401) {
      console.log('\n🔧 Solutions:');
      console.log('1. Check your Razorpay Key ID and Secret');
      console.log('2. Make sure you\'re using test credentials for development');
      console.log('3. Verify your Razorpay account is active');
    }
  }
}

testRazorpayConfig().catch(console.error); 