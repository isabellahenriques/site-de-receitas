const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', userController.create);
router.delete('/:id', authenticateToken, userController.remove);

module.exports = router;
