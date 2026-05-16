import Avatar from '../ui/Avatar'

interface Props {
    name: string
    avatar?: string
}

const TypingIndicator = ({ name, avatar }: Props) => {
    return (
        <div className="flex items-end gap-2">
            <Avatar src={avatar} name={name} size="xs" />
            <div className="flex flex-col gap-1 items-start">
                <div className="bg-primary text-white px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex items-center gap-1">
                        <span className="text-sm mr-1">escribiendo</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                    </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{name}</span>
            </div>
        </div>
    )
}

export default TypingIndicator
