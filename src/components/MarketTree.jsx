import { useState, useEffect } from 'react'
import { fetchMarketTree } from '../api/client'
import '../styles/MarketTree.css'

export default function MarketTree({ onSelectItem }) {
    const [marketData, setMarketData] = useState({})
    const [expandedCategories, setExpandedCategories] = useState({})
    const [expandedSubcategories, setExpandedSubcategories] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredData, setFilteredData] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Load market tree data from API
    useEffect(() => {
        const loadMarketData = async () => {
            try {
                const data = await fetchMarketTree()
                setMarketData(data)
                setFilteredData(data)
                setLoading(false)
            } catch (error) {
                console.error('Error loading market data:', error)
                setError(error.message)
                setLoading(false)
            }
        }
        loadMarketData()
    }, [])

    // Filter data based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredData(marketData)
            return
        }

        const query = searchQuery.toLowerCase()
        const filtered = {}

        Object.entries(marketData).forEach(([category, subcategories]) => {
            const filteredSubcategories = {}

            Object.entries(subcategories).forEach(([subcategory, data]) => {
                if (!data.items) return

                const filteredItems = data.items.filter(item =>
                    item.typeName.toLowerCase().includes(query)
                )

                if (filteredItems.length > 0) {
                    filteredSubcategories[subcategory] = {
                        ...data,
                        items: filteredItems
                    }
                }
            })

            if (Object.keys(filteredSubcategories).length > 0) {
                filtered[category] = filteredSubcategories
            }
        })

        setFilteredData(filtered)
    }, [searchQuery, marketData])

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    const toggleSubcategory = (key) => {
        setExpandedSubcategories(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const handleSelectItem = (item, category, subcategory) => {
        onSelectItem({
            id: item.typeID,
            name: item.typeName,
            volume: item.volume,
            mass: item.mass,
            published: item.published,
            breadcrumb: [category, subcategory, item.typeName]
        })
    }

    if (loading) {
        return <div className="market-tree"><p>Loading market data...</p></div>
    }

    if (error) {
        return (
            <div className="market-tree error">
                <p>Error loading market data: {error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        )
    }

    return (
        <div className="market-tree">
            <h3>Market Browser</h3>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {searchQuery && (
                    <button
                        className="clear-search"
                        onClick={() => setSearchQuery('')}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="tree-container">
                {Object.entries(filteredData).map(([categoryName, subcategories]) => (
                    <div key={categoryName} className="category">
                        <div
                            className="category-header"
                            onClick={() => toggleCategory(categoryName)}
                        >
                            <span className="expand-icon">
                                {expandedCategories[categoryName] ? '▼' : '▶'}
                            </span>
                            <span className="category-name">{categoryName}</span>
                        </div>

                        {expandedCategories[categoryName] && (
                            <div className="subcategories-list">
                                {Object.entries(subcategories).map(([subcategoryName, subcategoryData]) => {
                                    const subcatKey = `${categoryName}-${subcategoryName}`
                                    return (
                                        <div key={subcategoryName} className="subcategory">
                                            <div
                                                className="subcategory-header"
                                                onClick={() => toggleSubcategory(subcatKey)}
                                            >
                                                <span className="expand-icon">
                                                    {expandedSubcategories[subcatKey] ? '▼' : '▶'}
                                                </span>
                                                <span className="subcategory-name">{subcategoryName}</span>
                                            </div>

                                            {expandedSubcategories[subcatKey] && subcategoryData.items && (
                                                <div className="items-list">
                                                    {subcategoryData.items.map(item => (
                                                        <div
                                                            key={item.typeID}
                                                            className="item"
                                                            onClick={() => handleSelectItem(item, categoryName, subcategoryName)}
                                                        >
                                                            {item.typeName}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {Object.keys(filteredData).length === 0 && searchQuery && (
                <div className="no-results">
                    No items found matching "{searchQuery}"
                </div>
            )}
        </div>
    )
}
