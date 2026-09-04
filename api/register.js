const { handleRegister } = require("../lib/handlers");

module.exports = async (req, res) => {
  await handleRegister(req, res);
};
