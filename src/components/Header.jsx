import { Link } from 'react-router-dom'
import '../styles/Header.css'

export default function Header() {
    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    EVE Data Site
                </Link>

                <nav className="nav-menu">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/market" className="nav-link">Market Browser</Link>
                </nav>                <div className="header-right">
                    <button className="support-btn">Support</button>
                </div>
            </div>
        </header>
    )
}
