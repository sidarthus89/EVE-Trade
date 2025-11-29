import { useState, useEffect } from 'react'
import { fetchMarketHistory } from '../api/client'
import '../styles/MarketHistory.css'

export default function MarketHistory({ item, regionId }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!item?.id || !regionId) {
            setHistory([])
            return
        }

        const loadHistory = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchMarketHistory(item.id, regionId, 30) // Last 30 days
                setHistory(data.history || [])
                setLoading(false)
            } catch (err) {
                console.error('Error loading market history:', err)
                setError(err.message)
                setLoading(false)
            }
        }

        loadHistory()
    }, [item?.id, regionId])

    if (!item || !regionId) {
        return (
            <div className="market-history">
                <p className="no-data">Select a region to view market history</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="market-history">
                <p className="loading">Loading market history...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="market-history">
                <p className="error">Error loading history: {error}</p>
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
        <div className="market-history">
            <h3>Market History (Last 30 Days)</h3>
            {history.length === 0 ? (
                <p className="no-data">No market history data available</p>
            ) : (
                <div className="history-table-wrapper">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Average</th>
                                <th>Highest</th>
                                <th>Lowest</th>
                                <th>Volume</th>
                                <th>Orders</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((day, idx) => (
                                <tr key={day.date || idx}>
                                    <td>{new Date(day.date).toLocaleDateString()}</td>
                                    <td className="price">{formatPrice(day.average)} ISK</td>
                                    <td className="price">{formatPrice(day.highest)} ISK</td>
                                    <td className="price">{formatPrice(day.lowest)} ISK</td>
                                    <td className="volume">{formatVolume(day.volume)}</td>
                                    <td className="orders">{day.orderCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
