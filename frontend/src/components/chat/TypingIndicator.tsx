import Avatar from '../ui/Avatar'

interface Props {
    name: string
    avatar?: string
    isAI?: boolean
}

const TypingIndicator = ({ name, avatar, isAI }: Props) => {
    return (
        <div className="flex items-end gap-2 animate-fade-slide">
            <Avatar src={avatar} name={name} size="xs" />
            <div className="flex flex-col gap-1 items-start">
                <div className={`px-4 py-2.5 rounded-3xl rounded-bl-md shadow-sm flex items-center gap-2 ${isAI
                    ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30 animate-ai-glow'
                    : 'bg-gray-100 dark:bg-dark-input'
                    }`}>
                    {isAI ? (
                        <>
                            {/* Sparkle icon for AI */}
                            <svg className="w-3.5 h-3.5 text-primary flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                            </svg>
                            <span className="text-xs font-medium text-primary">IA pensando</span>
                            <span className="flex items-center gap-0.5 ml-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                            </span>
                        </>
                    ) : (
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">escribiendo</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                        </div>
                    )}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 px-2">{name}</span>
            </div>
        </div>
    )
}

export default TypingIndicator
