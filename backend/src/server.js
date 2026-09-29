require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const { seedDatabase } = require('./config/seed');
const { setSocketIO } = require('./services/audit/auditService');
const { errorHandler } = require('./middleware/errorHandler');
const { registerMLClients } = require('./services/guardian/guardianGateway');
const mlRiskClient = require('./services/risk/mlRiskClient');
const anomalyClient = require('./services/anomaly/anomalyClient');
const llmService = require('./services/llm/llmService');

// Connect ML, Anomaly, and LLM reasoning pipelines
registerMLClients({
  riskClient: mlRiskClient,
  anomClient: anomalyClient,
  llmReasoner: llmService,
});

// Route imports
const authRoutes = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');
const toolRoutes = require('./routes/toolRoutes');
const policyRoutes = require('./routes/policyRoutes');
const guardianRoutes = require('./routes/guardianRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const auditRoutes = require('./routes/auditRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const modelRoutes = require('./routes/modelRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach socket io instance to app & audit service
app.set('io', io);
setSocketIO(io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Guardian Agent 2.0 Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/guardian', guardianRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/simulator', simulatorRoutes);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await seedDatabase();
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🛡️  Guardian Agent 2.0 Backend running on port ${PORT}`);
      console.log(`📡 Socket.IO enabled for realtime telemetry`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
