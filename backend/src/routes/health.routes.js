const express = require("express");

const router = express.Router();

router.get("/",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"FINTRACK API is working fine",
        timestamp: new Date().toISOString()
    });
});

module.exports = router;