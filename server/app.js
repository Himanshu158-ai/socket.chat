import express from "express"
import { createServer } from 'node:http';
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
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



server.listen(3000, () => {
    console.log("server start...");
})