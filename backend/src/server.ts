import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { pool } from "./database/postgres.js";
import { redisClient } from "./database/redis.js";
import { setupWebSocket } from "./websocket/server.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
    const result = await pool.query(
      "SELECT current_database(), current_user, NOW() AS time"
    );

    res.json({
      success: true,
      database: "postgresql",
      status: "healthy",
      databaseName: result.rows[0].current_database,
      user: result.rows[0].current_user,
      time: result.rows[0].time
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      database: "postgresql",
      status: "unhealthy"
    });
  }
});

app.get("/health/redis", async (_req, res) => {
  try {
    const pong = await redisClient.ping();

    res.json({
      success: true,
      redis: "memurai",
      status: "healthy",
      response: pong
    });
  } catch (error) {
    console.error("Redis connection error:", error);

    res.status(500).json({
      success: false,
      redis: "memurai",
      status: "unhealthy"
    });
  }
});

async function startServer() {
  try {
    await redisClient.connect();

    console.log("Redis connected successfully");

    const httpServer = createServer(app);

    setupWebSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
      console.log(`WebSocket running on ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
