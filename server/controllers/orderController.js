import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe"
import User from "../models/User.js"

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res)=>{
    try {
        const { items, address, deliveryDate } = req.body;
        const userId = req.userId;
        if(!address || items.length === 0 || !deliveryDate){
            return res.json({success: false, message: "Invalid data"})
        }
        
        // Calculate Amount Using Items
        let amount = 0;
        for(const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.json({ success: false, message: `Produkt med ID ${item.product} hittades inte` });
            }
            
            if (product.quantity < item.quantity) {
                return res.json({ 
                    success: false, 
                    message: `Endast ${product.quantity} st av ${product.name} finns i lager` 
                });
            }
            
            // Minska lagersaldo och uppdatera inStock status
            const newQuantity = product.quantity - item.quantity;
            await Product.findByIdAndUpdate(item.product, {
                quantity: newQuantity,
                inStock: newQuantity > 0
            });
            amount += product.offerPrice * item.quantity;
        }

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
            deliveryDate: new Date(deliveryDate)
        });

        return res.json({success: true, message: "Order Placed Successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res)=>{
    try {
        const { items, address, deliveryDate } = req.body;
        const userId = req.userId;
        const {origin} = req.headers;

        if(!address || items.length === 0 || !deliveryDate){
            return res.json({success: false, message: "Invalid data"})
        }

        let productData = [];
        let amount = 0;

        // Calculate Amount Using Items
        for(const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.json({ success: false, message: `Produkt med ID ${item.product} hittades inte` });
            }
            
            if (product.quantity < item.quantity) {
                return res.json({ 
                    success: false, 
                    message: `Endast ${product.quantity} st av ${product.name} finns i lager` 
                });
            }
            
            // Minska lagersaldo och uppdatera inStock status
            const newQuantity = product.quantity - item.quantity;
            await Product.findByIdAndUpdate(item.product, {
                quantity: newQuantity,
                inStock: newQuantity > 0
            });
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });
            amount += product.offerPrice * item.quantity;
        }

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

       const order =  await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
            deliveryDate: new Date(deliveryDate)
        });

    // Stripe Gateway Initialize    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // create line items for stripe
     const line_items = productData.map((item)=>{
        return {
            price_data: {
                currency: "sek",
                product_data:{
                    name: item.name,
                },
                unit_amount: Math.floor((item.price + item.price * 0.02) * 100)
            },
            quantity: item.quantity,
        }
     })

     // create session
     const session = await stripeInstance.checkout.sessions.create({
        line_items,
        mode: "payment",
        success_url: `${origin}/loader?next=my-orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
            orderId: order._id.toString(),
            userId,
        }
     })

        return res.json({success: true, url: session.url });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}
// Stripe Webhooks to Verify Payments Action : /stripe
export const stripeWebhooks = async (request, response)=>{
    // Stripe Gateway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const sig = request.headers["stripe-signature"];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        response.status(400).send(`Webhook Error: ${error.message}`)
    }

    // Handle the event
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const { orderId, userId } = session.metadata;
            
            // Mark Payment as Paid
            await Order.findByIdAndUpdate(orderId, {isPaid: true});
            // Clear user cart
            await User.findByIdAndUpdate(userId, {cartItems: {}});
            break;
        }
        case "checkout.session.expired": {
            const session = event.data.object;
            const { orderId } = session.metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }
    response.json({received: true});
}


// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res)=>{
    try {
        const userId = req.userId;
        const orders = await Order.find({
            userId,
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// Get All Orders ( for seller / admin) : /api/order/seller
export const getAllOrders = async (req, res)=>{
    try {
        const orders = await Order.find({
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}