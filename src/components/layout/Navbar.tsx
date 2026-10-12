import { NavLink } from "react-router-dom";

function Navbar() {
    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <p className="text-xl font-bold text-blue-600">App</p>
                    <ul className="hidden md:flex items-center space-x-8">
                        <li className="text-gray-700 hover:text-blue-600 font-medium">
                            <NavLink to="/">Home</NavLink>
                        </li>
                        <li className="text-gray-700 hover:text-blue-600 font-medium">
                            <NavLink to="/scraping">Scraping</NavLink>
                        </li>
                        <li className="text-gray-700 hover:text-blue-600 font-medium">
                            <NavLink to="/scan">Scan</NavLink>
                        </li>
                    </ul>
                    <button id="menu-btn" className="md:hidden text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>

    )
}

export default Navbar;