const authService = require('../services/auth.service');
const notificationService = require('../services/notification.service');

// Register a new user
async function register(req,res,next){
    try{
        const { name, email, password } = req.body;

        if(!name || !email || !password){
            return res.status(400).json({
                success:false,
                message:"Name, email and password are required"
            });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({
                success:false,
                message:"Password must be at least 6 characters"
            });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success:false,
                message:"Please provide a valid email address"
            });
        }
        if (!email.endsWith('@gmail.com')) {
            return res.status(400).json({
                success:false,
                message:"Only @gmail.com email addresses are allowed"
            });
        }

        const user = await authService.registerUser(name, email, password);

        res.status(201).json({
            success:true,
            message:"User registered successfully",
            data: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }catch (error) {
        next(error);
    }
}

// User Login
async function login(req,res,next){
    try{
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Email and password are required"
            });
        }
        if (!email.endsWith('@gmail.com')) {
            return res.status(400).json({
                success:false,
                message:"Only @gmail.com email addresses are allowed"
            });
        }

        const result = await authService.loginUser(email, password);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        notificationService.createNotification(
            result.user.id,
            'New Login',
            'New login detected on your account.'
        ).catch((e) => console.error('Notification failed:', e.message));

        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken: result.accessToken,
            data: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email
            }
        });
    }catch (error) {
        next(error);
    }
}

// Refresh Access Token
async function refresh(req,res,next){
    try{
        const oldRefreshToken = req.cookies.refreshToken;
        const result = await authService.refreshAccessToken(oldRefreshToken);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            accessToken: result.accessToken
        });
    }catch (error) {
        next(error);
    }
}


// User Logout
async function logout(req, res, next) {
    try {
        const refreshToken = req.cookies.refreshToken;
        await authService.logoutUser(refreshToken);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        next(error);
    }
}

// Get Current User
async function getMe(req, res, next) {

  try {
    const user =
      await authService.getCurrentUser(
        req.user.id
      );

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
}


// Google Login
async function googleLogin(req,res,next){
    try{
        const { idToken } = req.body;
        if(!idToken){
            return res.status(400).json({
                success:false,
                message:"ID token is required"
            });
        }
        const result = await authService.googleLogin(idToken);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        notificationService.createNotification(
            result.user.id,
            'New Login',
            'New login detected on your account.'
        ).catch((e) => console.error('Notification failed:', e.message));

        res.status(200).json({
            success: true,
            message: 'Google login successful',
            accessToken: result.accessToken,
            data: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email
            }
        });
    }catch (error) {
        next(error);
    }
}


// Forgot Password — generate reset token (no email service, return token directly)
async function forgotPassword(req,res,next){
    try{
        const { email } = req.body;
        if(!email){
            return res.status(400).json({
                success:false,
                message:"Email is required"
            });
        }

        if (!email.endsWith('@gmail.com')) {
            return res.status(400).json({
                success: false,
                message: 'Only @gmail.com emails are allowed'
            });
        }

        const result = await authService.forgotPassword(email);

        if (!result.resetToken) {
            return res.status(200).json({
                success: true,
                message: 'If an account exists with that email, a reset link would be sent'
            });
        }

        res.status(200).json({
            success: true,
            data: { resetToken: result.resetToken },
            message: 'Use this token to reset your password'
        });
    } catch (error) {
        next(error);
    }
}

// Reset Password
async function resetPassword(req,res,next){
    try{
        const { token, newPassword } = req.body;
        if(!token || !newPassword){
            return res.status(400).json({
                success:false,
                message:"Token and new password are required"
            });
        }

        const result = await authService.resetPassword(token, newPassword);

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        }); 
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    refresh,
    logout,
    getMe,
    googleLogin,
    forgotPassword,
    resetPassword
};

   