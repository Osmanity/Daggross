import React, { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { assets, categories } from '../../assets/assets';

const ProductList = () => {
    const {products, currency, axios, fetchProducts} = useAppContext()
    const [showEditModal, setShowEditModal] = useState(false)
    const [currentProduct, setCurrentProduct] = useState(null)
    const [files, setFiles] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        offerPrice: '',
        quantity: ''
    })

    const toggleStock = async (id, inStock)=>{
        try {
            const { data } = await axios.post('/api/product/stock', {id, inStock});
            if (data.success){
                fetchProducts();
                toast.success(data.message)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            console.log('Deleting product:', id);
            const { data } = await axios.post('/api/product/delete', { id });
            
            if (data.success) {
                fetchProducts();
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(`Error: ${error.message}`);
        }
    }
    
    const openEditModal = (product) => {
        setCurrentProduct(product);
        setFormData({
            name: product.name,
            description: product.description.join('\n'),
            category: product.category,
            price: product.price,
            offerPrice: product.offerPrice,
            quantity: product.quantity || 0,
        });
        setShowEditModal(true);
    }
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }
    
    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    }
    
    const updateProduct = async (e) => {
        e.preventDefault();
        
        try {
            console.log('Updating product:', currentProduct._id);
            const productData = {
                id: currentProduct._id,
                name: formData.name,
                description: formData.description.split('\n'),
                category: formData.category,
                price: formData.price,
                offerPrice: formData.offerPrice,
                quantity: parseInt(formData.quantity, 10) || 0,
                inStock: parseInt(formData.quantity, 10) > 0
            }
            
            const formDataObj = new FormData();
            formDataObj.append('productData', JSON.stringify(productData));
            
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    formDataObj.append('images', files[i]);
                }
            }
            
            const { data } = await axios.post('/api/product/update', formDataObj);
            
            if (data.success) {
                await fetchProducts();
                toast.success(data.message);
                setShowEditModal(false);
                setFiles([]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error details:', error);
            toast.error(`Error: ${error.message}`);
        }
    }
    
    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
            <div className="w-full md:p-10 p-4">
                <h2 className="pb-4 text-lg font-medium">All Products</h2>
                <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
                    <table className="md:table-auto table-fixed w-full overflow-hidden">
                        <thead className="text-gray-900 text-sm text-left">
                            <tr>
                                <th className="px-4 py-3 font-semibold truncate">Product</th>
                                <th className="px-4 py-3 font-semibold truncate text-center">Category</th>
                                <th className="px-4 py-3 font-semibold truncate hidden md:block">Selling Price</th>
                                <th className="px-4 py-3 font-semibold truncate text-center">Quantity</th>
                                <th className="px-4 py-3 font-semibold truncate text-center">In Stock</th>
                                <th className="px-4 py-3 font-semibold truncate text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-500">
                            {products.map((product) => (
                                <tr key={product._id} className="border-t border-gray-500/20">
                                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                                        <div className="border border-gray-300 rounded p-2">
                                            <img src={product.image[0]} alt="Product" className="w-16" />
                                        </div>
                                        <span className="truncate max-sm:hidden w-full">{product.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">{product.category}</td>
                                    <td className="px-4 py-3 max-sm:hidden">{product.offerPrice}{currency}</td>
                                    <td className="px-4 py-3 text-center">
                                        {product.quantity > 0 ? product.quantity : "Slut i lager"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                            <input onClick={()=> toggleStock(product._id, !product.inStock)} checked={product.inStock} type="checkbox" className="sr-only peer" />
                                            <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
                                            <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                                        </label>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="inline-flex space-x-2">
                                            <button 
                                                onClick={() => openEditModal(product)}
                                                className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => deleteProduct(product._id)}
                                                className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18"></path>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Edit Product</h3>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={updateProduct} className="space-y-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">Current Images</label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {currentProduct.image.map((img, index) => (
                                        <img key={index} src={img} alt={`Product image ${index}`} className="h-20 w-20 object-cover border rounded" />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Upload New Images</label>
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer file:cursor-pointer"
                                />
                                <p className="mt-1 text-xs text-gray-500">Upload new images to replace current ones</p>
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium">Product Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name} 
                                    onChange={handleChange}
                                    className="outline-none py-2.5 px-3 rounded border border-gray-500/40 w-full" 
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium">Product Description</label>
                                <textarea 
                                    name="description"
                                    value={formData.description} 
                                    onChange={handleChange}
                                    rows={4} 
                                    className="outline-none py-2.5 px-3 rounded border border-gray-500/40 resize-none w-full" 
                                    required
                                ></textarea>
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium">Category</label>
                                <select 
                                    name="category"
                                    value={formData.category} 
                                    onChange={handleChange}
                                    className="outline-none py-2.5 px-3 rounded border border-gray-500/40 w-full"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((item, index) => (
                                        <option key={index} value={item.path}>{item.path}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block mb-2 text-sm font-medium">Price</label>
                                    <input 
                                        type="number" 
                                        name="price"
                                        value={formData.price} 
                                        onChange={handleChange}
                                        className="outline-none py-2.5 px-3 rounded border border-gray-500/40 w-full" 
                                        required 
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block mb-2 text-sm font-medium">Offer Price</label>
                                    <input 
                                        type="number" 
                                        name="offerPrice"
                                        value={formData.offerPrice} 
                                        onChange={handleChange}
                                        className="outline-none py-2.5 px-3 rounded border border-gray-500/40 w-full" 
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="w-1/2">
                                <label className="block mb-2 text-sm font-medium">Lagerantal</label>
                                <input 
                                    type="number" 
                                    name="quantity"
                                    value={formData.quantity} 
                                    onChange={handleChange}
                                    min="0"
                                    className="outline-none py-2.5 px-3 rounded border border-gray-500/40 w-full" 
                                    required 
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dull transition cursor-pointer"
                                >
                                    Update Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductList
