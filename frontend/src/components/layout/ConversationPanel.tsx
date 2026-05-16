import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import ConversationList from '../chat/ConversationList'
import ContactsView from '../contacts/ContactsView'
import AddContactView from '../contacts/AddContactView'
import EditProfileView from '../profile/EditProfileView'
import { ActiveView } from '../../types'

const ConversationPanel = () => {
    const {
        activeView, setActiveView, searchQuery, setSearchQuery,
        currentUser, openRightPanel,
    } = useAppStore()
    const navigate = useNavigate()

    const handleNavClick = (view: ActiveView) => {
        setActiveView(view)
    }

    // Unused, suppress warning
    void navigate
    void handleNavClick

    return (
        <>
            {/* ── Panel (full-screen on mobile, fixed-width on desktop) ── */}
            <div className="
                w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col h-full
                bg-white dark:bg-dark-sidebar
                border-r border-gray-100 dark:border-gray-800
            ">

                {/* ── Top header (both mobile + desktop) ── */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
                    {currentUser && (
                        <div className="flex items-center gap-2.5 min-w-0">
                            <button
                                onClick={() => openRightPanel(currentUser)}
                                className="rounded-full hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0"
                            >
                                <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" isOnline />
                            </button>
                            <div className="min-w-0">
                                <span className="text-sm font-semibold text-gray-800 dark:text-white truncate block">
                                    {currentUser.name}
                                </span>
                                <span className="text-xs text-green-500 font-medium">En línea</span>
                            </div>
                        </div>
                    )}

                    {/* Add Contact button — shown on chats view */}
                    {activeView === 'chats' && <AddContactButton />}
                </div>

                {/* ── Content based on active view ── */}
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col pb-16 md:pb-0">
                    {activeView === 'contacts' ? (
                        <ContactsView />
                    ) : activeView === 'add-contact' ? (
                        <AddContactView />
                    ) : activeView === 'settings' ? (
                        <EditProfileView />
                    ) : (
                        <>
                            {/* Search */}
                            <div className="px-4 pt-1 pb-3 flex-shrink-0">
                                <div className="flex items-center gap-2 bg-gray-bg dark:bg-dark-card rounded-2xl px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-primary/30">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar chats..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <ConversationList searchQuery={searchQuery} onSelect={() => { }} />
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

// Small "new contact" icon button shown in chats header
const AddContactButton = () => {
    const { setActiveView } = useAppStore()
    return (
        <button
            onClick={() => setActiveView('contacts')}
            title="Contactos"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        </button>
    )
}

export default ConversationPanel
