import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    // Add DKIM and other security features
    secure: true,
    tls: {
        rejectUnauthorized: false
    }
});

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getOrderStatusInSwedish = (status) => {
    const statusMap = {
        'Väntar på betalning': 'Väntar på betalning',
        'Betalning mottagen': 'Betalning mottagen',
        'Under behandling': 'Under behandling',
        'Skickad': 'Skickad',
        'Levererad': 'Levererad',
        'Avbruten': 'Avbruten'
    };
    return statusMap[status] || status;
};

export const sendOrderConfirmation = async (order, user, address) => {
    try {
        // Get the base URL from environment variable
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const myOrdersUrl = `${baseUrl}/my-orders`;

        // Validate required data
        if (!order || !order.items || !Array.isArray(order.items)) {
            console.error('Invalid order data:', order);
            return false;
        }

        // First populate the products if they're not already populated
        let populatedItems = [];
        for (const item of order.items) {
            if (!item.product || typeof item.product === 'string') {
                // If product is just an ID, we need to populate it
                const Product = mongoose.model('product');
                const productData = await Product.findById(item.product);
                if (!productData) {
                    console.error('Product not found:', item.product);
                    continue;
                }
                populatedItems.push({
                    product: productData,
                    quantity: item.quantity
                });
            } else {
                // Product is already populated
                populatedItems.push(item);
            }
        }

        // Generate items list with validation
        const itemsList = populatedItems.map(item => {
            const productName = item.product?.name || 'Produkt saknas';
            const quantity = item.quantity || 0;
            const price = item.product?.offerPrice || 0;
            const totalPrice = price * quantity;
            const imageUrl = item.product?.image?.[0] || ''; // Get first image from product

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center;">
                            ${imageUrl ? `
                                <img src="${imageUrl}" 
                                     alt="${productName}" 
                                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; margin-right: 15px;"
                                />
                            ` : `
                                <div style="width: 60px; height: 60px; background-color: #f5f5f5; border-radius: 6px; margin-right: 15px;"></div>
                            `}
                            <div>
                                <div style="font-weight: 500;">${productName}</div>
                                <div style="color: #666; font-size: 14px;">
                                    ${item.product?.category || ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        ${quantity} st
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        ${totalPrice} kr
                    </td>
                </tr>
            `;
        }).join('');

        // Calculate total with validation
        const subtotal = populatedItems.reduce((sum, item) => {
            const price = item.product?.offerPrice || 0;
            const quantity = item.quantity || 0;
            return sum + (price * quantity);
        }, 0);

        const tax = Math.floor(subtotal * 0.02);
        const total = subtotal + tax;

        const emailContent = `
            <!DOCTYPE html>
            <html lang="sv">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Orderbekräftelse från Daggross</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2B8A3E; margin: 0;">Orderbekräftelse</h1>
                        <p style="color: #666; margin-top: 10px;">Tack för din beställning hos Daggross!</p>
                    </div>

                    <!-- Track Order Button -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${myOrdersUrl}" 
                           style="display: inline-block; 
                                  background-color: #2B8A3E; 
                                  color: white; 
                                  padding: 12px 24px; 
                                  text-decoration: none; 
                                  border-radius: 6px;
                                  font-weight: 500;">
                            Se orderstatus
                        </a>
                    </div>

                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #2B8A3E; margin-top: 0;">Orderinformation</h2>
                        <p><strong>Order ID:</strong> ${order._id || 'N/A'}</p>
                        <p><strong>Orderdatum:</strong> ${order.createdAt ? formatDate(order.createdAt) : 'N/A'}</p>
                        <p><strong>Status:</strong> ${getOrderStatusInSwedish(order.status || 'N/A')}</p>
                        ${order.paymentType === "COD" ? `
                            <p><strong>Betalningsmetod:</strong> Postförskott</p>
                            <p><strong>Spårningsnummer:</strong> ${order.codDetails?.trackingNumber || 'Tilldelas senare'}</p>
                        ` : `
                            <p><strong>Betalningsmetod:</strong> Online betalning</p>
                        `}
                    </div>

                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #2B8A3E; margin-top: 0;">Leveransadress</h2>
                        <p>${address?.firstName || ''} ${address?.lastName || ''}</p>
                        <p>${address?.street || ''}</p>
                        <p>${address?.zipcode || ''} ${address?.city || ''}</p>
                        <p>${address?.country || ''}</p>
                        <p>Tel: ${address?.phone || ''}</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h2 style="color: #2B8A3E;">Beställda produkter</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background-color: #2B8A3E; color: white;">
                                    <th style="padding: 12px; text-align: left; width: 60%;">Produkt</th>
                                    <th style="padding: 12px; text-align: left; width: 20%;">Antal</th>
                                    <th style="padding: 12px; text-align: left; width: 20%;">Pris</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsList}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 12px; text-align: right;"><strong>Moms (2%):</strong></td>
                                    <td style="padding: 12px;">${tax} kr</td>
                                </tr>
                                <tr style="background-color: #f5f5f5;">
                                    <td colspan="2" style="padding: 12px; text-align: right;"><strong>Totalt:</strong></td>
                                    <td style="padding: 12px;"><strong>${total} kr</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #2B8A3E; margin-top: 0;">Leveransinformation</h2>
                        <p><strong>Beräknad leverans:</strong> ${order.deliveryDate ? formatDate(order.deliveryDate) : 'N/A'}</p>
                        ${order.codDetails?.estimatedDelivery ? `
                            <p><strong>Beräknad leverans till ombud:</strong> ${formatDate(order.codDetails.estimatedDelivery)}</p>
                        ` : ''}
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #eee;">
                        <p style="color: #666;">Vid frågor om din order, kontakta vår kundtjänst</p>
                        <p style="color: #2B8A3E;">support@daggross.se</p>
                        <p style="margin: 20px 0;">
                            <a href="${myOrdersUrl}" 
                               style="color: #2B8A3E; 
                                      text-decoration: underline;">
                                Följ din order här
                            </a>
                        </p>
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">
                            Detta är en orderbekräftelse från Daggross. 
                            <br>Vänligen svara inte på detta mail då det är automatiskt genererat.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: {
                name: 'Daggross',
                address: process.env.EMAIL_USER
            },
            to: {
                name: `${address?.firstName || ''} ${address?.lastName || ''}`,
                address: address?.email || ''
            },
            subject: `Orderbekräftelse - Order #${order._id || 'N/A'}`,
            html: emailContent,
            headers: {
                'List-Unsubscribe': `<mailto:unsubscribe@daggross.se?subject=unsubscribe>`,
                'Precedence': 'bulk'
            }
        };

        // Validate email address before sending
        if (!mailOptions.to.address) {
            console.error('No valid email address found');
            return false;
        }

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return false;
    }
}; 