require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Team Hub API running" });
});
app.use("/api/auth", require("./routes/auth"));
app.use("/api/workspaces", require("./routes/workspaces"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/action-items", require("./routes/actionItems"));
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Team Hub API", version: "1.0.0" },
    servers: [{ url: process.env.API_URL || "http://localhost:4000" }],
  },
  apis: ["./src/routes/*.js"],
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join:workspace", ({ workspaceId, userId }) => {
    socket.join(workspaceId);
    socket.data.userId = userId;
    socket.data.workspaceId = workspaceId;
    if (!onlineUsers.has(workspaceId)) onlineUsers.set(workspaceId, new Set());
    onlineUsers.get(workspaceId).add(userId);
    io.to(workspaceId).emit("online:members", [...onlineUsers.get(workspaceId)]);
  });

  socket.on("disconnect", () => {
    const { userId, workspaceId } = socket.data;
    if (workspaceId && onlineUsers.has(workspaceId)) {
      onlineUsers.get(workspaceId).delete(userId);
      io.to(workspaceId).emit("online:members", [...onlineUsers.get(workspaceId)]);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
});