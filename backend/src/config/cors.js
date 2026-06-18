const env = require('./env');

const corsOptions = {
    origin: env.CLIENT_URL,
    credentials: true,
};

module.exports = corsOptions;

