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
    socket.emit('buzzlist', buzzlists[index]);
    io.emit('round', index);

    socket.on('round', (n: number) => {
        if (n < 0) return;
        if (!buzzlists[n]) {
            buzzlists[n] = [];
        }
        index = n;
        io.emit('round', index);
        io.emit('buzzlist', buzzlists[index]);
    })

    socket.on('reset', () => {
        buzzlists.splice(0);
        buzzlists.push([]);
        index = 0;
        io.emit('round', index);
        io.emit('buzzlist', buzzlists[index]);
    })

    socket.on('activate', (i: number) => {
        console.log('activate');
        buzzlists[index].forEach((player, i2) => {
            player.active = i2 === i;
            player.wrong = i2 < i;
        });
        io.emit('buzzlist', buzzlists[index]);
    });

    socket.on('bad', (i:number) => {
        const player = buzzlists[index][i];
        if (!player.bad) {
            player.bad = true;
            player.wrong = true;
            if (player.active) {
                player.active = false;
                if (buzzlists[index][i + 1]) {
                    buzzlists[index][i + 1].active = true;
                }
            }
        } else {
            player.bad = false;
        }

        io.emit('buzzlist', buzzlists[index]);
    });


    socket.on('name', (name: string, cb: Function) => {
        player.name = name;
        cb && cb(name);
    });

    socket.on('buzz', () => {
        console.log('BUZZZ!', player.name);
        if (player.name) {
            const duplicateIndex = buzzlists[index].findIndex(({name, wrong}) => !wrong && name === player.name);
            if (duplicateIndex === -1) {
                buzzlists[index].push({
                    name: player.name,
                    time: moment().format("HH:mm:ss.SS"),
                    wrong: false,
                    active: buzzlists[index].findIndex(p => p.active) === -1,
                    bad: false,
                });
            }
        }
        io.emit('buzzlist', [...buzzlists[index]]);
    });
});

const PORT = process.env.PORT || 1111;
server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`)
});