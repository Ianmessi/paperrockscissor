const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, '/')));

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', () => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms.set(roomCode, {
            players: [socket.id],
            moves: {},
            rounds: 0
        });
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room && room.players.length < 2) {
            room.players.push(socket.id);
            socket.join(roomCode);
            socket.emit('joinedRoom', roomCode);
            io.to(roomCode).emit('gameReady');
        } else {
            socket.emit('roomError', 'Room not found or full');
        }
    });

    socket.on('move', ({ roomCode, move }) => {
        const room = rooms.get(roomCode);
        if (room) {
            room.moves[socket.id] = move;
            if (Object.keys(room.moves).length === 2) {
                const moves = Object.values(room.moves);
                io.to(roomCode).emit('roundResult', {
                    moves: moves,
                    result: determineWinner(moves[0], moves[1])
                });
                room.moves = {};
                room.rounds++;
            }
        }
    });

    socket.on('disconnect', () => {
        rooms.forEach((room, roomCode) => {
            if (room.players.includes(socket.id)) {
                io.to(roomCode).emit('playerLeft');
                rooms.delete(roomCode);
            }
        });
    });
});

function determineWinner(move1, move2) {
    if (move1 === move2) return 'draw';
    if (
        (move1 === 'Rock' && move2 === 'Scissors') ||
        (move1 === 'Paper' && move2 === 'Rock') ||
        (move1 === 'Scissors' && move2 === 'Paper')
    ) {
        return 'player1';
    }
    return 'player2';
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});