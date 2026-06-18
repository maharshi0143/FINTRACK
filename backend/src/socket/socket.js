const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let io;

function initializeSocket(server){
    io = new Server(server,{
        cors: {
            origin: env.CLIENT_URL,
            credentials: true
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on(
    'connection',
    socket => {
        socket.join(String(socket.userId));

        socket.on('disconnect',() => {
            // no-op
        });
    });
}


function getIO(){
    if(!io){
        throw new Error("Socket.io not initialized");
    }
    return io;
}


module.exports = {
    initializeSocket,
    getIO
};
