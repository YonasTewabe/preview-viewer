import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import githubRoutes from "./routes/github.js";
import buildRoutes from "./routes/build.js";
import jenkinsRoutes from "./routes/jenkins.js";
import nodesRoutes from "./routes/nodes.js";
import backendnodesRoutes from "./routes/backendnodes.js";
import projectsRoutes from "./routes/projects.js";
import usersRoutes from "./routes/users.js";
import frontendnodesRoutes from "./routes/frontendnodes.js";
import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/emails.js";
import branchRoutes from "./routes/branches.js";
import urlConfigsRoutes from "./routes/urlconfigs.js";
import environmentsRoutes from "./routes/environments.js";

import { testConnection } from "./config/database.js";
import { initAssociations, syncDatabase } from "./models/index.js";

dotenv.config();
const app = express();

// ✅ Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  "https://preview.ienetworks.co"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ✅ API Routes
app.use("/api/github", githubRoutes);
app.use("/api", buildRoutes);
app.use("/api/jenkins", jenkinsRoutes);
app.use("/api/nodes", nodesRoutes);
app.use("/api/backendnodes", backendnodesRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/frontendnodes", frontendnodesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/urlconfigs", urlConfigsRoutes);
app.use("/api", environmentsRoutes);

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ Initialize associations and DB connection before routes execute
const startServer = async () => {
  try {
    // Initialize associations first
    initAssociations();
    
    // Test database connection
    await testConnection();
    
    // Sync database to create missing tables (won't alter existing tables)
    try {
      await syncDatabase(false);
      console.log('✅ Database tables synced');
    } catch (syncError) {
      console.warn('⚠️  Database sync warning:', syncError.message);
      // Continue even if sync has issues (tables might already exist)
    }
    
    // Start server after successful connection
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
