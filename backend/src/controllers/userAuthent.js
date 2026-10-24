const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")


const register = async (req,res)=>{
    
    try{
        // validate the data;

      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user';
      req.body.loginCount = 1;
    
      const user =  await User.create(req.body);
      const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
      const reply = {
         firstName: user.firstName,
         emailId: user.emailId,
         _id: user._id,
         role: user.role,
         createdAt: user.createdAt,
         isNewUser: true
     }
    
    //  res.cookie('token',token,{maxAge: 60*60*1000});
    //  res.status(201).json({
    //     user:reply,
    //     message:"Loggin Successfully"
    // })

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 60 * 60 * 1000
    });
    res.status(201).json({
        user: reply,
        token,
        message: "Logged In Successfully"
    });
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


const login = async (req,res)=>{

    try{
        const {emailId, password} = req.body;

        if(!emailId || !password){
            return res.status(401).json({ message: "Wrong username or password" });
        }

        const identifier = (emailId || '').trim();
        const user = await User.findOne({
            $or: [
                { emailId: identifier.toLowerCase() },
                { firstName: identifier }
            ]
        });

        if(!user){
            return res.status(401).json({ message: "Wrong username or password" });
        }

        const match = await bcrypt.compare(password, user.password);

        if(!match){
            return res.status(401).json({ message: "Wrong username or password" });
        }

        const isFirstLogin = !user.loginCount || user.loginCount === 0;
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        const isRecentAccount = user.createdAt && (Date.now() - new Date(user.createdAt).getTime() < 24 * 60 * 60 * 1000);
        const hasNoSolvedProblems = !user.problemSolved || user.problemSolved.length === 0;
        const isNewUser = isFirstLogin && isRecentAccount && hasNoSolvedProblems;

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
            createdAt: user.createdAt,
            isNewUser: Boolean(isNewUser)
        }

        const token = jwt.sign({_id:user._id, emailId:user.emailId, role:user.role}, process.env.JWT_KEY, {expiresIn: 60*60});
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 60 * 60 * 1000
        });
        res.status(200).json({
            user: reply,
            token,
            message: "Login Successful"
        });
    }
    catch(err){
        res.status(401).json({ message: "Wrong username or password" });
    }
}


// logOut feature

const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    // res.cookie("token",null,{expires: new Date(Date.now())});
    res.cookie('token', null, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(Date.now())
});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.aggregate([
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    solvedCount: { $size: { $ifNull: ["$problemSolved", []] } }
                }
            },
            { $sort: { solvedCount: -1 } },
            { $limit: 50 }
        ]);
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).send("Error fetching leaderboard: " + err.message);
    }
};


module.exports = {register, login,logout,adminRegister,deleteProfile,getLeaderboard};