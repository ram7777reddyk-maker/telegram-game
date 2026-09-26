import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";

import authRoutes from "./auth/authRoutes.js";
import { redisClient } from "./database/redis.js";
import { setupWebSocket } from "./websocket/server.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "telegram-game-backend",
    status: "healthy"
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    const { pool } = await import("./database/postgres.js");

    await pool.query("SELECT 1");

    res.json({
      success: true,
      database: "connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      database: "disconnected"
    });
  }
});

app.get("/health/redis", async (_req, res) => {
  try {
    const connected = redisClient.isReady;

    if (!connected) {
      res.status(500).json({
        success: false,
        redis: "disconnected"
      });
      return;
    }

    res.json({
      success: true,
      redis: "connected"
    });
  } catch (error) {
    console.error("Redis health check failed:", error);

    res.status(500).json({
      success: false,
      redis: "disconnected"
    });
  }
});

app.use("/auth", authRoutes);

setupWebSocket(httpServer);

async function startServer() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    console.log("Redis connected successfully");

    httpServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
      console.log(`WebSocket running on ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
