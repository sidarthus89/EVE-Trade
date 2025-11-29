import '../styles/Footer.css'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {currentYear} EVE Data Site. All rights reserved.</p>
            </div>
        </footer>
    )
}
