/* eslint-disable no-undef */
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/last-build", async (req, res) => {
  const { jobName } = req.body;

  if (!jobName) {
    return res.status(400).json({ message: "Missing Jenkins job name" });
  }

  const jenkinsUrl = `${process.env.JENKINS_BASE_URL}/job/${jobName}/api/json`;

  try {
    const response = await fetch(jenkinsUrl, {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.JENKINS_USER}:${process.env.JENKINS_PASSWORD}`).toString("base64"),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Jenkins error: ${text}`);
    }

    const buildData = await response.json();
    return res.json({ url: buildData.url });
  } catch (err) {
    console.error("Jenkins fetch error:", err.message);
    return res.status(500).json({ message: err.message });
  }
});



export default router;
