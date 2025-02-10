const User = require("../models/User");

exports.getUsers = async () => {
  return await User.find(); // Отримуємо всіх користувачів з БД
};
