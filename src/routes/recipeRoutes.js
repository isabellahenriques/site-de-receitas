const express = require('express');
const recipeController = require('../controllers/recipeController');
const { authenticateToken, optionalAuthenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', recipeController.listPublic);
router.get('/my', authenticateToken, recipeController.listMine);
router.get('/:id', optionalAuthenticateToken, recipeController.getById);
router.post('/', authenticateToken, recipeController.create);
router.put('/:id', authenticateToken, recipeController.update);
router.delete('/:id', authenticateToken, recipeController.remove);

module.exports = router;
