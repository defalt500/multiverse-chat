import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import ConversationItem from './ConversationItem'

interface Props {
    searchQuery: string
    onSelect?: () => void
}

const ConversationList = ({ searchQuery, onSelect }: Props) => {
    const { conversations, setActiveConversation, activeConversationId } = useAppStore()

    const filtered = conversations.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = (id: string) => {
        setActiveConversation(id)
        onSelect?.()
    }

    const recentAvatars = conversations.slice(0, 10).map(c => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar
    }))

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Recent avatars row */}
            <div className="px-4 pb-3">
                <div className="flex items-start gap-4 overflow-x-auto pb-1 scrollbar-none">
                    {recentAvatars.map((contact) => (
                        <button
                            key={contact.id}
                            onClick={() => handleSelect(contact.id)}
                            className="flex flex-col items-center gap-1 flex-shrink-0 group"
                        >
                            <div className="relative">
                                <Avatar src={contact.avatar} name={contact.name} size="sm" isOnline />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors">
                                {contact.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent section label */}
            <div className="px-4 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recientes</h3>
            </div>

            {/* Conversations */}
            <div className="flex flex-col">
                {filtered.map((conv) => (
                    <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === activeConversationId}
                        onClick={() => handleSelect(conv.id)}
                    />
                ))}
            </div>
        </div>
    )
}

export default ConversationList
