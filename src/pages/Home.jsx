import { Link } from 'react-router-dom'
import '../styles/Home.css'

export default function Home() {
    const announcements = [
        {
            id: 1,
            date: '2025-11-29',
            title: 'EVE Data Site Launched!',
            content: 'Welcome to EVE Data Site! Browse real-time market data across all regions with live price updates every 5-10 minutes.'
        },
        {
            id: 2,
            date: '2025-11-29',
            title: 'Features Available',
            content: 'Market orders, price history, cross-region distribution, and outlier filtering now live. NPC stations fully synced!'
        },
        {
            id: 3,
            date: '2025-11-29',
            title: 'Data Updates',
            content: 'Major trade hubs (Jita, Amarr, Dodixie, Rens, Hek) update every 5 minutes. Other regions every 10 minutes.'
        }
    ]

    return (
        <div className="home">
            <section className="hero">
                <h1>EVE Data Site</h1>
                <p>Real-time market data for EVE Online</p>
                <div className="hero-buttons">
                    <Link to="/market" className="btn btn-primary">Browse Market</Link>
                </div>
            </section>

            <section className="announcements">
                <h2>Latest Announcements</h2>
                <div className="announcement-list">
                    {announcements.map(announcement => (
                        <div key={announcement.id} className="announcement-card">
                            <div className="announcement-header">
                                <h3>{announcement.title}</h3>
                                <span className="announcement-date">{announcement.date}</span>
                            </div>
                            <p>{announcement.content}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="features">
                <h2>Features</h2>
                <div className="feature-grid">
                    <div className="feature-card">
                        <h3>🔥 Real-Time Prices</h3>
                        <p>Live market data across 69+ regions with automatic updates</p>
                    </div>
                    <div className="feature-card">
                        <h3>📊 Price History</h3>
                        <p>30-day historical data with trends and volume analysis</p>
                    </div>
                    <div className="feature-card">
                        <h3>🌍 Regional Comparison</h3>
                        <p>Compare prices across all tradeable regions instantly</p>
                    </div>
                    <div className="feature-card">
                        <h3>🎯 Outlier Filtering</h3>
                        <p>Remove price outliers using IQR statistical methods</p>
                    </div>
                    <div className="feature-card">
                        <h3>⚡ Major Trade Hubs</h3>
                        <p>Jita, Amarr, Dodixie, Rens, Hek update every 5 minutes</p>
                    </div>
                    <div className="feature-card">
                        <h3>📦 Full Item Database</h3>
                        <p>Browse all tradeable items with search and categories</p>
                    </div>
                </div>
            </section>

            <section className="stats">
                <h2>Site Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">69+</div>
                        <div className="stat-label">Regions</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">5000+</div>
                        <div className="stat-label">NPC Stations</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">5-10min</div>
                        <div className="stat-label">Update Frequency</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">Live</div>
                        <div className="stat-label">Market Data</div>
                    </div>
                </div>
            </section>
        </div>
    )
}
