const bcrypt = require('bcryptjs');
const {
  createUser,
  findUserByEmail,
  findUserById,
  deleteUserById
} = require('../models/userModel');
const { deleteRecipesByUserId } = require('../models/recipeModel');
const { AppError } = require('../utils/AppError');

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Nome, e-mail e senha são obrigatórios.');
  }

  if (password.length < 8) {
    throw new AppError(400, 'VALIDATION_ERROR', 'A senha deve ter no mínimo 8 caracteres.');
  }

  if (findUserByEmail(email)) {
    throw new AppError(409, 'CONFLICT', 'O e-mail informado já está em uso.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = createUser({ name, email, passwordHash });

  return sanitizeUser(user);
}

function removeUser({ authenticatedUserId, userIdToDelete }) {
  if (String(authenticatedUserId) !== String(userIdToDelete)) {
    throw new AppError(403, 'FORBIDDEN', 'Você só pode excluir a própria conta.');
  }

  const user = findUserById(userIdToDelete);

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'Usuário não encontrado.');
  }

  deleteRecipesByUserId(userIdToDelete);
  deleteUserById(userIdToDelete);
}

module.exports = {
  registerUser,
  removeUser
};
