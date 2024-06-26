// sessionSecret.js
const crypto = require("crypto");

const generateSessionSecret = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = generateSessionSecret;
