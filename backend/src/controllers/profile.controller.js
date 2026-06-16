const profileService = require('../services/profile.service');

// Get User Profile
async function getProfile(req,res,next){
    try{
        const profile = await profileService.getProfile(req.user.id);
        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
}

// Update User Profile
async function updateProfile(
    req,
    res,
    next
) {
    try {
        const {
            name,
            currency,
            timezone
        } = req.body;

        const profile =
            await profileService
                .updateProfile(
                    req.user.id,
                    name,
                    currency,
                    timezone
                );

        res.status(200).json({
            success: true,
            message:
                'Profile updated successfully',
            data: profile
        });

    } catch (error) {
        next(error);
    }
}

// Update Password
async function changePassword(
    req,
    res,
    next
) {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;
        if (
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Current password and new password are required'
            });
        }
        await profileService.changePassword(
            req.user.id,
            currentPassword,
            newPassword
        );
        res.status(200).json({
            success: true,
            message:
                'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
}

// Delete profile
async function deleteProfile(req,res,next){
    try{
        await profileService.deleteProfile(req.user.id);
        res.clearCookie('refreshToken');
        res.status(200).json({
            success: true,
            message: 'Profile deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    deleteProfile
};