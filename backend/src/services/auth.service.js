const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');

const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// Register a new user
async function registerUser(name, email, password) {
    const existingUser = await userRepository.findUserByEmail(email);

    if(existingUser){
        throw new AppError('User with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.createUser(name, email, passwordHash);
    return user;
}


// User Login
async function loginUser(email, password) {
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw new AppError(
      'Invalid email or password',
      401
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isPasswordMatched) {
    throw new AppError(
      'Invalid email or password',
      401
    );
  }

  const accessToken = generateAccessToken(user.id);

  const refreshToken = generateRefreshToken(user.id);

  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshTokenRepository.createRefreshToken(
    user.id,
    refreshToken,
    expiresAt
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
}

// Refresh Access Token
async function refreshAccessToken(refreshToken) {

  if (!refreshToken) {
    throw new AppError(
      'Refresh token missing',
      401
    );
  }

  verifyRefreshToken(refreshToken);

  const storedToken =
    await refreshTokenRepository.findRefreshToken(
      refreshToken
    );

  if (!storedToken) {
    throw new AppError(
      'Invalid refresh token',
      401
    );
  }

  const payload =
    verifyRefreshToken(refreshToken);

  const accessToken =
    generateAccessToken(payload.userId);

  return accessToken;
}


// User Logout
async function logoutUser(refreshToken) {

    if (!refreshToken) {
        throw new AppError(
            'Refresh token not found',
            401
        );
    }

    const deletedToken =
        await refreshTokenRepository.deleteRefreshToken(
            refreshToken
        );

    console.log(deletedToken);

    if (!deletedToken) {
        throw new AppError(
            'Invalid refresh token',
            401
        );
    }
}


// Get current user by ID
async function getCurrentUser(userId){
    const user = await userRepository.findUserById(userId);

    if(!user){
        throw new AppError('User not found', 404);
    }
    return user;
}

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser
}