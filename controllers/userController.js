const UserService = require("../services/userService");

exports.getUsers = async (req, res) => {
  const users = await UserService.getUsers();
  res.json(users);
};
