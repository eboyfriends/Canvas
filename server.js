const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

const users = new Map();
const drawings = [];

io.on('connection', (socket) => {

    socket.on('join', (data) => {
        users.set(socket.id, { 
            name: data.name, 
            position: { x: 0, y: 0 },
            cursorColor: data.cursorColor,
            nameColor: data.nameColor,
            nameBackground: data.nameBackground,
            lineColor: data.lineColor,
            lineSize: data.lineSize
        });

        socket.emit('users', Array.from(users.entries()));
        socket.emit('drawings', drawings);
        socket.broadcast.emit('users', [[socket.id, users.get(socket.id)]]);
    });

    socket.on('cursor', (data) => {
        if (users.has(socket.id)) {
            const user = users.get(socket.id);
            user.position = data.position;

            socket.broadcast.emit('cursor', { 
                id: socket.id, 
                position: data.position, 
                name: user.name,
                cursorColor: user.cursorColor,
                nameColor: user.nameColor,
                nameBackground: user.nameBackground
            });
        }
    });

    socket.on('draw', (data) => {
        const user = users.get(socket.id);

        data.lineColor = user.lineColor;
        data.lineSize = user.lineSize;
        
        drawings.push(data);
        socket.broadcast.emit('draw', data);
    });

    socket.on('disconnect', (data) => {
        users.delete(socket.id);
        io.emit('userLeft', socket.id);
    });

    socket.on('update', (data) => {
        if (users.has(socket.id)) {
            const user = users.get(socket.id);

            user.lineColor = data.lineColor;
            user.lineSize = data.lineSize;
            user.nameBackground = data.nameBackground;
            user.nameColor = data.nameColor;
            user.cursorColor = data.cursorColor;

            socket.broadcast.emit('update', {
                id: socket.id,
                lineColor: data.lineColor,
                lineSize: data.lineSize,
                nameBackground: data.nameBackground,
                nameColor: data.nameColor,
                cursorColor: data.cursorColor
            });
        }
    })
});

server.listen(3000);
