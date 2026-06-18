const jwt = require('jsonwebtoken');

function generateAccessToken(userId) {
    return jwt.sign(
        {
            userId
        },
        process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod',
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
    );
}


function generateRefreshToken(userId) {
    return jwt.sign(
        {
            userId
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: '7d'
        }
    );
}

function verifyRefreshToken(token) {
    return jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET
    );
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};
