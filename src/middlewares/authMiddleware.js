const jwt = require('jsonwebtoken');
const { hasToken } = require('../models/tokenBlacklistModel');
const { findUserById } = require('../models/userModel');
const { AppError } = require('../utils/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

function getTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
}

function attachAuthFromToken(token, req, next, failSilently) {
  if (!token) {
    if (failSilently) {
      return next();
    }

    return next(new AppError(401, 'UNAUTHORIZED', 'Token de autenticação não informado.'));
  }

  if (hasToken(token)) {
    if (failSilently) {
      return next();
    }

    return next(new AppError(401, 'UNAUTHORIZED', 'Token inválido ou expirado.'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findUserById(payload.sub);

    if (!user) {
      if (failSilently) {
        return next();
      }

      return next(new AppError(401, 'UNAUTHORIZED', 'Token inválido ou expirado.'));
    }

    req.auth = {
      token,
      userId: user.id
    };

    return next();
  } catch (error) {
    if (failSilently) {
      return next();
    }

    return next(new AppError(401, 'UNAUTHORIZED', 'Token inválido ou expirado.'));
  }
}

function authenticateToken(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  return attachAuthFromToken(token, req, next, false);
}

function optionalAuthenticateToken(req, res, next) {
  const token = getTokenFromHeader(req.headers.authorization);
  return attachAuthFromToken(token, req, next, true);
}

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  JWT_SECRET
};
