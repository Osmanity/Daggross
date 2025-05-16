import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import toast from 'react-hot-toast'
import Loading from '../../components/Loading'

const Orders = () => {
    const {currency, axios} = useAppContext()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

    const orderStatuses = [
        'Väntar på betalning',
        'Betalning mottagen',
        'Under behandling',
        'Skickad',
        'Levererad',
        'Avbruten'
    ]

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

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const { data } = await axios.put(`/api/order/${orderId}`, {
                status: newStatus
            });
            
            if (data.success) {
                toast.success(data.message);
                setOrders(orders.map(order => 
                    order._id === orderId ? data.order : order
                ));
                setIsUpdateModalOpen(false);
                setSelectedOrder(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Är du säker på att du vill radera denna order?')) return;
        
        try {
            const { data } = await axios.delete(`/api/order/${orderId}`);
            
            if (data.success) {
                toast.success(data.message);
                setOrders(orders.filter(order => order._id !== orderId));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [])

    useEffect(() => {
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <Loading fullScreen={true} />
    }

    return (
        <div className='flex-1 h-[95vh] overflow-y-scroll bg-gray-50'>
            <div className="max-w-7xl mx-auto p-4 space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm sticky top-4 z-10">
                    <h2 className="text-xl font-medium text-gray-800">Orderlista</h2>
                    <button 
                        onClick={fetchOrders}
                        className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Uppdatera
                    </button>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">Inga ordrar hittades</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex flex-col space-y-4">
                                    {/* Order Header */}
                                    <div className="flex justify-between items-start border-b pb-3">
                                        <div>
                                            <p className="text-gray-600 text-sm">Order ID:</p>
                                            <p className="font-mono text-sm text-gray-800">{order._id}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-medium text-gray-800 mb-1">
                                                {order.amount}{currency}
                                            </p>
                                            <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                                                order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.isPaid ? 'Betald' : 'Väntar på betalning'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Content */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                                                <img className="w-10 h-10 object-cover" src={assets.box_icon} alt="boxIcon" />
                                            </div>
                                            <div className="min-w-0">
                                                {order.items && order.items.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-1 flex-wrap">
                                                        <span className="font-medium text-gray-800 break-all">
                                                            {item.product?.name || "Product Unavailable"}
                                                        </span>
                                                        <span className="text-primary whitespace-nowrap">x {item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            {order.address ? (
                                                <>
                                                    <p className="text-base font-medium text-gray-900 mb-1">
                                                        {order.address.firstName} {order.address.lastName}
                                                    </p>
                                                    <p className="text-[15px] text-[#4B5563]">{order.address.street}</p>
                                                    <p className="text-[15px] text-[#4B5563]">{order.address.city}, {order.address.zipcode}</p>
                                                    <p className="text-[15px] text-[#4B5563]">{order.address.country}</p>
                                                    <p className="text-[15px] text-[#4B5563] mt-1">{order.address.phone}</p>
                                                </>
                                            ) : (
                                                <p className="text-gray-500">Address information unavailable</p>
                                            )}
                                        </div>

                                        <div className="text-sm text-gray-600 flex flex-col gap-2">
                                            <p>Metod: <span className="text-gray-800">{order.paymentType === "COD" ? "Postförskott" : "Online"}</span></p>
                                            <p>Datum: <span className="text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</span></p>
                                            <p>Leverans: <span className="text-gray-800">{new Date(order.deliveryDate).toLocaleDateString()}</span></p>
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                    className="text-sm border rounded px-2 py-1 mr-2"
                                                >
                                                    {orderStatuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                                
                                                <button
                                                    onClick={() => handleDeleteOrder(order._id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Orders
