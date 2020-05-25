import http from 'http';
import path from 'path';
import express from 'express';
import socketio from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(path.join(__dirname, '../build')));

const players: {
    [id:string]: {
        name?: string
    }
} = {};

io.on('connect', socket => {
    players[socket.id] = {};
    console.log('connection yay!', socket.id);

    socket.on('name', name => {
        players[socket.id].name = name;
    });

    socket.on('buzz', (event) => {
        console.log('BUZZZ!');
    });
});

const PORT = process.env.PORT || 1111;
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`)
});