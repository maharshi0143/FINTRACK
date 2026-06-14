const jwt = require('jsonwebtoken');

function generateAccessToken(userId) {
    return jwt.sign(
        {
            userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
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
