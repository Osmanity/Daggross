import React, { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { assets, categories } from '../../assets/assets';
import Loading from '../../components/Loading'

const ProductList = () => {
    const {products, currency, axios, fetchProducts} = useAppContext()
    const [showEditModal, setShowEditModal] = useState(false)
    const [currentProduct, setCurrentProduct] = useState(null)
    const [files, setFiles] = useState([]);
    const [editableProducts, setEditableProducts] = useState({});
    const [modifiedProducts, setModifiedProducts] = useState(new Set());
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        offerPrice: '',
        quantity: ''
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            await fetchProducts();
            setLoading(false);
        };
        loadProducts();
    }, []);

    if (loading) {
        return <Loading fullScreen={true} />
    }

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
    
    const handleInlineEdit = (productId, field, value) => {
        setEditableProducts(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                [field]: value
            }
        }));
        setModifiedProducts(prev => new Set(prev).add(productId));
    };

    const saveInlineChanges = async () => {
        try {
            for (const productId of modifiedProducts) {
                const changes = editableProducts[productId];
                if (!changes) continue;

                const originalProduct = products.find(p => p._id === productId);
                if (!originalProduct) continue;

                const formData = new FormData();
                
                const productData = {
                    id: productId,
                    name: changes.name || originalProduct.name,
                    description: originalProduct.description,
                    category: changes.category || originalProduct.category,
                    price: changes.price || originalProduct.price,
                    offerPrice: changes.offerPrice || originalProduct.offerPrice,
                    quantity: parseInt(changes.quantity || originalProduct.quantity),
                    inStock: parseInt(changes.quantity || originalProduct.quantity) > 0
                };

                formData.append('productData', JSON.stringify(productData));

                const { data } = await axios.post('/api/product/update', formData);
                if (!data.success) {
                    toast.error(`Failed to update product: ${data.message}`);
                    return;
                }
            }
            
            await fetchProducts();
            setModifiedProducts(new Set());
            setEditableProducts({});
            toast.success('Changes saved successfully');
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error(`Error saving changes: ${error.message}`);
        }
    };


    
    
    return (
        <div className="flex-1 h-[93vh] overflow-y-scroll flex flex-col justify-between  [&::-webkit-scrollbar-track]:bg-gray-200/40 [&::-webkit-scrollbar-thumb]:bg-green-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding">
            <div className="w-full p-2 md:p-6 lg:p-10">
                <div className="flex justify-between items-center pb-4">
                    <h2 className="text-lg font-medium">All Products</h2>
                    {modifiedProducts.size > 0 && (
                        <button
                            onClick={saveInlineChanges}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dull transition"
                        >
                            Save Changes
                        </button>
                    )}
                </div>
                
                {/* Responsive table container */}
                <div className="overflow-x-auto rounded-md bg-white border border-gray-500/20 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar]:mt-2 [&::-webkit-scrollbar-track]:bg-gray-200/40 [&::-webkit-scrollbar-thumb]:bg-green-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-green-700 [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding">
                    <div className="min-w-[900px]"> {/* Minimum width för att undvika för mycket komprimering */}
                        <table className="w-full">
                            <thead className="text-gray-900 text-sm text-left bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 font-semibold w-[30%] lg:w-[25%]">Product</th>
                                    <th className="px-4 py-3 font-semibold text-center w-[15%]">Category</th>
                                    <th className="px-4 py-3 font-semibold text-center w-[15%]">Selling Price</th>
                                    <th className="px-4 py-3 font-semibold text-center w-[10%]">Quantity</th>
                                    <th className="px-4 py-3 font-semibold text-center w-[15%]">In Stock</th>
                                    <th className="px-4 py-3 font-semibold text-center w-[15%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-500">
                            {products.map((product) => (
                                <tr 
                                    key={product._id} 
                                    className={`border-t border-gray-500/20 hover:bg-gray-50/50 
                                    ${modifiedProducts.has(product._id) ? 'bg-yellow-50 hover:bg-yellow-100/70' : ''}`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="border border-gray-300 rounded p-2 min-w-[64px]">
                                                <img 
                                                    src={product.image[0]} 
                                                    alt="Product" 
                                                    className="w-16 h-16 object-cover"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={editableProducts[product._id]?.name ?? product.name}
                                                onChange={(e) => handleInlineEdit(product._id, 'name', e.target.value)}
                                                className="outline-none px-2 py-1.5 rounded-md border border-transparent 
                                                        hover:border-gray-300 focus:border-primary flex-1 bg-transparent 
                                                transition-all duration-200 ease-in-out hover:bg-gray-50 focus:bg-white 
                                                        focus:shadow-sm min-w-[150px]"
                                            />
                                        </div>
                                    </td>
                                        
                                    <td className="px-4 py-3 text-center">
                                        <select
                                            value={editableProducts[product._id]?.category ?? product.category}
                                            onChange={(e) => handleInlineEdit(product._id, 'category', e.target.value)}
                                                className="outline-none px-2 py-1.5 rounded-md border border-transparent 
                                                hover:border-gray-300 focus:border-primary bg-transparent w-full
                                                transition-all duration-200 ease-in-out hover:bg-gray-50 focus:bg-white 
                                                focus:shadow-sm cursor-pointer appearance-none pr-8 relative text-center"
                                                style={{
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 0.5rem center',
                                                    backgroundSize: '1.5em 1.5em'
                                                }}
                                            >
                                                {categories.map((item, index) => (
                                                    <option key={index} value={item.path}>{item.path}</option>
                                                ))}
                                            </select>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="text"
                                                value={(editableProducts[product._id]?.offerPrice ?? product.offerPrice) + 'kr'}
                                                onChange={(e) => {
                                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                                    handleInlineEdit(product._id, 'offerPrice', numericValue);
                                                }}
                                                className="outline-none px-2 py-1.5 rounded-md border border-transparent 
                                                hover:border-gray-300 focus:border-primary w-24 bg-transparent 
                                                transition-all duration-200 ease-in-out hover:bg-gray-50 focus:bg-white 
                                                focus:shadow-sm text-center"
                                            />
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                value={editableProducts[product._id]?.quantity ?? product.quantity}
                                                onChange={(e) => handleInlineEdit(product._id, 'quantity', e.target.value)}
                                                className="outline-none px-2 py-1.5 rounded-md border border-transparent 
                                                hover:border-gray-300 focus:border-primary w-20 bg-transparent 
                                                transition-all duration-200 ease-in-out hover:bg-gray-50 focus:bg-white 
                                                focus:shadow-sm text-center"
                                                min="0"
                                            />
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3 justify-center">
                                                <input 
                                                    onClick={()=> toggleStock(product._id, !product.inStock)} 
                                                    checked={product.inStock} 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
                                                <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                                            </label>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex space-x-2 justify-center">
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
            </div>
            
            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-gray-200/40 [&::-webkit-scrollbar-thumb]:bg-green-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-green-700 [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding">
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
