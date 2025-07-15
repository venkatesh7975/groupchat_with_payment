const fs = require('fs');

const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://mvenky9100:Venkatesh7975@groupchat.1u8swih.mongodb.net/?retryWrites=true&w=majority&appName=GROUPCHAT

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=https://groupchat-frontend.vercel.app/
CLOUDINARY_CLOUD_NAME=dapdgihj2
CLOUDINARY_API_KEY=925719585822326
CLOUDINARY_API_SECRET=_JcfGPqeC4p1Uc_dE6W7shADF-8

# Razorpay test credentials
RAZORPAY_KEY_ID=rzp_test_VRIWPAHf0qWVky
RAZORPAY_KEY_SECRET=KsJrzjGrSh3SkvUhNdVkNLsy


EMAIL=mvenky9100@gmail.com
PASSWORD=ijyk qiws hvug lucn
MONGODB_URI=mongodb://localhost:27017/auth-app`;

fs.writeFileSync('.env', envContent);
console.log('.env file created successfully!');
console.log('Please update the values according to your setup.');
console.log('For Gmail, use an App Password (not your main password).'); 