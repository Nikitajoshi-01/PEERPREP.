import dotenv from "dotenv";
dotenv.config();
console.log("ENV CHECK:", {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
});
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import { chatSocket } from "./sockets/chatSocket.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";



const app = express();
const httpServer = createServer(app);  // wrap express in http server for socket.io

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/groups", groupRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "PeerPrep API is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json(new ApiResponse(404, null, "Route not found"));
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const errors = err.errors || [];

  res.status(statusCode).json(
    new ApiResponse(statusCode, { errors }, message)
  );
});

// Socket.IO
chatSocket(io);

// ✅ use httpServer instead of app.listen
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});