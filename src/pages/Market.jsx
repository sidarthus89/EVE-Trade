import { useState, useEffect } from 'react'
import MarketSidebar from '../components/MarketSidebar'
import ItemViewer from '../components/ItemViewer'
import MarketOrders from '../components/MarketOrders'
import MarketHistory from '../components/MarketHistory'
import MarketDistribution from '../components/MarketDistribution'
import '../styles/Market.css'

export default function Market() {
    const [selectedItem, setSelectedItem] = useState(null)
    const [selectedRegion, setSelectedRegion] = useState(null)
    const [quickbarItems, setQuickbarItems] = useState([])
    const [activeView, setActiveView] = useState('orders') // 'orders' | 'history' | 'distribution'
    const [outlierFilter, setOutlierFilter] = useState('none')

    // Load quickbar from localStorage once
    useEffect(() => {
        try {
            const stored = localStorage.getItem('quickbarItems')
            if (stored) {
                setQuickbarItems(JSON.parse(stored))
            }
        } catch (e) {
            console.warn('Failed to load quickbarItems:', e)
        }
    }, [])

    // Persist quickbar changes
    useEffect(() => {
        try {
            localStorage.setItem('quickbarItems', JSON.stringify(quickbarItems))
        } catch (e) {
            console.warn('Failed to save quickbarItems:', e)
        }
    }, [quickbarItems])

    const handleSelectItem = (item) => {
        setSelectedItem(item)
    }

    const handleAddToQuickbar = (item) => {
        setQuickbarItems(prev => {
            // prevent duplicates by id
            if (prev.some(i => i.id === item.id)) return prev
            return [...prev, { id: item.id, name: item.name }]
        })
    }

    const handleRemoveFromQuickbar = (id) => {
        setQuickbarItems(prev => prev.filter(i => i.id !== id))
        // if removing currently selected item, keep selection unchanged
    }

    return (
        <div className="market-page">
            <div className="market-container">
                <MarketSidebar
                    onSelectItem={handleSelectItem}
                    onSelectRegion={setSelectedRegion}
                    quickbarItems={quickbarItems}
                    onRemoveQuickbarItem={handleRemoveFromQuickbar}
                />

                <main className="market-content">
                    <h1>Market Browser</h1>

                    {selectedItem ? (
                        <div className="item-details">
                            <ItemViewer
                                item={selectedItem}
                                breadcrumb={selectedItem.breadcrumb}
                                onAddToQuickbar={handleAddToQuickbar}
                                quickbarItems={quickbarItems}
                                activeView={activeView}
                                onViewChange={setActiveView}
                                outlierFilter={outlierFilter}
                                onOutlierFilterChange={setOutlierFilter}
                            />

                            {activeView === 'orders' && (
                                <MarketOrders
                                    item={selectedItem}
                                    regionId={selectedRegion}
                                    outlierFilter={outlierFilter}
                                />
                            )}
                            {activeView === 'history' && (
                                <MarketHistory
                                    item={selectedItem}
                                    regionId={selectedRegion}
                                />
                            )}
                            {activeView === 'distribution' && (
                                <MarketDistribution
                                    item={selectedItem}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="no-selection">
                            <p>Select an item from the Market Navigator to view pricing data</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
