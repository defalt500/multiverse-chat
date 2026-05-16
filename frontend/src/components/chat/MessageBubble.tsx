import { Message } from '../../types'
import Avatar from '../ui/Avatar'
import { useAppStore } from '../../store/useAppStore'

interface Props {
    message: Message
    highlight?: string
}

/** Single checkmark — sent */
const CheckSent = ({ dim }: { dim: boolean }) => (
    <svg className={`w-3.5 h-3.5 ${dim ? 'text-white/50' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
)

/** Double checkmark — delivered/read */
const CheckDouble = ({ blue, dim }: { blue: boolean; dim: boolean }) => (
    <span className="flex -space-x-1.5">
        <svg className={`w-3.5 h-3.5 ${blue ? 'text-blue-300' : dim ? 'text-white/50' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <svg className={`w-3.5 h-3.5 ${blue ? 'text-blue-300' : dim ? 'text-white/50' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    </span>
)

/** Highlight matching text */
const HighlightText = ({ text, highlight }: { text: string; highlight?: string }) => {
    if (!highlight) return <>{text}</>
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part)
                    ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">{part}</mark>
                    : part
            )}
        </>
    )
}

const MessageBubble = ({ message, highlight }: Props) => {
    const currentUser = useAppStore((s) => s.currentUser)
    if (!currentUser) return null

    const isMine = message.senderId === currentUser.id || message.senderId === 'me'

    const renderStatus = () => {
        if (!isMine) return null
        switch (message.status) {
            case 'read': return <CheckDouble blue dim={false} />
            case 'delivered': return <CheckDouble blue={false} dim={true} />
            default: return <CheckSent dim={true} />
        }
    }

    return (
        <div className={`flex items-end gap-2 animate-fade-slide ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isMine && <Avatar name={message.senderName} size="xs" />}

            <div className={`max-w-[78vw] sm:max-w-sm lg:max-w-md flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-2.5 shadow-sm ${isMine
                        ? 'bg-primary text-white rounded-3xl rounded-br-md shadow-message-out'
                        : 'bg-gray-100 dark:bg-dark-input text-gray-800 dark:text-gray-100 rounded-3xl rounded-bl-md'
                        }`}
                >
                    <p className="text-sm leading-relaxed">
                        <HighlightText text={message.content} highlight={highlight} />
                    </p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                            {message.timestamp}
                        </span>
                        {renderStatus()}
                    </div>
                </div>
                {!isMine && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 px-2">{message.senderName}</span>
                )}
            </div>

            {isMine && <Avatar src={currentUser.avatar} name={currentUser.name} size="xs" />}
        </div>
    )
}

export default MessageBubble
