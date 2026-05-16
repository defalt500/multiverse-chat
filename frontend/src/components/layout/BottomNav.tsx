import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { ActiveView } from '../../types'
import NotificationBell from '../ui/NotificationBell'

const BottomNav = () => {
    const {
        activeView,
        setActiveView,
        toggleDarkMode,
        darkMode,
        activeConversationId,
        setActiveConversation,
        setSidebarOpen,
        logout,
    } = useAppStore()
    const navigate = useNavigate()

    // Hide bottom nav entirely when a chat is open on mobile
    if (activeConversationId) return null

    const handleNavClick = (view: ActiveView) => {
        setActiveView(view)
        setActiveConversation(null)
        setSidebarOpen(false)
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems: { view: ActiveView; label: string; icon: React.ReactNode }[] = [
        {
            view: 'chats',
            label: 'Chats',
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
        },
        {
            view: 'contacts',
            label: 'Contactos',
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
            ),
        },
        {
            view: 'settings',
            label: 'Perfil',
            icon: (
                <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bottom-nav-bar">
            <div className="flex items-center justify-around px-1 pt-2 pb-safe">

                {/* Main nav tabs */}
                {navItems.map(({ view, label, icon }) => {
                    const isActive = activeView === view
                    return (
                        <button
                            key={view}
                            onClick={() => handleNavClick(view)}
                            className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : 'bottom-nav-item-inactive'}`}
                            aria-label={label}
                        >
                            <span className={`bottom-nav-icon-wrap ${isActive ? 'bottom-nav-icon-active' : ''}`}>
                                {icon}
                            </span>
                            <span className="bottom-nav-label">{label}</span>
                            {isActive && <span className="bottom-nav-pip" />}
                        </button>
                    )
                })}

                {/* Notification Bell — rendered directly, mobileMode handles its own layout */}
                <NotificationBell mobileMode />

                {/* Dark mode toggle */}
                <button
                    onClick={toggleDarkMode}
                    aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
                    className="bottom-nav-item bottom-nav-item-inactive"
                >
                    <span className="bottom-nav-icon-wrap">
                        {darkMode ? (
                            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </span>
                    <span className="bottom-nav-label">{darkMode ? 'Claro' : 'Oscuro'}</span>
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    aria-label="Cerrar sesión"
                    className="bottom-nav-item bottom-nav-item-inactive hover:!text-red-500 dark:hover:!text-red-400"
                >
                    <span className="bottom-nav-icon-wrap">
                        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </span>
                    <span className="bottom-nav-label">Salir</span>
                </button>
            </div>
        </nav>
    )
}

export default BottomNav
