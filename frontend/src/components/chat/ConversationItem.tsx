import { Conversation } from '../../types'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

interface Props {
    conversation: Conversation
    isActive: boolean
    onClick: () => void
}

const ConversationItem = ({ conversation, isActive, onClick }: Props) => {
    const isTyping = conversation.isTyping

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 relative ${isActive
                ? 'bg-primary/10 dark:bg-primary/20'
                : 'hover:bg-gray-50 dark:hover:bg-dark-card/60'
                }`}
        >
            {/* Active left accent bar */}
            {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r-full" />
            )}

            <Avatar
                src={conversation.avatar}
                name={conversation.name}
                size="sm"
                isOnline={conversation.isOnline}
            />

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-gray-800 dark:text-white'}`}>
                        {conversation.name}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2 font-medium">
                        {conversation.lastMessageTime}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <p className={`text-xs truncate leading-relaxed ${isTyping
                        ? 'text-primary italic font-medium'
                        : isActive
                            ? 'text-primary/70'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        {isTyping ? '● escribiendo...' : conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                        <Badge count={conversation.unreadCount} className="ml-2 flex-shrink-0" />
                    )}
                </div>
            </div>
        </button>
    )
}

export default ConversationItem
