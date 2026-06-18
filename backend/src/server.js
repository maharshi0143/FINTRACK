require('dotenv').config();
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');
const { initializeSocket } = require('./socket/socket');
const { startDailyReminder } = require('./cron/reminders');

const server = http.createServer(app);
initializeSocket(server);

startDailyReminder();

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

function shutdown() {
    console.log('Shutting down gracefully...');
    server.close(() => pool.end(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000);
}
process.on('SIGINT', shutdown).on('SIGTERM', shutdown);

function onListen() {
    console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${env.PORT} in use, retrying in 1s...`);
        const retryListen = () => server.listen(env.PORT, onListen);
        server.close(retryListen);
    }
});

server.listen(env.PORT, onListen);