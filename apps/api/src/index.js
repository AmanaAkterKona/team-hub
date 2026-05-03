require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const app = express();
const httpServer = createServer(app);

// CORS Origins Setup
const allowedOrigins = [
  process.env.CLIENT_URL, // Railway Frontend URL
  "http://localhost:3000" // Local Development
];

// Socket.io Setup with updated CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.use(helmet());

// Finalized CORS Configuration for Cookies
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) or if in allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Team Hub API running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/workspaces", require("./routes/workspaces"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/action-items", require("./routes/actionItems"));

// Swagger Documentation
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

// Socket.io Logic
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

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
});