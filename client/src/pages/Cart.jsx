import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";

const Cart = () => {
    const {products, currency, cartItems, removeFromCart, getCartCount, updateCartItem, navigate, getCartAmount, axios, user, setCartItems, setShowUserLogin} = useAppContext()
    const [cartArray, setCartArray] = useState([])
    const [addresses, setAddresses] = useState([])
    const [showAddress, setShowAddress] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [paymentOption, setPaymentOption] = useState("COD")
    const [deliveryDate, setDeliveryDate] = useState("")

    const getCart = () => {
        let tempArray = []
        for(const key in cartItems){
            const product = products.find((item)=>item._id === key)
            if (product) {
            product.quantity = cartItems[key]
            tempArray.push(product)
            }
        }
        setCartArray(tempArray)
    }

    const getUserAddress = async () => {
        try {
            const {data} = await axios.get('/api/address/get');
            if (data.success) {
                setAddresses(data.addresses)
                if (!selectedAddress && data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0])
                }
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const placeOrder = async () => {
        try {
            if (!user) {
                setShowUserLogin(true)
                return
            }

            if (!selectedAddress) {
                return toast.error("Vänligen välj en leveransadress")
            }

            if (!deliveryDate) {
                return toast.error("Vänligen välj ett leveransdatum")
            }

            const orderData = {
                    userId: user._id,
                items: cartArray.map(item => ({
                    product: item._id,
                    quantity: item.quantity
                })),
                    address: selectedAddress._id,
                    deliveryDate: deliveryDate
            }

            if (paymentOption === "COD") {
                const {data} = await axios.post('/api/order/cod', orderData)
                if (data.success) {
                    toast.success(data.message)
                    setCartItems({})
                    navigate('/my-orders')
                } else {
                    toast.error(data.message)
                }
            } else {
                const {data} = await axios.post('/api/order/stripe', orderData)
                if (data.success) {
                    localStorage.setItem('pendingCartItems', JSON.stringify(cartItems))
                    setCartItems({})
                    window.location.replace(data.url)
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Initial setup
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    // Fetch addresses when user is available
    useEffect(() => {
        if (user) {
            getUserAddress()
        }
    }, [user])

    // Update cart when products or cartItems change
    useEffect(() => {
        if (products.length > 0 && cartItems) {
            getCart()
        }
    }, [products, cartItems])

    if (!products.length || !cartItems) return null

    return (
        <div className="flex flex-col md:flex-row mt-16">
            <div className="flex-1 max-w-4xl">
                <h1 className="text-3xl font-medium mb-6">
                    Kundvagn <span className="text-sm text-primary">{getCartCount()} Artiklar</span>
                </h1>

                {/* Cart items section */}
                {cartArray.length > 0 ? (
                    <>
                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Produktdetaljer</p>
                    <p className="text-center">Delsumma</p>
                    <p className="text-center">Åtgärd</p>
                </div>

                {cartArray.map((product, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                        <div className="flex items-center md:gap-6 gap-3">
                                    <div onClick={() => navigate(`/products/${product.category.toLowerCase()}/${product._id}`)} 
                                         className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded">
                                <img className="max-w-full h-full object-cover" src={product.image[0]} alt={product.name} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Vikt: <span>{product.weight || "N/A"}</span></p>
                                            <div className="flex items-center">
                                        <p>Antal:</p>
                                                <select 
                                                    onChange={e => updateCartItem(product._id, Number(e.target.value))}
                                                    value={cartItems[product._id]} 
                                                    className="outline-none"
                                                >
                                                    {Array(Math.max(product.quantity, cartItems[product._id])).fill('').map((_, index) => (
                                                <option key={index} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{product.offerPrice * product.quantity}{currency}</p>
                                <button onClick={() => removeFromCart(product._id)} className="cursor-pointer mx-auto">
                            <img src={assets.remove_icon} alt="ta bort" className="inline-block w-6 h-6" />
                        </button>
                            </div>
                        ))}
                    </>
                ) : (
                    <p className="text-center text-gray-500">Din kundvagn är tom</p>
                )}

                <button onClick={() => navigate("/products")} className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium">
                    <img className="group-hover:-translate-x-1 transition" src={assets.arrow_right_icon_colored} alt="pil" />
                    Fortsätt handla
                </button>
            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
                <h2 className="text-xl md:text-xl font-medium">Ordersammanfattning</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">Leveransadress</p>
                    <div className="relative flex justify-between items-start mt-2">
                        {user ? (
                            <>
                                <p className="text-gray-500">
                                    {selectedAddress ? 
                                        `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}` 
                                        : "Ingen adress vald"}
                                </p>
                                <button 
                                    onClick={() => setShowAddress(!showAddress)} 
                                    className="text-primary hover:underline cursor-pointer"
                                >
                            Ändra
                        </button>
                        {showAddress && (
                                    <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full z-10">
                                        {addresses.map((address, index) => (
                                            <p 
                                                key={index}
                                                onClick={() => {
                                                    setSelectedAddress(address)
                                                    setShowAddress(false)
                                                }} 
                                                className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                    {address.street}, {address.city}, {address.state}, {address.country}
                                </p>
                                        ))}
                                        <p 
                                            onClick={() => navigate("/add-address")} 
                                            className="text-primary text-center cursor-pointer p-2 hover:bg-primary/10"
                                        >
                                            Lägg till ny adress
                                </p>
                            </div>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-500">Logga in för att välja leveransadress</p>
                        )}
                    </div>

                    <p className="text-sm font-medium uppercase mt-6">Leveransdatum</p>
                    <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]} 
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none"
                    />

                    <p className="text-sm font-medium uppercase mt-6">Betalningsmetod</p>
                    <select 
                        onChange={e => setPaymentOption(e.target.value)} 
                        className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none"
                    >
                        <option value="COD">Postförskott</option>
                        <option value="Online">Onlinebetalning</option>
                    </select>
                </div>

                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Pris</span><span>{getCartAmount()}{currency}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Fraktkostnad</span><span className="text-green-600">Gratis</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Moms (2%)</span><span>{Math.floor(getCartAmount() * 0.02)}{currency}</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Totalt belopp:</span>
                        <span>{getCartAmount() + Math.floor(getCartAmount() * 0.02)}{currency}</span>
                    </p>
                </div>

                <button 
                    onClick={placeOrder} 
                    className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!user || cartArray.length === 0}
                >
                    {!user ? "Logga in för att fortsätta" : 
                        cartArray.length === 0 ? "Lägg till produkter i kundvagnen" :
                        paymentOption === "COD" ? "Lägg beställning" : "Fortsätt till betalning"}
                </button>
            </div>
        </div>
    )
}

export default Cart;