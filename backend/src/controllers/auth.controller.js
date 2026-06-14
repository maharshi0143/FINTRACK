const authService = require('../services/auth.service');

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

        const result = await authService.loginUser(email, password);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

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
        const refreshToken = req.cookies.refreshToken;
        const accessToken = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            success: true,
            accessToken
        });
    }catch (error) {
        next(error);
    }
}


// User Logout
async function logout(req, res, next) {
    try {

        console.log(req.cookies);
        const refreshToken = req.cookies.refreshToken;

        console.log('Refresh token from cookie:', refreshToken);

        await authService.logoutUser(refreshToken);

        res.clearCookie('refreshToken');

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

      console.log(req.user);

    res.status(200).json({
      success: true,
      data: user
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
    getMe
};