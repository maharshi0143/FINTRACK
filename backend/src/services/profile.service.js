const profileRepository = require('../repositories/profile.repository');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');
// Get User Profile
async function getProfile(userId){
    return await profileRepository.getProfile(userId);
}

// Update User Profile
async function updateProfile(
    userId,
    name,
    currency,
    timezone
) {
    return await profileRepository.updateProfile(userId, name, currency, timezone);
}

// Update password
async function changePassword(
    userId,
    currentPassword,
    newPassword
) {
    const user =
        await userRepository.findUserById(
            userId
        );
    if (!user || !user.password_hash) {

        throw new AppError(
            'Cannot change password for this account',
            400
        );
    }
    const isMatch =
        await bcrypt.compare(
            currentPassword,
            user.password_hash
        );
    if (!isMatch) {
        throw new AppError(
            'Current password is incorrect',
            400
        );
    }
    const passwordHash =
        await bcrypt.hash(
            newPassword,
            12
        );
    await profileRepository.updatePassword(
        userId,
        passwordHash
    );
}


// Delete profile
async function deleteProfile(
    userId
) {
    const user =
        await profileRepository
            .deleteProfile(
                userId
            );
    if (!user) {
        throw new AppError(
            'User not found',
            404
        );
    }
}

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    deleteProfile
};