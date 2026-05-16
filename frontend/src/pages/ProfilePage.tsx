import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import IconSidebar from '../components/layout/IconSidebar'
import ConversationPanel from '../components/layout/ConversationPanel'
import ChatWindow from '../components/layout/ChatWindow'
import { useAppStore } from '../store/useAppStore'

const ProfilePage = () => {
    const { setActiveView } = useAppStore()
    const navigate = useNavigate()

    useEffect(() => {
        setActiveView('profile')
    }, [setActiveView])

    const handleBackToChat = () => {
        setActiveView('chats')
        navigate('/chat')
    }

    return (
        <div className="h-screen flex overflow-hidden bg-gray-bg dark:bg-dark-panel">
            <IconSidebar />
            <ConversationPanel />
            <ChatWindow />
            {/* Back button overlay */}
            <button
                onClick={handleBackToChat}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors text-sm font-medium"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a los chats
            </button>
        </div>
    )
}

export default ProfilePage
