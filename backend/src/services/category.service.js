const AppError = require('../utils/AppError');
const categoryRepository = require('../repositories/category.repository');

// Create a category
async function createCategory(userId, name, icon, color, type) {
    return await categoryRepository.createCategory(userId, name, icon, color, type);
}


// Get categories
async function getCategories(userId) {
    return await categoryRepository.getCategories(userId);
}

// Update a category by ID
async function updateCategory(categoryId, userId, name, icon, color, type) {
    const category = await categoryRepository.updateCategory(categoryId, userId, name, icon, color, type);
    if(!category){
        throw new AppError("Category not found", 404);
    }
    return category;
}

// Delete a category by ID
async function deleteCategory(categoryId, userId) {
    const category = await categoryRepository.deleteCategory(categoryId, userId);
    if(!category){
        throw new AppError("Category not found", 404);
    }
    return category;
}

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};