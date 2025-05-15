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
const allowedOrigins = ['http://localhost:5173', 'http://localhost:4000', "https://daggross.vercel.app/"]

// Webhook endpoint måste komma FÖRE andra middleware
app.post('/stripe', 
    express.raw({type: 'application/json'}),
    (req, res, next) => {
        console.log('Webhook received');
        next();
    },
    stripeWebhooks
);

// Övriga middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'stripe-signature']
}));

app.get('/', (req, res) => res.send("API is Working"));
app.use('/api/user', userRouter)
app.use('/api/seller', sellerRouter)
app.use('/api/product', productRouter)
console.log('Product routes registered:');
console.log(productRouter.stack.map(r => r.route?.path).filter(Boolean));
app.use('/api/cart', cartRouter)
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)

// Add a basic test route at the root level
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.listen(port, ()=>{
    console.log(`Server is running on http://localhost:${port}`)
})