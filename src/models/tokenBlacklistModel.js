const invalidatedTokens = new Set();

function addToken(token) {
  invalidatedTokens.add(token);
}

function hasToken(token) {
  return invalidatedTokens.has(token);
}

module.exports = {
  addToken,
  hasToken
};
