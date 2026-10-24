const express = require('express');

const authRouter =  express.Router();
const {register, login,logout, adminRegister,deleteProfile,getLeaderboard} = require('../controllers/userAuthent')
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');

// Register
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
authRouter.get('/leaderboard', userMiddleware, getLeaderboard);
authRouter.get('/check',userMiddleware,(req,res)=>{
    const user = req.result;
    const isRecent = user.createdAt && (Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000);
    const hasNoSolvedProblems = !user.problemSolved || user.problemSolved.length === 0;
    const isNewUser = (!user.loginCount || user.loginCount <= 1) && isRecent && hasNoSolvedProblems;

    const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role,
        createdAt: user.createdAt,
        isNewUser: Boolean(isNewUser)
    }

    res.status(200).json({
        user: reply,
        message: "Valid User"
    });
})
// authRouter.get('/getProfile',getProfile);


module.exports = authRouter;

// login
// logout
// GetProfile
