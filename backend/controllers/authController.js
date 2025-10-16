import User from '../models/user.js';
import bcrypt from 'bcrypt';

// Controller for Google Sign-In
// export const googleSignIn = async (req, res) => {
//   const { idToken, role = 'consumer', agreed = true } = req.body;

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     const { uid, email } = decodedToken;

//     console.log(`Processing Google Sign-In for ${email}`);

//     // Check if user exists in the database
//     let user = await User.findOne({ email });
//     let isExistingUser = false;

//     if (user) {
//       console.log(`User ${email} already exists in database with role: ${user.role}`);
//       isExistingUser = true;
//       // Do not modify the user's role if they already exist, keep their current role
//     } else {
//       // If user doesn't exist, create a new user with the selected role
//       console.log(`Creating new user with email ${email} and role ${role}`);
//       const isFirstUser = await User.countDocuments() === 0;

//       user = await User.create({
//         uid,
//         email,
//         role: role || 'consumer',
//         agreed: agreed || true,
//         admin: isFirstUser
//       });
//     }

//     // Return a consistent response structure with clear information for the frontend
//     return res.status(isExistingUser ? 200 : 201).json({
//       message: isExistingUser ? "User already authenticated" : "User registered successfully",
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         role: user.role,
//         admin: !!user.admin,
//         phoneNumber: user.phoneNumber,
//         pincode: user.pincode,
//         location: user.location,
//         address: user.address,
//         bio: user.bio,
//         profileImage: user.profileImage,
//         createdAt: user.createdAt,
//         updatedAt: user.updatedAt
//       },
//       token: idToken,
//       isExistingUser // Flag that the frontend can check
//     });
//   } catch (error) {
//     console.error('Google Sign-In error:', error);
//     res.status(500).json({ message: error.message || "Authentication failed" });
//   }
// };

// Controller for Registration
export const registerUser = async (req, res) => {
  const { email, password, role, agreed } = req.body;

  try {
    // Check if user exists in the database
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const isFirstUser = await User.countDocuments() === 0;

    user = await User.create({
      email,
      password,
      role,
      agreed,
      admin: isFirstUser
    });

    res.status(201).json({
      message: 'User registered successfully', user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller for Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        pincode: user.pincode,
        location: user.location,
        address: user.address,
        bio: user.bio,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token,
      refreshToken
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};