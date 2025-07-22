import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import githubRoutes from "./routes/github.js";
import buildRoutes from "./routes/build.js";
import jenkinsRoutes from "./routes/jenkins.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/github", githubRoutes);
app.use("/api", buildRoutes);
app.use('/api/jenkins', jenkinsRoutes);

// // Add error handling middleware
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// eslint-disable-next-line no-undef
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
