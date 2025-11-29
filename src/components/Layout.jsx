import Header from './Header'
import Footer from './Footer'
import '../styles/Layout.css'

export default function Layout({ children }) {
    return (
        <div className="layout">
            <Header />
            <main className="main-content">
                {children}
            </main>
            <Footer />
        </div>
    )
}
