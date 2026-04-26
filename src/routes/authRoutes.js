const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', authController.doLogin);
router.post('/logout', authenticateToken, authController.doLogout);

module.exports = router;
