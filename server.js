const express = require("express");
const { disconnect } = require("node:cluster");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

const connectedPlayers = [];

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

		connectedPlayers.push({ id: socket.id, name, score: 0 });

		io.emit("updatePlayerList", connectedPlayers);
	});

	socket.on("addScore", () => {
		console.log("Add score to", socket.id);

		const index = connectedPlayers.findIndex((e) => {
			e.id == socket.id;
		});
		if (index > -1) {
			connectedPlayers[index] = { id: socket.id, name: connectedPlayers[index].name, score: connectedPlayers[index].score++ };
		}

		io.emit("updatePlayerScore", connectedPlayers[index]);
	});

	socket.on("disconnect", () => {
		console.log("user disconnected:", socket.id);

		const index = connectedPlayers.findIndex((e) => {
			e.id == socket.id;
		});
		if (index > -1) {
			// only splice array when item is found
			connectedPlayers.splice(index, 1); // 2nd parameter means remove one item only
		}

		io.emit("updatePlayerList", connectedPlayers);
	});
});

server.listen(port, () => {
	console.log("server running at http://localhost:3000");
});
