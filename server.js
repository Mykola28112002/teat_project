const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config(); // Додаємо підтримку .env

const SECRET_KEY = process.env.SECRET_KEY || "supersecret";
const User = require("./models/User");
const userController = require("./controllers/userController");

dns.setDefaultResultOrder("ipv4first");

// ✅ 1. Підключення до MongoDB перед запуском сервера

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Підключено до MongoDB"))
  .catch(err => console.error("❌ Помилка підключення:", err));

// ✅ 2. Middleware (розпарсування JSON)
app.use(express.json());

// ✅ 3. WebSockets (Socket.io)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Користувач підключився:", socket.id);

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", msg); // Відправляємо всім
  });

  socket.on("disconnect", () => {
    console.log("🔴 Користувач відключився:", socket.id);
  });
});

// ✅ 4. Маршрути
app.get("/", (req, res) => {
  res.send("Сервер працює!");
});

app.get("/users", userController.getUsers);

// ✅ 5. Реєстрація
app.post("/register", async (req, res) => {
  const { name, age, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = new User({ name, age, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "Реєстрація успішна" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ 6. Логін
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: "Користувача не знайдено" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: "Неправильний пароль" });
  }

  const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ message: "Вхід успішний", token });
});

// ✅ 7. Запуск сервера (правильний варіант!)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на порті ${PORT}`);
});
