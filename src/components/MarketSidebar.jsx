import { useState } from 'react'
import RegionSelector from './RegionSelector'
import MarketTree from './MarketTree'
import '../styles/MarketSidebar.css'

export default function MarketSidebar({ onSelectItem, onSelectRegion, quickbarItems = [], onRemoveQuickbarItem }) {
    const [selectedRegion, setSelectedRegion] = useState(null)
    const [activeTab, setActiveTab] = useState('market') // 'market' | 'quickbar'

    const handleRegionSelect = (regionId) => {
        setSelectedRegion(regionId)
        if (onSelectRegion) {
            onSelectRegion(regionId)
        }
    }

    const selectQuickbarItem = (item) => {
        // Quickbar item only has id/name; create minimal item object
        onSelectItem({ id: item.id, name: item.name, breadcrumb: ['Quickbar', item.name] })
    }

    return (
        <aside className="market-sidebar">
            <div className="sidebar-header">
                <h3>Market Navigator</h3>
            </div>

            <RegionSelector onSelectRegion={handleRegionSelect} />

            <div className="sidebar-tabs">
                <button
                    className={`tab-button ${activeTab === 'market' ? 'active' : ''}`}
                    onClick={() => setActiveTab('market')}
                >
                    Market
                </button>
                <button
                    className={`tab-button ${activeTab === 'quickbar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quickbar')}
                >
                    Quickbar ({quickbarItems.length})
                </button>
            </div>

            {activeTab === 'market' && (
                <MarketTree
                    onSelectItem={onSelectItem}
                    selectedRegion={selectedRegion}
                />
            )}

            {activeTab === 'quickbar' && (
                <div className="quickbar-list">
                    {quickbarItems.length === 0 && (
                        <p className="quickbar-empty">No items added yet. Use "Add to Quickbar" in item viewer.</p>
                    )}
                    {quickbarItems.map(item => (
                        <div key={item.id} className="quickbar-item">
                            <button className="quickbar-select" onClick={() => selectQuickbarItem(item)}>
                                {item.name}
                            </button>
                            <button
                                className="quickbar-remove"
                                onClick={() => onRemoveQuickbarItem && onRemoveQuickbarItem(item.id)}
                                title="Remove"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    )
}
