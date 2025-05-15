import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe"
import User from "../models/User.js"

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res)=>{
    try {
        const { items, address, deliveryDate } = req.body;
        const userId = req.userId; // Get userId from auth middleware

        if(!address || items.length === 0 || !deliveryDate){
            return res.json({success: false, message: "Vänligen fyll i alla obligatoriska fält"})
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
        console.error(error);
        return res.json({
            success: false,
            message: "Ett fel uppstod när ordern skulle skapas"
        });
    }
}

// Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res)=>{
    try {
        const { items, address, deliveryDate } = req.body;
        const userId = req.userId; // Get userId from auth middleware
        const {origin} = req.headers;

        if(!address || items.length === 0 || !deliveryDate){
            return res.json({success: false, message: "Vänligen fyll i alla obligatoriska fält"})
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
            deliveryDate: new Date(deliveryDate),
            isPaid: false,
            status: 'Väntar på betalning'
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
            userId: userId.toString(),
        }
     })

        return res.json({success: true, url: session.url });
    } catch (error) {
        console.error(error);
        return res.json({
            success: false,
            message: "Ett fel uppstod när ordern skulle skapas"
        });
    }
}
// Stripe Webhooks to Verify Payments Action : /stripe
export const stripeWebhooks = async (request, response) => {
    try {
        console.log('Webhook received - starting processing');
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const sig = request.headers["stripe-signature"];
        
        if (!sig) {
            console.log('No Stripe signature found');
            return response.status(400).send('No signature found');
        }

        let event;
        try {
            event = stripeInstance.webhooks.constructEvent(
                request.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            console.log('Event type:', event.type);
        } catch (error) {
            console.log('Webhook verification failed:', error.message);
            return response.status(400).send(`Webhook Error: ${error.message}`);
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            console.log('Payment status:', session.payment_status);
            console.log('Order metadata:', session.metadata);

            const { orderId, userId } = session.metadata;
            
            try {
                const updatedOrder = await Order.findByIdAndUpdate(
                    orderId,
                    {
                        isPaid: true,
                        status: 'Betalning mottagen'
                    },
                    { new: true }
                );

                if (!updatedOrder) {
                    console.log('Order not found:', orderId);
                    return response.status(404).json({ error: 'Order not found' });
                }

                console.log('Order updated successfully:', {
                    orderId: updatedOrder._id,
                    isPaid: updatedOrder.isPaid,
                    status: updatedOrder.status
                });

                await User.findByIdAndUpdate(
                    userId,
                    { cartItems: {} }
                );
            } catch (error) {
                console.log('Error updating order:', error.message);
                return response.status(500).json({ error: 'Failed to update order' });
            }
        }

        return response.status(200).json({ received: true });
    } catch (error) {
        console.log('Webhook processing failed:', error.message);
        return response.status(500).json({ error: 'Webhook processing failed' });
    }
};


// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({
            userId,
            $or: [
                { paymentType: "COD" },
                { paymentType: "Online" } // Ta med alla online-ordrar, oavsett betalningsstatus
            ]
        })
        .populate("items.product address")
        .sort({createdAt: -1});
        
        
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.json({ success: false, message: error.message });
    }
}


// Get All Orders (for seller / admin) : /api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [
                { paymentType: "COD" },
                { paymentType: "Online" } // Inkludera alla online-ordrar, oavsett betalningsstatus
            ]
        })
        .populate("items.product address")
        .sort({createdAt: -1});

        console.log('Fetched all orders for seller:', orders.length); // Loggning för felsökning
        
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.json({ success: false, message: error.message });
    }
}