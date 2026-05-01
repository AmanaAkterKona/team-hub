const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true }
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/action-items', require('./routes/actionItems'));

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Socket.io
require('../../../apps/api/src/socket')(io);

httpServer.listen(process.env.PORT || 4000);