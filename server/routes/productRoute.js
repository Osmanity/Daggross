import express from 'express';
import { upload } from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';
import { addProduct, changeStock, deleteProduct, productById, productList, updateProduct } from '../controllers/productController.js';

const productRouter = express.Router();

// Debug route - to verify the router is working
productRouter.get('/test', (req, res) => res.json({ message: 'Product router is working' }));

// Get all products
productRouter.get('/list', productList);

// Get product by id
productRouter.get('/id/:id', productById);

// Add product
productRouter.post('/add', upload.array("images"), authSeller, addProduct);

// Update stock status
productRouter.post('/stock', authSeller, changeStock);

// Delete product
productRouter.post('/delete', authSeller, deleteProduct);

// Update product
productRouter.post('/update', upload.array("images"), authSeller, updateProduct);

export default productRouter;