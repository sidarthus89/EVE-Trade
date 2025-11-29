import { useState, useEffect } from 'react'
import { fetchMarketOrders } from '../api/client'
import '../styles/MarketOrders.css'

export default function MarketOrders({ item, regionId, outlierFilter = 'none' }) {
    const [orders, setOrders] = useState({ buyOrders: [], sellOrders: [] })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!item?.id || !regionId) {
            setOrders({ buyOrders: [], sellOrders: [] })
            return
        }

        const loadOrders = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchMarketOrders(item.id, regionId, outlierFilter)
                setOrders({
                    buyOrders: data.buyOrders || [],
                    sellOrders: data.sellOrders || []
                })
                setLoading(false)
            } catch (err) {
                console.error('Error loading market orders:', err)
                setError(err.message)
                setLoading(false)
            }
        }

        loadOrders()
    }, [item?.id, regionId, outlierFilter])

    if (!item || !regionId) {
        return (
            <div className="market-orders">
                <p className="no-data">Select a region to view market orders</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="market-orders">
                <p className="loading">Loading market orders...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="market-orders">
                <p className="error">Error loading orders: {error}</p>
            </div>
        )
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price)
    }

    const formatVolume = (volume) => {
        return new Intl.NumberFormat('en-US').format(volume)
    }

    return (
        <div className="market-orders">
            <div className="table-section sellers-section">
                <h3 className="table-title">Sellers ({orders.sellOrders.length})</h3>
                <div className="table-wrapper">
                    {orders.sellOrders.length === 0 ? (
                        <p className="no-data">No sell orders found</p>
                    ) : (
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Price</th>
                                    <th>Volume</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.sellOrders.map((order, idx) => (
                                    <tr key={order.orderID || idx}>
                                        <td className="price">{formatPrice(order.price)} ISK</td>
                                        <td className="volume">{formatVolume(order.volumeRemain)}</td>
                                        <td className="location">{order.locationID}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="table-section buyers-section">
                <h3 className="table-title">Buyers ({orders.buyOrders.length})</h3>
                <div className="table-wrapper">
                    {orders.buyOrders.length === 0 ? (
                        <p className="no-data">No buy orders found</p>
                    ) : (
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Price</th>
                                    <th>Volume</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.buyOrders.map((order, idx) => (
                                    <tr key={order.orderID || idx}>
                                        <td className="price">{formatPrice(order.price)} ISK</td>
                                        <td className="volume">{formatVolume(order.volumeRemain)}</td>
                                        <td className="location">{order.locationID}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
