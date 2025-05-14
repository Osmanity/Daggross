import React, { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Navbar = () => {
    const [open, setOpen] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const {user, setUser, setShowUserLogin, navigate, setSearchQuery, searchQuery, getCartCount, axios, isSeller} = useAppContext();
    const dropdownRef = useRef(null);

    const logout = async ()=>{
      try {
        const { data } = await axios.get('/api/user/logout')
        if(data.success){
          toast.success(data.message)
          setUser(null);
          navigate('/')
        }else{
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }

    useEffect(()=>{
      if(searchQuery.length > 0){
        navigate("/products")
      }
    },[searchQuery])

    useEffect(() => {
        const closeDropdown = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
    }, []);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 bg-white relative transition-all">
      <NavLink to='/' onClick={()=> setOpen(false)} className="text-2xl font-semibold tracking-tight hover:text-primary transition-colors">
        <h1 className="font-avenir font-black italic w-2xs">
          Daggrosss
        </h1>
      </NavLink>

      <div className="hidden sm:flex items-center gap-8">
        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
          <input onChange={(e)=> setSearchQuery(e.target.value)} className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500" type="text" placeholder="Search products" />
          <img src={assets.search_icon} alt='search' className='w-4 h-4'/>
        </div>

        <div onClick={()=> navigate("/cart")} className="relative cursor-pointer">
          <img src={assets.nav_cart_icon} alt='cart' className='w-6 opacity-80'/>
          <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">{getCartCount()}</button>
        </div>

        {!user ? (
          <button 
            onClick={()=> setShowUserLogin(true)} 
            className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition text-white rounded-full"
          >
            Login
          </button>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8.5 h-8.5 rounded-full bg-primary text-white flex items-center justify-center">
                {(user.name?.[0] || user.email?.[0])?.toUpperCase()}
              </div>
              <span className="text-gray-700">{(user.name || user.email)?.charAt(0).toUpperCase() + (user.name || user.email)?.slice(1)}</span>
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-500">Inloggad som</p>
                  <p className="font-medium truncate text-gray-700">{user.email}</p>
                </div>
                
                <div className="py-0">
                  <button
                    onClick={() => {
                      navigate('/my-orders');
                      setShowDropdown(false);
                    }}
                    style={{ position: 'relative' }}
                    className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-green-100/50 cursor-pointer transition-all duration-200"
                  >
                    Mina ordrar
                  </button>
                  
                  {isSeller && (
                    <button
                      onClick={() => {
                        navigate('/seller');
                        setShowDropdown(false);
                      }}
                      style={{ position: 'relative' }}
                      className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-green-100/50 cursor-pointer transition-all duration-200"
                    >
                      Säljare Backoffice
                    </button>
                  )}

                  <button
                    onClick={() => {
                      navigate('/cart');
                      setShowDropdown(false);
                    }}
                    style={{ position: 'relative' }}
                    className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-green-100/50 cursor-pointer transition-all duration-200"
                  >
                    Min kundvagn
                  </button>

                  <div className="border-t border-gray-200">
                    <button
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      style={{ position: 'relative' }}
                      className="block w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 cursor-pointer transition-all duration-200"
                    >
                      Logga ut
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className='flex items-center gap-6 sm:hidden'>
        <div onClick={()=> navigate("/cart")} className="relative cursor-pointer">
          <img src={assets.nav_cart_icon} alt='cart' className='w-6 opacity-80'/>
          <button className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">{getCartCount()}</button>
        </div>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="">
          <img src={assets.menu_icon} alt='menu'/>
        </button>
      </div>

      {open && (
        <div className="absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex-col items-start gap-2 px-5 text-sm md:hidden">
          <NavLink to="/" onClick={()=> setOpen(false)}>Home</NavLink>
          <NavLink to="/products" onClick={()=> setOpen(false)}>All Product</NavLink>
          {user && 
            <NavLink to="/my-orders" onClick={()=> setOpen(false)}>My Orders</NavLink>
          }
          <NavLink to="/" onClick={()=> setOpen(false)}>Contact</NavLink>

          {!user ? (
            <button 
              onClick={()=>{
                setOpen(false);
                setShowUserLogin(true);
              }} 
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm"
            >
              Login
            </button>
          ) : (
            <button 
              onClick={() => {
                logout();
                setOpen(false);
              }} 
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
