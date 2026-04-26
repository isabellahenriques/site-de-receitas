const { registerUser, removeUser } = require('../services/userService');

async function create(req, res, next) {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    await removeUser({
      authenticatedUserId: req.auth.userId,
      userIdToDelete: req.params.id
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  remove
};
