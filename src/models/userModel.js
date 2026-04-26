const bcrypt = require('bcryptjs');

const users = [];
let nextUserId = 1;

function createUser({ name, email, passwordHash }) {
  const user = {
    id: String(nextUserId++),
    name,
    email,
    passwordHash
  };

  users.push(user);
  return user;
}

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  return users.find((user) => user.id === String(id));
}

function comparePassword(plainTextPassword, passwordHash) {
  return bcrypt.compare(plainTextPassword, passwordHash);
}

function deleteUserById(id) {
  const index = users.findIndex((user) => user.id === String(id));

  if (index === -1) {
    return false;
  }

  users.splice(index, 1);
  return true;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  comparePassword,
  deleteUserById
};
