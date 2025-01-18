const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/admin.html");
});

const clients = {}; // Store clients by room ID
const socketRoomMap = {};

io.on("connection", (socket) => {
    console.log("Admin connected");
    // Admin joins a room
    socket.on("client-room-id", (roomId) => {
        console.log("Room ID from backend index.js", roomId);
        if (!clients[roomId]) {
            clients[roomId] = [];
        }
        clients[roomId].push(socket); // Add the admin to the room
        console.log(socket.id, "socketid-in-roomjoined");
        socketRoomMap[socket.id] = roomId;
        console.log("Socket-room map:", socketRoomMap);
        console.log(`Admin joined room: ${roomId}`);
        socket.emit("start-sharing"); // Inform the client to start sharing
    });

    // Handle WebRTC offer
    socket.on("webrtc-offer", (offer) => {
        console.log(socket.id, "Socketid-in-offer");
        console.log(socketRoomMap, "socketRoomMap")
        const roomId = socketRoomMap[`${socket.id}`]; // Retrieve roomId from the map
        console.log("webrtc-offer fired, roomId:", roomId);
        console.log(offer, "webrtc-offer-server");
        socket.broadcast.emit("webrtc-offer", offer, roomId);
    });

    // Handle WebRTC answer
    socket.on("webrtc-answer", (answer) => {
        console.log(answer, "webrtc-answer-server");
        socket.broadcast.emit("webrtc-answer", answer);
    });

    // Handle ICE candidates
    socket.on("webrtc-candidate", (candidate, roomId) => {
        console.log(roomId, "webrtc-candidate-server");
        socket.broadcast.emit("webrtc-candidate", candidate, roomId);
    });

    // Handle mouse and keyboard events
    socket.on("mouse-move", (data) => {
        console.log(data, "Data in Mouse Move")
        console.log(data.roomId, "Mouse Click RoomID");
        socket.broadcast.to(data.roomId).emit("mouse-move", JSON.stringify(data));
    });

    socket.on("mouse-click", (data) => {
        console.log(data.roomId, "Mouse Click RoomID");
        socket.broadcast.to(data.roomId).emit("mouse-click", JSON.stringify(data));
    });

    socket.on("key-press", (data) => {
        console.log(data.roomId, "Mouse Click RoomID");
        socket.broadcast.to(data.roomId).emit("mouse-type", JSON.stringify(data));
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        console.log("Admin disconnected");
        for (const roomId in clients) {
            const index = clients[roomId].indexOf(socket);
            if (index > -1) {
                clients[roomId].splice(index, 1); // Remove admin from the room
            }
        }
    });
});

server.listen(5000, () => {
    console.log("Server running at http://localhost:5000");
});