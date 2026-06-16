const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

let io;

function initializeSocket(server){
    io = new Server(server,{
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
        console.log(
            'User connected:',
            socket.id,
            'userId:',
            socket.userId
        );

        socket.join(String(socket.userId));
        console.log(`User ${socket.userId} joined their room`);

        socket.on('disconnect',() => {
            console.log('User disconnected:',socket.id);
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
