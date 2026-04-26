const jwt = require('jsonwebtoken');
const { findUserByEmail, comparePassword } = require('../models/userModel');
const { addToken } = require('../models/tokenBlacklistModel');
const { AppError } = require('../utils/AppError');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const JWT_EXPIRES_IN = '24h';

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'E-mail e senha são obrigatórios.');
  }

  const user = findUserByEmail(email);

  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'E-mail ou senha inválidos.');
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, 'UNAUTHORIZED', 'E-mail ou senha inválidos.');
  }

  const token = jwt.sign({}, JWT_SECRET, {
    subject: user.id,
    expiresIn: JWT_EXPIRES_IN
  });

  return {
    token,
    expiresIn: JWT_EXPIRES_IN
  };
}

function logout(token) {
  addToken(token);
}

module.exports = {
  login,
  logout
};
