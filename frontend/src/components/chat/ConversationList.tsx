import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import ConversationItem from './ConversationItem'

interface Props {
    searchQuery: string
    onSelect?: () => void
}

const ConversationList = ({ searchQuery, onSelect }: Props) => {
    const { conversations, setActiveConversation, activeConversationId } = useAppStore()

    // Sort by lastAt (epoch ms, set when a message arrives/is sent) — most recent first.
    // Fall back to index order (server order) for conversations that haven't had any new activity.
    const sorted = [...conversations].sort((a, b) => {
        const ta = a.lastAt ?? 0
        const tb = b.lastAt ?? 0
        if (ta === tb) return 0   // preserve original server order
        return tb - ta            // bigger epoch = more recent = first
    })

    const filtered = sorted.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = (id: string) => {
        setActiveConversation(id)
        onSelect?.()
    }

    const recentAvatars = sorted.slice(0, 10).map(c => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar
    }))

    // Track the top conversation to trigger float-up animation when it changes
    const prevTopRef = useRef<string | null>(null)
    const topId = filtered[0]?.id ?? null
    const justMoved = topId !== null && prevTopRef.current !== null && topId !== prevTopRef.current
    useEffect(() => {
        prevTopRef.current = topId
    }, [topId])

    return (
        <div className="flex-1 min-h-0 overflow-y-auto">
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
                            <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors truncate max-w-[56px]">
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

            {/* Conversations keyed so React correctly reorders DOM */}
            <div className="flex flex-col">
                {filtered.map((conv, idx) => (
                    <div
                        key={conv.id}
                        className={idx === 0 && justMoved ? 'animate-conv-float' : undefined}
                    >
                        <ConversationItem
                            conversation={conv}
                            isActive={conv.id === activeConversationId}
                            onClick={() => handleSelect(conv.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ConversationList
