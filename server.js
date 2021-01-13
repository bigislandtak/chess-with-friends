const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: '*' }
});
const cors = require('cors');

const index = require('./routes/index');
const PORT = process.env.PORT || 3000;

app.use(index);
app.use(cors());

const roomConfigs = {}; // could potentially store game state in here but prop not worth it

io.on('connection', socket => {
    console.log(`socket id: ${socket.id} connected`)

    const { roomId } = socket.handshake.query;

    // For new rooms, initialize number of clients to 0
    if (!(roomId in roomConfigs))
        roomConfigs[roomId] = { numClients: 0, clients: {} };

        
    if (roomConfigs[roomId].numClients < 2) {
        let color = (Math.round(Math.random()) === 1)? 'b' : 'w';
        if (roomConfigs[roomId].numClients === 1) {
            const opponentSocketId = Object.keys(roomConfigs[roomId].clients)[0];
            console.log(opponentSocketId)
            color = (roomConfigs[roomId].clients[opponentSocketId] === 'b')? 'w' : 'b';
            io.to(opponentSocketId).emit("pgnRequest", socket.id);
        }
        socket.join(roomId);
        roomConfigs[roomId].numClients++;
        roomConfigs[roomId].clients[socket.id] = color;
        socket.emit("colorAssignment", color);
    } else {
        socket.emit("roomIsFull");
        socket.disconnect();
    }

    console.log(`${roomConfigs[roomId].numClients} player(s) in room "${roomId}"`);

    // Listen for new moves
    socket.on("newMove", move => {
        if (roomConfigs[roomId].numClients === 2)
            io.to(roomId).emit("newMove", move);
    });

    socket.on("pgnResponse", (pgn, toId) => {
        io.to(toId).emit("syncBoard", pgn);
    });

    socket.on("newMessage", message => {
        io.to(roomId).emit("newMessage", message);
    });

    socket.on('disconnect', () => {
        console.log("client disconnected")
        socket.leave(roomId);
        roomConfigs[roomId].numClients--;
        delete roomConfigs[roomId].clients[socket.id];
        console.log(`${roomConfigs[roomId].numClients} player(s) in room "${roomId}"`);
    });
});

http.listen(PORT, () => {
    console.log(`Listening on *:${PORT}`);
});