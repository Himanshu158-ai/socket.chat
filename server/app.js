import express from "express"
import { createServer } from 'node:http';
import { Server } from "socket.io";
import dotenv from "dotenv"
dotenv.config();

const app = express();
const server = createServer(app);
const allowedOrigins = [
    process.env.CLIENT_URL
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    },
    transports: ["websocket"]
});

app.get('/', (req, res) => {
    res.send("starteddd");
})

io.on("connection", (socket) => {
    socket.on("user-joined", (name) => {
        socket.username = name;
        socket.broadcast.emit("recived-user", name);
    })
    socket.on("send-message", (data) => {
        io.emit("recived-message", data);
    })
    socket.on("disconnect", () => {
        socket.broadcast.emit("user-left", socket.username)
    })
    socket.on("typing", (name) => {
        socket.broadcast.emit("recived-typing", name);
    })
    socket.on("stop-typing", () => {
        socket.broadcast.emit("stop-typing");
    })
});

server.listen(process.env.PORT, () => {
    console.log(`server start on port ${process.env.PORT}`);
})