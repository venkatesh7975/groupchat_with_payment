const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validatePassword } = require('../utils/passwordValidator');
const { generateOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../config/email');

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpType = 'login';
    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(user.email, otp, 'login');
    
    if (!emailSent) {
      // If email fails, still create the user but inform about email issue
      return res.status(200).json({
        message: 'Registration successful, but OTP email could not be sent. Please check your email configuration.',
        email: user.email,
        warning: 'Email service not configured properly'
      });
    }

    return res.json({
      message: 'OTP sent to your email. Please verify to complete login.',
      email: user.email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpType = 'login';
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp, 'login');

    return res.json({
      message: 'OTP sent to your email. Please verify to complete login.',
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify OTP for login
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpType !== 'login') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({ message: 'OTP expired' });
    }
    // Clear OTP fields
    user.otp = null;
    user.otpExpiry = null;
    user.otpType = null;
    await user.save();
    // Generate token
    const token = generateToken(user._id);
    // Set cookie (not HttpOnly so frontend can read it)
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript to read the cookie
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'lax', // More permissive for cross-origin
      path: '/', // Set path
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    console.log('Setting cookie with token:', token.substring(0, 20) + '...');
    // Return user data (without password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isGroupMember: user.isGroupMember
    };
    res.json({
      message: 'Login successful',
      user: userResponse,
      token: token // Also return token in response
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie('token', {
    path: '/',
    sameSite: 'lax'
  });
  res.json({ message: 'Logged out successfully' });
};

// Get current user
const getCurrentUser = (req, res) => {
  // Return user data without password
  const userResponse = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    createdAt: req.user.createdAt,
    isGroupMember: req.user.isGroupMember,
    profilePic: req.user.profilePic
  };
  res.json({ user: userResponse });
};

// Forgot Password - send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpType = 'reset';
    await user.save();
    await sendOTPEmail(user.email, otp, 'reset');
    res.json({ message: 'OTP sent to your email for password reset.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify OTP for password reset
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpType !== 'reset') {
      return res.status(401).json({ message: 'Invalid OTP' });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({ message: 'OTP expired' });
    }
    // Mark OTP as verified (but keep it for reset)
    user.otpType = 'reset-verified';
    await user.save();
    res.json({ message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpType !== 'reset-verified') {
      return res.status(401).json({ message: 'Invalid or unverified OTP' });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({ message: 'OTP expired' });
    }
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    // Clear OTP fields
    user.otp = null;
    user.otpExpiry = null;
    user.otpType = null;
    await user.save();
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  logout,
  getCurrentUser,
  forgotPassword,
  verifyResetOTP,
  resetPassword
}; 