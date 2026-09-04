const { handleHistory } = require("../lib/handlers");

module.exports = async (req, res) => {
  await handleHistory(req, res);
};
