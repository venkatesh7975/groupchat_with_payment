const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middlewares/auth');
const {
  getProfile,
  updateProfile,
  updateProfilePicture
} = require('../controllers/userController');

// Multer setup (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/picture', upload.single('profilePic'), updateProfilePicture);

module.exports = router; 