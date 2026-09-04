const { handleVerify } = require("../lib/handlers");

module.exports = async (req, res) => {
  await handleVerify(req, res);
};
