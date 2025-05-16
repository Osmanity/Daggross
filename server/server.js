import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import { stripeWebhooks } from './controllers/orderController.js';

const app = express();
const port = process.env.PORT || 4000;

await connectDB()
await connectCloudinary()

// Allow multiple origins
const allowedOrigins = ['http://localhost:5173', 'http://localhost:4000', "https://daggross.vercel.app", "https://daggross-a6cx.vercel.app/api/product/list"]

// Configure CORS
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// IMPORTANT: Stripe webhook endpoint must be registered BEFORE body parsers
const webhookMiddleware = express.raw({ type: 'application/json' });
app.post('/webhook', webhookMiddleware, (req, res, next) => {
    if (req.headers['stripe-signature']) {
        console.log('✅ Stripe webhook mottagen');
    }
    next();
}, stripeWebhooks);

// Regular middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);

app.listen(port, () => {
    console.log('\n=== Server Configuration ===');
    console.log('Stripe Webhook URL:');
    console.log(`http://localhost:${port}/webhook`);
    console.log('==========================\n');
});