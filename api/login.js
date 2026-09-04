const { handleLogin } = require("../lib/handlers");

module.exports = async (req, res) => {
  await handleLogin(req, res);
};
