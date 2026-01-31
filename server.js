const express = require("express");
const { disconnect } = require("node:cluster");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

let connectedPlayers = [];
let objective = 15;
let isGamePlaying = false;
let pathArchive = "archive/";
let firstEater = null;
var fs = require("fs");

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

app.get("/result", (req, res) => {
	fs.readFile(pathArchive + "/" + req.query.currentDate + ".json", "utf-8", (err, data) => {
		res.status(200).json(JSON.parse(data));
	});
});

app.get("/stats", (req, res) => {
	res.sendFile(join(__dirname, "pages/stat.html"));
});

io.on("connection", (socket) => {
	console.log("a user connected:", socket.id);

	socket.on("playerName", (name) => {
		console.log("Pseudo reçu:", name);
		socket.username = name;

		connectedPlayers.push({ id: socket.id, name, score: 0 });

		io.emit("updatePlayerList", connectedPlayers);
	});

	socket.on("start", () => {
		isGamePlaying = true;
		io.emit("startGame");
	});
	socket.on("isStarted", () => {
		if (isGamePlaying) io.emit("startGame");
	});

	socket.on("addScore", () => {
		const index = connectedPlayers.findIndex((e) => {
			return e.id == socket.id;
		});
		if (index <= -1) return;

		const currentPlayer = connectedPlayers[index];
		if (firstEater == null) firstEater = currentPlayer;

		objective--;
		connectedPlayers[index] = { id: socket.id, name: currentPlayer.name, score: currentPlayer.score + 1 };

		io.emit("updatePlayerScore", connectedPlayers[index]);

		if (objective <= 0) {
			const dataToSave = {
				firstEater,
				lastEater: currentPlayer,
				resumeGame: connectedPlayers,
			};
			const currentDate = Date.now();
			io.emit("endGame", currentDate);
			console.log("before write" );
			fs.writeFile(pathArchive + "/" + currentDate + ".json", JSON.stringify(dataToSave), () => {
				isGamePlaying = false;
				firstEater = null;
			});
			console.log("after write");
		}
	});

	socket.on("disconnect", () => {
		console.log("user disconnected:", socket.id);

		const index = connectedPlayers.findIndex((e) => {
			return e.id == socket.id;
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
