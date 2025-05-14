import Address from "../models/Address.js"


// Add Address : /api/address/add
export const addAddress = async(req, res)=>{
    try {
        const { address } = req.body
        const userId = req.userId

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'street', 'city', 'state', 'zipcode', 'country', 'phone'];
        const missingFields = requiredFields.filter(field => !address[field]);
        
        if (missingFields.length > 0) {
            return res.json({
                success: false,
                message: `Följande fält saknas: ${missingFields.join(', ')}`
            });
        }

        // Create new address
        const newAddress = await Address.create({
            ...address,
            userId
        });

        res.json({
            success: true,
            message: "Adress sparad",
            address: newAddress
        });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get Address : /api/address/get
export const getAddress = async(req, res)=>{
    try {
        const userId = req.userId
        const addresses = await Address.find({userId}).sort({createdAt: -1})
        res.json({success: true, addresses})
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}
