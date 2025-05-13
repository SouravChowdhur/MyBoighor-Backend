import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt"
import {v2 as cloudinary} from "cloudinary"

export const getAllUsers = catchAsyncErrors(async(req, res, next)=>{
      const users = await User.find({accountVerified: true});
      res.status(200).json({
        success: true,
        users
     })
})

export const registerNewAdmin = catchAsyncErrors(async(req, res, next)=>{
    if(!req.files || Object.keys(req.files).length === 0){
        return next(new ErrorHandler("Admin avatar is required", 400));
    }
    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return next(new ErrorHandler("please fill all fields", 400));
    }
    const isRegistered = await User.findOne({email, accountVerified: true});
    if(isRegistered){
        return next(new ErrorHandler("user already registered", 400));
    }
    if(password.length < 8 || password.length > 16){
        return next(new ErrorHandler("Password should be between 8 to 16 characters", 400));
    }
    const {avatar} = req.files;
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    if(!allowedFormats.includes(avatar.mimetype)){
        return next(new ErrorHandler("file format not supported", 400));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const cloudinaryResponse = await cloudinary.uploader.upload(
        avatar.tempFilePath, {
            folder: "BOIGHOR_ADMIN_AVATARS"
        }
    );
    if(!cloudinaryResponse || cloudinaryResponse.error){
        console.error("cloudinary error:", cloudinary.error || "unknown cloudinary error");
        return next(new ErrorHandler("failed to upload avatar image to cloudinary", 500));
    }
    const admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "Admin",
        accountVerified: true,
        avatar: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        }
    })
    res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        admin
    })
})