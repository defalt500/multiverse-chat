import { useState } from 'react'

interface AvatarProps {
    src?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    isOnline?: boolean
    className?: string
}

const sizeMap = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
}

const bgColors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500',
    'bg-pink-500', 'bg-amber-500', 'bg-teal-500',
]

const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

const getColor = (name: string) =>
    bgColors[name.charCodeAt(0) % bgColors.length]

const Avatar = ({ src, name = '', size = 'md', isOnline, className = '' }: AvatarProps) => {
    const sizeClass = sizeMap[size]
    const [imgError, setImgError] = useState(false)

    const showImg = Boolean(src) && !imgError

    return (
        <div className={`relative flex-shrink-0 ${className}`}>
            {showImg ? (
                <img
                    src={src}
                    alt={name}
                    className={`${sizeClass} rounded-full object-cover`}
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className={`${sizeClass} ${getColor(name)} rounded-full flex items-center justify-center font-semibold text-white`}>
                    {getInitials(name)}
                </div>
            )}
            {isOnline !== undefined && (
                <span
                    className={`absolute bottom-0 right-0 block rounded-full border-2 border-white dark:border-dark-sidebar transition-colors ${isOnline
                        ? 'bg-green-500 animate-pulse-slow'
                        : 'bg-gray-400'
                        } ${size === 'xs' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
                />
            )}
        </div>
    )
}

export default Avatar
