import { useState } from 'react'
import '../styles/ItemViewer.css'

export default function ItemViewer({
    item,
    breadcrumb,
    onAddToQuickbar,
    quickbarItems = [],
    activeView = 'orders',
    onViewChange,
    outlierFilter = 'none',
    onOutlierFilterChange
}) {
    const [shareNotification, setShareNotification] = useState(false)

    const alreadyInQuickbar = quickbarItems.some(i => i.id === item.id)

    const handleAddToQuickbar = () => {
        if (alreadyInQuickbar) return
        if (onAddToQuickbar) {
            onAddToQuickbar(item)
        }
    }

    const handleShare = () => {
        const itemUrl = `${window.location.origin}${window.location.pathname}?item=${item.id}`
        navigator.clipboard.writeText(itemUrl).then(() => {
            setShareNotification(true)
            setTimeout(() => setShareNotification(false), 2000)
        })
    }

    // Generate icon URL from EVE Online's image server
    const getItemIconUrl = (typeId) => {
        return `https://images.evetech.net/types/${typeId}/icon?size=64`
    }

    return (
        <div className="item-viewer">
            <div className="item-header">
                <div className="item-icon-section">
                    <img
                        src={getItemIconUrl(item.id)}
                        alt={item.name}
                        className="item-icon"
                        onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect fill="%231a3a5a" width="64" height="64"/></svg>'
                        }}
                    />
                </div>

                <div className="item-info-section">
                    <div className="item-breadcrumb">
                        {breadcrumb && breadcrumb.length > 0 ? (
                            breadcrumb.map((crumb, index) => (
                                <span key={index}>
                                    {crumb}
                                    {index < breadcrumb.length - 1 && <span className="separator"> / </span>}
                                </span>
                            ))
                        ) : (
                            <span className="separator">Item</span>
                        )}
                    </div>
                    <h2 className="item-name">{item.name}</h2>
                    <p className="item-id">Type ID: {item.id}</p>
                </div>

                <div className="item-actions">
                    <button
                        className={`action-btn quickbar-btn ${alreadyInQuickbar ? 'disabled' : ''}`}
                        onClick={handleAddToQuickbar}
                        title={alreadyInQuickbar ? 'Already in Quickbar' : 'Add to Quickbar'}
                        disabled={alreadyInQuickbar}
                    >
                        {alreadyInQuickbar ? 'In Quickbar' : 'Add to Quickbar'}
                    </button>
                    <button
                        className={`action-btn share-btn ${shareNotification ? 'copied' : ''}`}
                        onClick={handleShare}
                        title="Copy share link"
                    >
                        {shareNotification ? '✓ Copied' : 'Share'}
                    </button>
                </div>
            </div>

            <div className="view-controls">
                <div className="view-tabs">
                    <button
                        className={`view-tab ${activeView === 'orders' ? 'active' : ''}`}
                        onClick={() => onViewChange && onViewChange('orders')}
                    >
                        Market Orders
                    </button>
                    <button
                        className={`view-tab ${activeView === 'history' ? 'active' : ''}`}
                        onClick={() => onViewChange && onViewChange('history')}
                    >
                        Market History
                    </button>
                    <button
                        className={`view-tab ${activeView === 'distribution' ? 'active' : ''}`}
                        onClick={() => onViewChange && onViewChange('distribution')}
                    >
                        Market Distribution
                    </button>
                </div>

                {activeView === 'orders' && (
                    <div className="outlier-filter-section">
                        <label htmlFor="outlier-filter" className="filter-label">Outlier Filter:</label>
                        <select
                            id="outlier-filter"
                            value={outlierFilter}
                            onChange={(e) => onOutlierFilterChange && onOutlierFilterChange(e.target.value)}
                            className="outlier-dropdown"
                        >
                            <option value="none">No outlier prices filtered out</option>
                            <option value="iqr_1.5">5th to 95th percentile (1.5 IQR)</option>
                            <option value="iqr_1.0">10th to 90th percentile (1.0 IQR)</option>
                            <option value="iqr_0.5">25th to 75th percentile (0.5 IQR)</option>
                            <option value="iqr_0.25">37.5th to 62.5th percentile (0.25 IQR)</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="item-details-section">
                <div className="detail-row">
                    <span className="detail-label">Volume:</span>
                    <span className="detail-value">{item.volume ? item.volume.toFixed(2) : 'N/A'} m³</span>
                </div>
                {item.mass && (
                    <div className="detail-row">
                        <span className="detail-label">Mass:</span>
                        <span className="detail-value">{item.mass.toFixed(2)} kg</span>
                    </div>
                )}
                {item.published !== undefined && (
                    <div className="detail-row">
                        <span className="detail-label">Published:</span>
                        <span className="detail-value">{item.published ? 'Yes' : 'No'}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
