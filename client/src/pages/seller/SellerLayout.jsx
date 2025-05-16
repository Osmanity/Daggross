import { Link, NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { useEffect, useState, useRef } from "react";

const SellerLayout = () => {
    const { axios, navigate } = useAppContext();
    const [seller, setSeller] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const getSellerProfile = async () => {
            try {
                const { data } = await axios.get('/api/seller/profile');
                if (data.success) {
                    setSeller(data.seller);
                }
            } catch (error) {
                toast.error('Failed to load seller profile');
                if (error.response?.status === 401) {
                    navigate('/');
                }
            }
        };
        getSellerProfile();
    }, [axios, navigate]);

    const sidebarLinks = [
        { name: "Add Product", path: "/seller", icon: assets.add_icon },
        { name: "Product List", path: "/seller/product-list", icon: assets.product_list_icon },
        { name: "Orders", path: "/seller/orders", icon: assets.order_icon },
    ];

    const logout = async ()=>{
        try {
            const { data } = await axios.get('/api/seller/logout');
            if(data.success){
                toast.success(data.message)
                navigate('/')
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Get initials from seller name
    const getInitials = (name) => {
        if (!name) return 'IO';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="seller-layout h-screen flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-4.5 bg-white">
                <Link to='/'>
                    <h1 className="font-avenir font-black italic w-2xs text-xl hover:text-primary transition-colors">
                    <span className="tracking-widest">DAGGROSS</span> - <span className="text-primary font-bold text-lg">Backoffice</span>
                    </h1>
                </Link>
            </div>
            <div className="flex flex-1 overflow-hidden">
               <div className="md:w-64 w-16 border-r border-gray-300 pt-4 flex flex-col justify-between bg-white">
                    <div className="flex flex-col">
                        {sidebarLinks.map((item) => (
                            <NavLink to={item.path} key={item.name} end={item.path === "/seller"}
                                className={({isActive})=>`flex items-center py-3 px-4 gap-3 
                                    ${isActive ? "border-r-4 md:border-r-[6px] bg-primary/10 border-primary text-primary"
                                        : "hover:bg-gray-100/90 border-white"
                                    }`
                                }
                            >
                                <img src={item.icon} alt="" className="w-7 h-7" />
                                <p className="md:block hidden text-center">{item.name}</p>
                            </NavLink>
                        ))}
                    </div>
                    <div className="border-t border-gray-300 p-2 cursor-pointer">
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-3 w-full hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#4CAF50] text-white flex items-center justify-center text-base font-semibold">
                                    {getInitials(seller?.name)}
                                </div>
                                <div className="md:block hidden flex-1 text-left">
                                    <p className="font-semibold text-sm">{seller?.name || 'Loading...'}</p>
                                    <p className="text-xs text-gray-500">{seller?.email || 'Loading...'}</p>
                                </div>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className={`h-4 w-4 transition-transform md:block hidden ${isDropdownOpen ? 'rotate-180' : ''}`} 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute  bottom-full mb-1.5 left-0 w-full md:w-60 bg-white rounded-lg shadow-lg border border-gray-200 cursor-pointer">
                                    <button 
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            navigate('/seller/profile');
                                        }} 
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>Min Profil</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            navigate('/seller/settings');
                                        }} 
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>Inställningar</span>
                                    </button>
                                    <div className="my-2 border-t border-gray-200"></div>
                                    <button 
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                        }} 
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600 cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Logga ut</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div> 
                <div className="flex-1 overflow-hidden">
                    <Outlet/>
                </div>
            </div>
        </div>
    );
};

export default SellerLayout;