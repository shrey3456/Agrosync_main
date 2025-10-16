import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://22it111:Shrey123@cluster0.u6xmf1a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        
        // Delete existing admin to avoid conflicts
        await User.deleteMany({ role: 'admin' });
        console.log("Deleted existing admin users");

        // Create new admin - DON'T hash password here, let the model do it
        const admin = new User({
            name: "AgroSync Admin",
            email: "admin@gmail.com", // Changed to match your login attempts
            password: 'Admin@123', // Raw password - model will hash it
            role: "admin",
            location: {
                country: "India",
                state: "Gujarat",
                district: "Ahmedabad",
                city: "Ahmedabad"
            }
        });

        await admin.save(); // This will trigger the pre('save') hook to hash the password

        console.log("Admin created successfully:");
        console.log({
            name: admin.name,
            email: admin.email,
            role: admin.role,
            password: 'Admin@123' // For reference
        });

    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

// Run the script
createAdmin();