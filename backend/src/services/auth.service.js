const bcrypt = require('bcrypt');
const crypto = require('crypto');

const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');

const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  const payload =
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
    const { password_hash, ...safeUser } = user;
    return safeUser;
}

// Google OAuth Login
async function googleLogin(
    idToken
) {

    // Verify token with Google
    const ticket =
        await client.verifyIdToken({
            idToken,
            audience:
                process.env.GOOGLE_CLIENT_ID
        });

    // Extract user information
    const payload =
        ticket.getPayload();

    const {
        sub,
        name,
        email
    } = payload;

    // Find user by Google ID
    let user =
        await userRepository.findUserByGoogleId(
            sub
        );

    // First login with this Google account
    if (!user) {

        // Check if email already exists (registered via email/password)
        const existingUser =
            await userRepository.findUserByEmail(
                email
            );

        if (existingUser) {
            // Link Google account to existing user
            user =
                await userRepository.linkGoogleAccount(
                    existingUser.id,
                    sub
                );
        } else {
            // Create a new user with Google account
            user =
                await userRepository.createGoogleUser(
                    name,
                    email,
                    sub
                );
        }
    }

    // Generate tokens
    const accessToken =
        generateAccessToken(
            user.id
        );

    const refreshToken =
        generateRefreshToken(
            user.id
        );

    // Save refresh token
    const expiresAt =
        new Date(
            Date.now()
            + 7 * 24 * 60 * 60 * 1000
        );

    await refreshTokenRepository
        .createRefreshToken(
            user.id,
            refreshToken,
            expiresAt
        );

    return {
        accessToken,
        refreshToken,
        user
    };
}

// Forgot Password - Generate Reset Token
async function forgotPassword(
    email
) {

    // Find user
    const user =
        await userRepository.findUserByEmail(
            email
        );

    if (!user) {

        throw new AppError(
            'User not found',
            404
        );

    }

    // Generate secure token
    const resetToken =
        crypto
            .randomBytes(32)
            .toString('hex');

    // Expire after 15 minutes
    const expires =
        new Date(
            Date.now()
            + 15 * 60 * 1000
        );

    // Store token
    await userRepository.updateResetPasswordToken(
        user.id,
        resetToken,
        expires
    );

    return {
        resetToken
    };

}


// Reset password
async function resetPassword(
    token,
    newPassword
) {

    // Find user by token
    const user =
        await userRepository.findUserByResetToken(
            token
        );

    if (!user) {

        throw new AppError(
            'Invalid reset token',
            400
        );

    }

    // Check expiration
    if (
        user.reset_password_expires
        < new Date()
    ) {

        throw new AppError(
            'Reset token expired',
            400
        );

    }

    // Hash password
    const passwordHash =
        await bcrypt.hash(
            newPassword,
            12
        );

    // Update password
    await userRepository.updatePassword(
        user.id,
        passwordHash
    );

    // Clear token
    await userRepository.clearResetPasswordToken(
        user.id
    );

}

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser,
    googleLogin,
    forgotPassword,
    resetPassword
}