import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authUser = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.json({ 
                success: false, 
                message: 'Du måste vara inloggad för att utföra denna åtgärd' 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.json({ 
                    success: false, 
                    message: 'Användaren hittades inte' 
                });
            }

            req.userId = user._id;
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.json({ 
                    success: false, 
                    message: 'Din session har gått ut, vänligen logga in igen' 
                });
            }
            throw error;
        }
    } catch (error) {
        console.error(error.message);
        res.json({ 
            success: false, 
            message: 'Ett fel uppstod vid autentisering' 
        });
    }
};

export default authUser;