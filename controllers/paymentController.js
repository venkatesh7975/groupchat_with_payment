const razorpay = require('../config/razorpay');

// Create payment order
const createOrder = async (req, res) => {
  try {
    console.log('Creating payment order...');
    console.log('Razorpay config:', {
      key_id: razorpay.key_id,
      key_secret: razorpay.key_secret ? '***' : 'NOT SET'
    });

    const options = {
      amount: 100, // ₹1 in paise (100 paise = ₹1)
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        purpose: 'group_chat_access'
      }
    };

    console.log('Order options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('Order created successfully:', order.id);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpay.key_id
    });
  } catch (error) {
    console.error('Order creation error:', error);
    
    if (error.statusCode === 401) {
      return res.status(500).json({ 
        message: 'Payment service authentication failed. Please check Razorpay credentials.',
        error: 'Invalid Razorpay credentials'
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: error.message || 'Unknown error'
    });
  }
};

// Verify payment and mark user as group member
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification data is incomplete' });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Mark user as group member
    req.user.isGroupMember = true;
    await req.user.save();

    res.json({ 
      message: 'Payment successful! You can now access the group chat.',
      isGroupMember: true
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// Get payment status (for checking if user is already a member)
const getPaymentStatus = (req, res) => {
  res.json({ 
    isGroupMember: req.user.isGroupMember || false
  });
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentStatus
}; 