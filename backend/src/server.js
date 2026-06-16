require('dotenv').config();
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initializeSocket } = require('./socket/socket');
const { startDailyReminder } = require('./cron/reminders');

const server = http.createServer(app);
// Initialize socket.io with the server
initializeSocket(server);

// Start daily expense reminder cron
startDailyReminder();

server.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});