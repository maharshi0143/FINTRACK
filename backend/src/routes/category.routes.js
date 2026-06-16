const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create a category
router.post('/', authMiddleware, categoryController.createCategory);

// Get all categories
router.get('/', authMiddleware, categoryController.getCategories);
 
// Update a category by ID
router.put('/:id', authMiddleware, categoryController.updateCategory);

// Delete a category by ID
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;