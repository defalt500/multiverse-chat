interface BadgeProps {
    count: number
    className?: string
}

const Badge = ({ count, className = '' }: BadgeProps) => {
    if (count <= 0) return null
    return (
        <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-red-500 rounded-full ${className}`}>
            {count > 99 ? '99+' : count}
        </span>
    )
}

export default Badge
