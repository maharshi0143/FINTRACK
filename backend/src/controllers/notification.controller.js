const notificationService = require("../services/notification.service");

// Create a notification
async function createNotification(req,res,next){
    try{
        const { title, message } = req.body;
        if(!title || !message){
            return res.status(400).json({
                success: false,
                message: "Title and message are required"
            });
        }

        const notification = await notificationService.createNotification(req.user.id, title, message);
        res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: notification
        });
    }catch(error){
        next(error);
    }
}

// Get notifications
async function getNotifications(req,res,next){
    try{
        const notifications = await notificationService.getNotifications(req.user.id);
        res.status(200).json({
            success: true,
            data: notifications
        });
    }catch(error){
        next(error);
    }
}

// Mark as Read notifications
async function markAsRead(req,res,next){
    try{
        const notification = await notificationService.markAsRead(req.params.id, req.user.id);
        if(!notification){
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });
    }catch(error){
        next(error);
    }
}

// Delete a notification by ID
async function deleteNotification(req,res,next){
    try{
        const notification = await notificationService.deleteNotification(req.params.id, req.user.id);
        if(!notification){
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    }catch(error){
        next(error);
    }
}

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    deleteNotification
};
