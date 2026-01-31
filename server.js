const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

const connectedPlayers = new Map();

app.use(express.static(__dirname));

app.get("/", (req, res) => {
	res.sendFile(join(__dirname, "index.html"));
});

app.get("/master", (req, res) => {
	res.sendFile(join(__dirname, "pages/manager.html"));
});

app.get("/minion", (req, res) => {
	res.sendFile(join(__dirname, "pages/servant.html"));
});

io.on("connection", (socket) => {
	console.log("a user connected:", socket.id);

	socket.on("playerName", (name) => {
		console.log("Pseudo reçu:", name);
		socket.username = name;

		connectedPlayers.set(socket.id, name);

		io.emit("updatePlayerList", Array.from(connectedPlayers.values()));
	});

	socket.on("disconnect", () => {
		console.log("user disconnected:", socket.id);

		connectedPlayers.delete(socket.id);

		io.emit("updatePlayerList", Array.from(connectedPlayers.values()));
	});
});

server.listen(port, () => {
	console.log("server running at http://localhost:3000");
});
