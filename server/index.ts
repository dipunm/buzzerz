import http from 'http';
import path from 'path';
import express from 'express';
import socketio from 'socket.io';
import moment from 'moment';

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(path.join(__dirname, '../build')));

const players: {
    [id:string]: {
        name?: string
    }
} = {};

let index = 0;
const buzzlists: BuzzStat[][] = [
    [],
];

io.on('connect', socket => {
    players[socket.id] = {};
    const player = players[socket.id];
    console.log('connection yay!', socket.id);

    socket.on('name', (name: string, cb: Function) => {
        player.name = name;
        cb && cb(name);
    });

    socket.on('buzz', () => {
        console.log('BUZZZ!', player.name);
        if (player.name) {
            const duplicateIndex = buzzlists[index].findIndex(({name}) => name === player.name);
            if (duplicateIndex === -1) {
                buzzlists[index].push({
                    name: player.name,
                    time: moment().format("HH:mm:ss.SS"),
                });
            }
        }
        socket.emit('buzzlist', buzzlists[index]);
    });
});

const PORT = process.env.PORT || 1111;
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`)
});