import { v2 as cloudinary } from "cloudinary"
import Product from "../models/Product.js"

// Add Product : /api/product/add
export const addProduct = async (req, res)=>{
    try {
        let productData = JSON.parse(req.body.productData);
        const images = req.files;
        
        // Upload images to Cloudinary
        let imagesUrl = await Promise.all(
            images.map(async (item)=>{
                const result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'})
                return result.secure_url
            })
        )
        
        // Ensure quantity is a number and set inStock accordingly
        const quantity = parseInt(productData.quantity, 10) || 0;
        const inStock = quantity > 0;
        
        // Create new product
        await Product.create({
            name: productData.name,
            description: productData.description,
            category: productData.category,
            price: productData.price,
            offerPrice: productData.offerPrice,
            image: imagesUrl,
            quantity: quantity,
            inStock: inStock
        })
        
        res.json({success: true, message: "Product Added Successfully"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Get Product : /api/product/list
export const productList = async (req, res)=>{
    try {
        const products = await Product.find({})
        res.json({success: true, products})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get single Product : /api/product/id
export const productById = async (req, res)=>{
    try {
        const { id } = req.body
        const product = await Product.findById(id)
        res.json({success: true, product})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Change Product inStock : /api/product/stock
export const changeStock = async (req, res)=>{
    try {
        const { id, inStock, quantity } = req.body;
        // Om quantity är 0 och inStock är true, ändra quantity till 10 (default)
        if (inStock && quantity === 0) {
            await Product.findByIdAndUpdate(id, { inStock, quantity: 10 });
        } else if (!inStock) {
            // Om produkten markeras som utgången, sätt quantity till 0
            await Product.findByIdAndUpdate(id, { inStock, quantity: 0 });
        } else {
            // Annars uppdatera både inStock och quantity
            await Product.findByIdAndUpdate(id, { inStock, quantity });
        }
        res.json({ success: true, message: "Stock Updated" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Delete Product : /api/product/delete
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.body;
    
    // Find the product first to ensure it exists
    const product = await Product.findById(id);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }
    
    // Delete the product from database
    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}

// Update Product : /api/product/update
export const updateProduct = async (req, res) => {
  try {
    let productData = JSON.parse(req.body.productData);
    const { id } = productData;
    
    // Verify product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.json({ success: false, message: "Product not found" });
    }
    
    let updateData = {
      name: productData.name,
      description: productData.description,
      category: productData.category,
      price: productData.price,
      offerPrice: productData.offerPrice,
      quantity: productData.quantity || 0,
      inStock: productData.inStock !== undefined ? productData.inStock : (productData.quantity > 0)
    };
    
    // Handle new images only if provided
    if (req.files && req.files.length > 0) {
      const images = req.files;
      
      // Upload new images
      let imagesUrl = await Promise.all(
        images.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, {resource_type: 'image'});
          return result.secure_url;
        })
      );
      
      updateData.image = imagesUrl;
    }
    
    await Product.findByIdAndUpdate(id, updateData);
    res.json({ success: true, message: "Product Updated Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}
