import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({children})=>{
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState({});

    // Fetch User Auth Status, User Data and Cart Items
    const fetchUser = async () => {
        try {
            const {data} = await axios.get('/api/user/is-auth');
            if (data.success) {
                setUser(data.user);
                setCartItems(data.user.cartItems || {});
            } else {
                setUser(null);
                setCartItems({});
            }
        } catch (error) {
            setUser(null);
            setCartItems({});
        }
    };

    // Logout User
    const logoutUser = async () => {
        try {
            const {data} = await axios.get('/api/user/logout');
            if (data.success) {
                setUser(null);
                setCartItems({});
                setIsSeller(false);
                toast.success("Utloggad");
                navigate('/');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Fetch Seller Status
    const fetchSeller = async () => {
        try {
            const {data} = await axios.get('/api/seller/is-auth');
            setIsSeller(data.success);
        } catch (error) {
            setIsSeller(false);
        }
    };

    // Fetch All Products
    const fetchProducts = async () => {
        try {
            const {data} = await axios.get('/api/product/list');
            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Add Product to Cart
    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems);
        const product = products.find(p => p._id === itemId);
        
        if (!product) return;
        
        if (product.quantity <= 0) {
            toast.error("Denna produkt är slut i lager");
            return;
        }
        
        if (cartData[itemId]) {
            if (cartData[itemId] >= product.quantity) {
                toast.error(`Det finns endast ${product.quantity} st av denna produkt i lager`);
                return;
            }
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }
        
        setCartItems(cartData);
        toast.success("Tillagd i kundvagn");
    };

    // Update Cart Item Quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        const product = products.find(p => p._id === itemId);
        
        if (!product) return;
        
        if (quantity > product.quantity) {
            toast.error(`Det finns endast ${product.quantity} st av denna produkt i lager`);
            return;
        }
        
        cartData[itemId] = quantity;
        setCartItems(cartData);
        toast.success("Kundvagn uppdaterad");
    };

    // Remove Product from Cart
    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] -= 1;
            if (cartData[itemId] === 0) {
                delete cartData[itemId];
            }
        }
        toast.success("Borttagen från kundvagn");
        setCartItems(cartData);
    };

    // Get Cart Item Count
    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount;
    };

    // Get Cart Total Amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo && cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    };

    // Initial fetch of user data and products
    useEffect(() => {
        fetchUser();
        fetchSeller();
        fetchProducts();
    }, []);

    // Update Database Cart Items when cart changes
    useEffect(() => {
        const updateCart = async () => {
            if (!user) return;
            
            try {
                const {data} = await axios.post('/api/cart/update', {cartItems});
                if (!data.success) {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
        };

        updateCart();
    }, [cartItems, user]);

    const value = {
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        showUserLogin,
        setShowUserLogin,
        products,
        currency,
        addToCart,
        updateCartItem,
        removeFromCart,
        cartItems,
        setCartItems,
        searchQuery,
        setSearchQuery,
        getCartAmount,
        getCartCount,
        axios,
        fetchProducts,
        logoutUser,
        fetchUser
    };

    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>;
};

export const useAppContext = () => {
    return useContext(AppContext);
};
