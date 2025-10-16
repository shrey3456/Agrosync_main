import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: function () {
            return this.password !== null;
        }
    },
    role: {
        type: String,
        enum: ['admin', 'farmer', 'consumer'],
        default: 'consumer'
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please fill a valid phone number']
    },
    pincode: {
        type: String,
        trim: true,
        match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'],
    },
    location: {
        country: {
            type: String,
            default: "India"
        },
        state: {
            type: String
        },
        district: {
            type: String
        },
        city: {
            type: String
        }
    },
    bio: {
        type: String,
        maxlength: 500
    },
    profileImage: {
        type: String,
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
UserSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id, email: this.email, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function () {
    const refreshToken = jwt.sign(
        { id: this._id },
        process.env.REFRESH_SECRET,
        { expiresIn: '30d' }
    );

    this.refreshToken = refreshToken;
    return refreshToken;
};

const User = mongoose.model('User', UserSchema);

export default User;