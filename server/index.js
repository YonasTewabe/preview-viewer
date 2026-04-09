import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import githubRoutes from "./routes/github.js";
import buildRoutes from "./routes/build.js";
import jenkinsRoutes from "./routes/jenkins.js";
import nodesSampleFileRoutes from "./routes/nodesSampleFileRoutes.js";
import projectsRoutes from "./routes/projects.js";
import usersRoutes from "./routes/users.js";
import previewDeployRoutes from "./routes/previewDeployRoutes.js";
import previewServicesRoutes from "./routes/previewServicesRoutes.js";
import nodeByIdRoutes from "./routes/nodeByIdRoutes.js";
import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/emails.js";
import branchRoutes from "./routes/branches.js";
import urlConfigsRoutes from "./routes/urlconfigs.js";
import environmentsRoutes from "./routes/environments.js";
import statsRoutes from "./routes/stats.js";

import { testConnection } from "./config/database.js";
import { initAssociations, syncDatabase } from "./models/index.js";
import { scheduleStalePreviewNodeCleanup } from "./jobs/stalePreviewNodeCleanup.js";

dotenv.config();
const app = express();

// ✅ Dynamic CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://preview.ienetworks.co",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// ✅ API Routes — preview nodes (deploy/env/build + frontend-role create)
app.use("/api/preview-nodes", previewDeployRoutes);
// ✅ API Routes — preview service parents (api_service CRUD, import/export)
app.use("/api/preview-services", previewServicesRoutes);
/** Unified GET (and legacy redirects use this) */
app.use("/api/node", nodeByIdRoutes);

app.use("/api/github", githubRoutes);
app.use("/api", buildRoutes);
app.use("/api/jenkins", jenkinsRoutes);
app.use("/api/nodes-static-json", nodesSampleFileRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/users", usersRoutes);

// Legacy path aliases (same routers)
app.use("/api/nodes/backend", previewServicesRoutes);
app.use("/api/nodes/frontend", previewDeployRoutes);
app.use("/api/preview-nodes/web", previewDeployRoutes);
app.use("/api/preview-nodes/api", previewServicesRoutes);
app.use("/api/backendnodes", previewServicesRoutes);
app.use("/api/frontendnodes", previewDeployRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/urlconfigs", urlConfigsRoutes);
app.use("/api", environmentsRoutes);
app.use("/api/stats", statsRoutes);

// ✅ Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// ✅ Initialize associations and DB connection before routes execute
const startServer = async () => {
  try {
    initAssociations();

    await testConnection();

    try {
      await syncDatabase();
      console.warn("✅ Database synchronized successfully");
    } catch (syncError) {
      console.warn("⚠️  Database sync warning:", syncError.message);
    }

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.warn(`🚀 Server is running on port ${PORT}`);
      scheduleStalePreviewNodeCleanup();
    });
  } catch (error) {
    console.error("❌ Startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
