import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import Loading from '../components/Loading'

const MyOrders = () => {
    const [myOrders, setMyOrders] = useState([])
    const {currency, axios, user, navigate, isLoading, setShowUserLogin} = useAppContext()

    // Status styling configuration
    const getStatusStyle = (status) => {
        const styles = {
            'Väntar på betalning': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
            'Betalning mottagen': { bg: 'bg-green-100', text: 'text-green-800', icon: '💰' },
            'Under behandling': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄' },
            'Skickad': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '📦' },
            'Levererad': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
            'Avbruten': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
        }
        return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❔' }
    }

    const getCODStatusStyle = (status) => {
        const styles = {
            'Ej skickad': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📝' },
            'Skickad till ombud': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🚚' },
            'Hos ombud': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '📍' },
            'Redo för upphämtning': { bg: 'bg-green-100', text: 'text-green-800', icon: '✨' },
            'Upphämtad': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
            'Returnerad': { bg: 'bg-red-100', text: 'text-red-800', icon: '↩️' }
        }
        return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❔' }
    }

    const fetchMyOrders = async ()=>{
        try {
            const { data } = await axios.get('/api/order/user')
            if(data.success){
                setMyOrders(data.orders)
            } else {
                toast.error(data.message || 'Failed to fetch orders')
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch orders')
        }
    }

    useEffect(() => {
        const interval = setInterval(fetchMyOrders, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(()=>{
        if(!isLoading && !user) {
            navigate('/');
            setShowUserLogin(true);
            return;
        }
        
        if(user) {
            fetchMyOrders();
        }
    },[user, isLoading, navigate, setShowUserLogin]);

    if (isLoading) {
        return <Loading fullScreen={true} />;
    }

    return (
        <div className='mt-16 pb-16 max-w-6xl mx-auto px-4'>
            <div className='flex justify-between items-center mb-8'>
                <div>
                    <h1 className='text-2xl font-medium'>Mina beställningar</h1>
                    <div className='w-16 h-0.5 bg-primary rounded-full mt-1'></div>
                </div>
            </div>

            {myOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">Inga beställningar hittades</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {myOrders.map((order) => (
                        <div key={order._id} className='bg-white rounded-lg shadow-sm overflow-hidden'>
                            {/* Order Header */}
                            <div className='border-b border-gray-100 p-4'>
                                <div className='flex flex-wrap gap-4 justify-between items-center'>
                                    <div>
                                        <p className='text-sm text-gray-500'>Order ID:</p>
                                        <p className='font-mono text-sm'>{order._id}</p>
                                        {order.paymentType === "COD" && order.codDetails?.trackingNumber && (
                                            <>
                                                <p className='text-sm text-gray-500 mt-2'>Spårningsnummer:</p>
                                                <p className='font-mono text-sm'>{order.codDetails.trackingNumber}</p>
                                            </>
                                        )}
                                    </div>
                                    <div className='text-right'>
                                        <p className='text-lg font-medium text-gray-900'>{order.amount}{currency}</p>
                                        <p className='text-sm text-gray-500'>{order.paymentType === "COD" ? "Postförskott" : "Online betalning"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            {order.items.map((item, index) => (
                                <div key={index} className='p-4 flex flex-col md:flex-row gap-4 border-b border-gray-100'>
                                    <div className='flex items-start gap-4 flex-grow'>
                                        <div className='bg-primary/10 p-3 rounded-lg'>
                                            <img src={item.product.image[0]} alt="" className='w-16 h-16 object-cover rounded' />
                                        </div>
                                        <div>
                                            <h3 className='font-medium text-gray-900'>{item.product.name}</h3>
                                            <p className='text-sm text-gray-500'>Kategori: {item.product.category}</p>
                                            <p className='text-sm text-gray-500'>Antal: {item.quantity}</p>
                                            <p className='text-primary font-medium mt-1'>
                                                {item.product.offerPrice * item.quantity}{currency}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Order Footer */}
                            <div className='p-4 bg-gray-50'>
                                <div className='flex flex-wrap gap-4 justify-between items-center'>
                                    <div className='space-y-1'>
                                        <p className='text-sm text-gray-500'>
                                            Beställd: {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className='text-sm text-gray-500'>
                                            Leverans: {new Date(order.deliveryDate).toLocaleDateString()}
                                        </p>
                                        {order.paymentType === "COD" && order.codDetails?.estimatedDelivery && (
                                            <p className='text-sm text-gray-500'>
                                                Beräknad leverans till ombud: {new Date(order.codDetails.estimatedDelivery).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className='flex flex-col items-end gap-2'>
                                        <div className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${
                                            getStatusStyle(order.status).bg} ${getStatusStyle(order.status).text}`}>
                                            <span>{getStatusStyle(order.status).icon}</span>
                                            <span>{order.status}</span>
                                        </div>
                                        {order.paymentType === "COD" && order.codDetails?.codStatus && (
                                            <div className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${
                                                getCODStatusStyle(order.codDetails.codStatus).bg} ${getCODStatusStyle(order.codDetails.codStatus).text}`}>
                                                <span>{getCODStatusStyle(order.codDetails.codStatus).icon}</span>
                                                <span>{order.codDetails.codStatus}</span>
                                            </div>
                                        )}
                                        <div className={`px-3 py-1.5 rounded-full text-sm ${
                                            order.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {order.isPaid ? '✓ Betald' : '⏳ Väntar på betalning'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyOrders
