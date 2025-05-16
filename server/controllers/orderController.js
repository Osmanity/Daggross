import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe"
import User from "../models/User.js"
import { sendOrderConfirmation } from "../services/emailService.js";
import Address from "../models/Address.js";

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res)=>{
    try {
        const { items, address: addressId, deliveryDate } = req.body;
        const userId = req.userId; // Get userId from auth middleware

        if(!addressId || items.length === 0 || !deliveryDate){
            return res.json({success: false, message: "Vänligen fyll i alla obligatoriska fält"})
        }

        // Get user and address details
        const user = await User.findById(userId);
        const address = await Address.findById(addressId);

        if (!user || !address) {
            return res.json({
                success: false,
                message: "Användare eller adress hittades inte"
            });
        }

        // Calculate Amount Using Items
        let amount = 0;
        let productDetails = [];
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
            productDetails.push({
                product: item.product,
                quantity: item.quantity
            });
        }

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

        // Generate a tracking number (simple example - you might want to use a more sophisticated system)
        const trackingNumber = `COD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Set estimated delivery date (3 working days from delivery date)
        const estimatedDelivery = new Date(deliveryDate);
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

        const order = await Order.create({
            userId,
            items: productDetails,
            amount,
            address: addressId,
            paymentType: "COD",
            deliveryDate: new Date(deliveryDate),
            status: 'Under behandling',
            codDetails: {
                trackingNumber,
                estimatedDelivery,
                codAmount: amount,
                codStatus: 'Ej skickad'
            }
        });

        // Send order confirmation email
        await sendOrderConfirmation(
            { ...order.toObject(), items: productDetails },
            user,
            address
        );

        return res.json({
            success: true,
            message: "Beställning mottagen. En orderbekräftelse har skickats till din e-post."
        });
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
        const { items, address: addressId, deliveryDate } = req.body;
        const userId = req.userId;
        const {origin} = req.headers;

        if(!addressId || items.length === 0 || !deliveryDate){
            return res.json({success: false, message: "Vänligen fyll i alla obligatoriska fält"})
        }

        // Get user and address details
        const user = await User.findById(userId);
        const address = await Address.findById(addressId);

        if (!user || !address) {
            return res.json({
                success: false,
                message: "Användare eller adress hittades inte"
            });
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
                product: item.product,
                quantity: item.quantity,
                productDetails: product // Store product details temporarily for Stripe
            });
            amount += product.offerPrice * item.quantity;
        }

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

        const order = await Order.create({
            userId,
            items: productData.map(({ product, quantity }) => ({ product, quantity })), // Only save product ID and quantity
            amount,
            address: addressId,
            paymentType: "Online",
            deliveryDate: new Date(deliveryDate),
            isPaid: false,
            status: 'Väntar på betalning'
        });

        // Send order confirmation email
        await sendOrderConfirmation(
            { ...order.toObject(), items: productData },
            user,
            address
        );

        // Stripe Gateway Initialize    
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        // create line items for stripe
        const line_items = productData.map((item)=>{
            const unitPrice = Math.floor((item.productDetails.offerPrice + item.productDetails.offerPrice * 0.02) * 100);
            return {
                price_data: {
                    currency: "sek",
                    product_data:{
                        name: item.productDetails.name,
                    },
                    unit_amount: unitPrice
                },
                quantity: item.quantity,
            }
        });

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
        });

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
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        
        // Verify we have the required environment variables
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
            console.log('❌ Saknade miljövariabler:', {
                hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
                hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
            });
            return response.status(500).send('Missing configuration');
        }

        const sig = request.headers["stripe-signature"];
        if (!sig) {
            console.log('❌ Ingen Stripe-signatur hittades');
            return response.status(400).send('No signature found');
        }

        // Get the raw body as a buffer
        const rawBody = request.body;
        if (!rawBody || !Buffer.isBuffer(rawBody)) {
            console.log('❌ Ogiltig request body:', {
                bodyExists: !!rawBody,
                isBuffer: Buffer.isBuffer(rawBody),
                bodyType: typeof rawBody
            });
            return response.status(400).send('Invalid request body');
        }

        let event;
        try {
            // Convert the raw body to a string if it's a buffer
            const payload = rawBody.toString('utf8');
            event = stripeInstance.webhooks.constructEvent(
                payload,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            console.log('✅ Webhook verifierad:', event.type);
        } catch (error) {
            console.log('❌ Webhook verifieringsfel:', error.message);
            console.log('Debug info:', {
                signatureHeader: sig,
                bodyLength: rawBody.length,
                webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length
            });
            return response.status(400).send(`Webhook Error: ${error.message}`);
        }

        // Handle the event
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            console.log('💳 Betalning slutförd:', {
                betalningsStatus: session.payment_status,
                orderId: session.metadata?.orderId
            });
            
            if (session.payment_status === 'paid') {
                try {
                    const updatedOrder = await Order.findByIdAndUpdate(
                        session.metadata.orderId,
                        {
                            isPaid: true,
                            status: 'Betalning mottagen'
                        },
                        { new: true }
                    );

                    if (updatedOrder) {
                        console.log('✅ Order uppdaterad:', updatedOrder._id);
                    } else {
                        console.log('❌ Kunde inte hitta ordern:', session.metadata.orderId);
                    }
                } catch (error) {
                    console.log('❌ Databasfel:', error.message);
                    return response.status(500).json({ error: 'Database update failed' });
                }
            }
        }

        return response.status(200).json({ received: true });
    } catch (error) {
        console.log('❌ Oväntat fel:', error.message);
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

        // console.log('Fetched all orders for seller:', orders.length); // Loggning för felsökning
        
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.json({ success: false, message: error.message });
    }
}

// Update Order Status : /api/order/:orderId
export const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = [
            'Väntar på betalning',
            'Betalning mottagen',
            'Under behandling',
            'Skickad',
            'Levererad',
            'Avbruten'
        ];

        if (!validStatuses.includes(status)) {
            return res.json({
                success: false,
                message: "Ogiltig orderstatus"
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate("items.product address");

        if (!order) {
            return res.json({
                success: false,
                message: "Order hittades inte"
            });
        }

        res.json({
            success: true,
            message: "Order uppdaterad",
            order
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
}

// Delete Order : /api/order/:orderId
export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: "Order hittades inte"
            });
        }

        // Restore product quantities
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                const newQuantity = product.quantity + item.quantity;
                await Product.findByIdAndUpdate(item.product, {
                    quantity: newQuantity,
                    inStock: newQuantity > 0
                });
            }
        }

        await Order.findByIdAndDelete(orderId);

        res.json({
            success: true,
            message: "Order raderad"
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
}

// Update COD Status : /api/order/:orderId/cod-status
export const updateCODStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { codStatus } = req.body;

        const validCODStatuses = [
            'Ej skickad',
            'Skickad till ombud',
            'Hos ombud',
            'Redo för upphämtning',
            'Upphämtad',
            'Returnerad'
        ];

        if (!validCODStatuses.includes(codStatus)) {
            return res.json({
                success: false,
                message: "Ogiltig COD-status"
            });
        }

        const order = await Order.findById(orderId);
        if (!order || order.paymentType !== "COD") {
            return res.json({
                success: false,
                message: "Order hittades inte eller är inte en postförskottsorder"
            });
        }

        // Update order status based on COD status
        let orderStatus = order.status;
        if (codStatus === 'Upphämtad') {
            orderStatus = 'Levererad';
        } else if (codStatus === 'Returnerad') {
            orderStatus = 'Avbruten';
        } else if (codStatus === 'Redo för upphämtning') {
            orderStatus = 'Skickad';
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
                'codDetails.codStatus': codStatus,
                status: orderStatus,
                isPaid: codStatus === 'Upphämtad'
            },
            { new: true }
        ).populate("items.product address");

        res.json({
            success: true,
            message: "Postförskottsstatus uppdaterad",
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error updating COD status:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
}