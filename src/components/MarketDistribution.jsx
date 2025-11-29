import { useState, useEffect } from 'react'
import { fetchMarketDistribution } from '../api/client'
import '../styles/MarketDistribution.css'

export default function MarketDistribution({ item }) {
    const [distribution, setDistribution] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!item?.id) {
            setDistribution([])
            return
        }

        const loadDistribution = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchMarketDistribution(item.id)
                setDistribution(data.distribution || [])
                setLoading(false)
            } catch (err) {
                console.error('Error loading market distribution:', err)
                setError(err.message)
                setLoading(false)
            }
        }

        loadDistribution()
    }, [item?.id])

    if (!item) {
        return (
            <div className="market-distribution">
                <p className="no-data">Select an item to view market distribution</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="market-distribution">
                <p className="loading">Loading market distribution...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="market-distribution">
                <p className="error">Error loading distribution: {error}</p>
            </div>
        )
    }

    const formatPrice = (price) => {
        if (!price) return 'N/A'
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price)
    }

    const formatVolume = (volume) => {
        return new Intl.NumberFormat('en-US').format(volume || 0)
    }

    return (
        <div className="market-distribution">
            <h3>Market Distribution Across Regions</h3>
            {distribution.length === 0 ? (
                <p className="no-data">No market data available for this item</p>
            ) : (
                <div className="distribution-table-wrapper">
                    <table className="distribution-table">
                        <thead>
                            <tr>
                                <th>Region</th>
                                <th>Buy Orders</th>
                                <th>Sell Orders</th>
                                <th>Buy Volume</th>
                                <th>Sell Volume</th>
                                <th>Avg Buy Price</th>
                                <th>Avg Sell Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {distribution.map((region, idx) => (
                                <tr key={region.regionID || idx}>
                                    <td className="region-name">{region.regionName}</td>
                                    <td className="orders">{region.buyOrderCount}</td>
                                    <td className="orders">{region.sellOrderCount}</td>
                                    <td className="volume">{formatVolume(region.buyVolume)}</td>
                                    <td className="volume">{formatVolume(region.sellVolume)}</td>
                                    <td className="price">{formatPrice(region.avgBuyPrice)} ISK</td>
                                    <td className="price">{formatPrice(region.avgSellPrice)} ISK</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
