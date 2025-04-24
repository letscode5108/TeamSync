import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import {setupCronJobs} from "./config/cronJobs.js";
import cookieParser from "cookie-parser";

import http from "http";
import { Server } from "socket.io";
import socketHandler from './utils/socketHandler.js';
import meetingSocket from './utils/meetingSocket.js';

dotenv.config();
setupCronJobs();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


socketHandler(io);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return next(new Error('Authentication error: Invalid token'));
  }
  
  // Add user data to socket object
  socket.user = {
    userId: decoded.userId,
    role: decoded.role,
    name: decoded.name
  };
 
  next();
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


// Routes imports
import authRouter from "./route/auth.route.js";
import teamRouter from "./route/team.route.js";
import taskformanagerRouter from "./route/taskformanager.route.js";
import taskformemberRouter from "./route/taskformember.route.js";
import chatRouter from "./route/chat.route.js";
import commentRouter from "./route/comment.route.js";
import meetRouter from "./controllers/meet.controller.js";

//Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/teams", teamRouter);
app.use("/api/v1/tasks", taskformanagerRouter);
app.use("/api/v1/my-tasks", taskformemberRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/meetings", meetRouter);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
const PORT = process.env.PORT || 5000;



io.on("connection", (socket) => {
  meetingSocket(io, socket); 
});
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, io };
