import { User } from "../models/User.js";
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken";
import sendMail from "../middlewares/sendMail.js";
import TryCatch from "../middlewares/TryCatch.js";

// Register a new user
export const register = TryCatch(async(req, res) => {
    const { email, name, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
        return res.status(400).json({
            message: "User Already Exists",
        });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create a temporary user object
    user = {
        name,
        email,
        password: hashPassword
    };

    // Generate OTP
    const otp = Math.floor(Math.random() * 1000);

    // Create activation token with OTP
    const activationToken = jwt.sign({
        user,
        otp,
    }, process.env.Activation_Secret, {
        expiresIn: "5m", // Token expires in 5 minutes
    });

    // Prepare email data
    const data = {
        name,
        otp,
    };

    // Send OTP via email
    await sendMail(
        email,
        "E learning",
        data 
    );

    // Respond with success message and activation token
    res.status(200).json({
        message: "OTP sent to your email",
        activationToken,
    });
});

// Verify user with OTP
export const verifyUser = TryCatch(async(req, res) => {
    const { otp, activationToken } = req.body;

    try {
        // Verify the activation token
        const verify = jwt.verify(activationToken, process.env.Activation_Secret);

        // Check if OTP matches
        if (verify.otp !== otp) {
            return res.status(400).json({
                message: "Wrong OTP",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: verify.user.email });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists",
            });
        }

        // Create the user in the database
        await User.create({
            name: verify.user.name,
            email: verify.user.email,
            password: verify.user.password,
        });

        // Respond with success message
        res.json({
            message: "User Registered"
        });

    } catch (error) {
        // Handle JWT expiration error
        if (error.name === "TokenExpiredError") {
            return res.status(400).json({
                message: "Activation token has expired. Please request a new OTP.",
            });
        }

        // Handle other JWT errors (e.g., invalid token)
        return res.status(400).json({
            message: "Invalid activation token.",
        });
    }
});

// Resend OTP
export const resendOtp = TryCatch(async(req, res) => {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({
            message: "User not found",
        });
    }

    // Generate a new OTP
    const otp = Math.floor(Math.random() * 1000);

    // Create a new activation token
    const activationToken = jwt.sign({
        user: {
            name: user.name,
            email: user.email,
            password: user.password,
        },
        otp,
    }, process.env.Activation_Secret, {
        expiresIn: "5m", // Token expires in 5 minutes
    });

    // Prepare email data
    const data = {
        name: user.name,
        otp,
    };

    // Send new OTP via email
    await sendMail(
        email,
        "E learning",
        data 
    );

    // Respond with success message and new activation token
    res.status(200).json({
        message: "New OTP sent to your email",
        activationToken,
    });
});