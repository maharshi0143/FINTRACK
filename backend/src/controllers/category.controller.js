const categoryService = require('../services/category.service');

// Create a category
async function createCategory(req,res,next){
    try{
        const { name, icon, color, type } = req.body;

        if(!name || !type){
            return res.status(400).json({
                success: false,
                message: "Name and type are required"
            });
        }

        const category = await categoryService.createCategory(req.user.id, name, icon, color, type);
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });
    }catch(error){
        next(error);
    }
}

// Get all categories
async function getCategories(req,res,next){
    try{
        const categories = await categoryService.getCategories(req.user.id);
        res.status(200).json({
            success: true,
            data: categories
        });
    }catch(error){
        next(error);
    }
}

// Update a category by ID
async function updateCategory(req,res,next){
    try{
        const { name, icon, color, type } = req.body;

        const category = await categoryService.updateCategory(
            req.params.id,
            req.user.id,
            name,
            icon,
            color,
            type
        );
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });
    }catch(error){
        next(error);
    }
}

// Delete a category by ID
async function deleteCategory(req,res,next){
    try{
        const category = await categoryService.deleteCategory(req.params.id, req.user.id);
        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: category
        });
    }catch(error){
        next(error);
    }
}
module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};
