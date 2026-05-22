import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import NotificationBell from '../ui/NotificationBell'
import { ActiveView } from '../../types'

const IconSidebar = () => {
    const { activeView, setActiveView, toggleDarkMode, darkMode, currentUser, openRightPanel, setSidebarOpen, logout } = useAppStore()
    const navigate = useNavigate()

    if (!currentUser) return null

    const navItems: { view: ActiveView; icon: React.ReactNode; label: string }[] = [
        {
            view: 'chats',
            label: 'Chats',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
        },
        {
            view: 'contacts',
            label: 'Contactos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
            ),
        },
        {
            view: 'settings',
            label: 'Ajustes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ]

    const handleNavClick = (view: ActiveView) => {
        setActiveView(view)
        navigate('/chat')
        setSidebarOpen(false)
    }

    const handleAvatarClick = () => {
        openRightPanel(currentUser)
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="w-[60px] flex-shrink-0 bg-white dark:bg-dark-sidebar flex flex-col items-center py-4 gap-2 border-r border-gray-100 dark:border-gray-800">
            {/* Logo */}
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-4 flex-shrink-0 shadow-lg shadow-primary/30">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
                </svg>
            </div>

            {/* Nav Icons */}
            <div className="flex flex-col items-center gap-1 flex-1">
                {navItems.map(({ view, icon, label }) => (
                    <button
                        key={view}
                        title={label}
                        onClick={() => handleNavClick(view)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${activeView === view
                                ? 'bg-primary text-white scale-110 shadow-md shadow-primary/30 ring-2 ring-primary/20'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card hover:scale-105'
                            }`}
                    >
                        {icon}
                    </button>
                ))}

                {/* Notification Bell */}
                <NotificationBell />
            </div>

            {/* Bottom: Dark Mode + Logout + Avatar */}
            <div className="flex flex-col items-center gap-2">
                <button
                    title="Logout"
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>

                <button
                    title="Toggle dark mode"
                    onClick={toggleDarkMode}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                >
                    {darkMode ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                {/* Avatar → opens own profile */}
                <button
                    onClick={handleAvatarClick}
                    title="My Profile"
                    className="rounded-full hover:ring-2 hover:ring-primary/70 ring-offset-2 ring-offset-white dark:ring-offset-dark-sidebar transition-all duration-200"
                >
                    <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" isOnline />
                </button>
            </div>
        </div>
    )
}

export default IconSidebar
