const { login, logout } = require('../services/authService');

async function doLogin(req, res, next) {
  try {
    const result = await login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function doLogout(req, res, next) {
  try {
    logout(req.auth.token);
    return res.status(200).json({ message: 'Logout realizado com sucesso.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  doLogin,
  doLogout
};
