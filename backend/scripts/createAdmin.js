import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb+srv://shiv:spatel@cluster0.ni0rhzs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log("Admin already exists!");
            return;
        }

        // Create new admin
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const admin = new User({
            name: "AgroSync Admin",
            email: "admin@agrosync.com",
            password: hashedPassword,
            role: "admin",
            location: {
                country: "India",
                state: "Gujarat",
                district: "Ahmedabad",
                city: "Ahmedabad"
            }
        });

        await admin.save();

        console.log("Admin created successfully:");
        console.log({
            name: admin.name,
            email: admin.email,
            role: admin.role
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