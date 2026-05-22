import { Message } from '../../types'
import Avatar from '../ui/Avatar'
import { useAppStore } from '../../store/useAppStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface Props {
    message: Message
    highlight?: string
    isAI?: boolean
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

/** Detect if a text contains markdown or LaTeX worth rendering */
const hasMarkdown = (text: string): boolean =>
    /(\*\*|__|`|#{1,6} |\n[-*]\s|\n\d+\.\s|```|\[.+\]\(.+\)|\$[^$]|\$\$)/.test(text)

/** Highlight matching text in plain strings */
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

const MessageBubble = ({ message, highlight, isAI }: Props) => {
    const currentUser = useAppStore((s) => s.currentUser)
    if (!currentUser) return null

    const isMine = message.senderId === currentUser.id || message.senderId === 'me'

    // Render markdown/math for AI messages OR any incoming message with markdown syntax
    const renderRich = !isMine && (isAI || hasMarkdown(message.content))

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
                    {renderRich ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-current
                            [&_*]:text-inherit
                            prose-p:my-1 prose-p:leading-relaxed prose-p:text-sm
                            prose-headings:font-bold prose-headings:my-1.5
                            prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                            prose-strong:font-semibold
                            prose-em:italic
                            prose-ul:my-1 prose-ul:pl-4 prose-li:my-0 prose-li:text-sm
                            prose-ol:my-1 prose-ol:pl-4
                            prose-code:bg-black/10 dark:prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-black/15 dark:prose-pre:bg-black/40 prose-pre:rounded-xl prose-pre:p-3 prose-pre:my-2 prose-pre:text-[11px] prose-pre:overflow-x-auto
                            prose-blockquote:border-l-2 prose-blockquote:border-current prose-blockquote:border-opacity-40 prose-blockquote:pl-3 prose-blockquote:italic prose-blockquote:my-1 prose-blockquote:opacity-70
                            prose-hr:border-current prose-hr:opacity-20 prose-hr:my-2
                            prose-a:text-primary prose-a:underline
                        ">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            <HighlightText text={message.content} highlight={highlight} />
                        </p>
                    )}
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
