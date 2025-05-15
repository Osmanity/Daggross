import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import toast from 'react-hot-toast'
import Loading from '../../components/Loading'

const Orders = () => {
    const {currency, axios} = useAppContext()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get('/api/order/seller');
            if(data.success){
                setOrders(data.orders)
            } else {
                toast.error(data.message)
            }
            setLoading(false)
        } catch (error) {
            toast.error(error.message)
            setLoading(false)
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchOrders();
    }, [])

    // Periodisk uppdatering var 30:e sekund
    useEffect(() => {
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <Loading fullScreen={true} />
    }

    return (
        <div className='no-scrollbar flex-1 h-[95vh] overflow-y-scroll'>
            <div className="md:p-10 p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium">Orderlista</h2>
                    <button 
                        onClick={fetchOrders}
                        className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                    >
                        Uppdatera
                    </button>
                </div>

                {orders.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8">Inga ordrar hittades</p>
                ) : (
                    orders.map((order, index) => (
                        <div key={index} className="flex flex-col md:items-center md:flex-row gap-5 justify-between p-5 max-w-4xl rounded-md border border-gray-300">
                            <div className="flex gap-5 max-w-80">
                                <img className="w-12 h-12 object-cover" src={assets.box_icon} alt="boxIcon" />
                                <div>
                                    {order.items && order.items.map((item, index) => (
                                        <div key={index} className="flex flex-col">
                                            <p className="font-medium">
                                                {item.product?.name || "Product Unavailable"}{" "} 
                                                <span className="text-primary">x {item.quantity}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        <div className="text-sm md:text-base text-black/60">
                            {order.address ? (
                                <>
                                    <p className='text-black/80'>
                                        {order.address.firstName} {order.address.lastName}
                                    </p>
                                    <p>{order.address.street}, {order.address.city}</p>
                                    <p>{order.address.state}, {order.address.zipcode}, {order.address.country}</p>
                                    <p>{order.address.phone}</p>
                                </>
                            ) : (
                                <p className='text-black/80'>Address information unavailable</p>
                            )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <p className="font-medium text-lg">
                                {order.amount}{currency}
                            </p>
                            <div className={`px-3 py-1 rounded-full text-sm ${
                                order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {order.isPaid ? 'Betald' : 'Väntar på betalning'}
                            </div>
                        </div>

                            <div className="flex flex-col text-sm md:text-base text-black/60">
                                <p>Metod: {order.paymentType === "COD" ? "Postförskott" : "Online"}</p>
                                <p>Datum: {new Date(order.createdAt).toLocaleDateString()}</p>
                                <p>Leverans: {new Date(order.deliveryDate).toLocaleDateString()}</p>
                                <p className="font-medium text-primary">
                                    Status: {order.status}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Orders
