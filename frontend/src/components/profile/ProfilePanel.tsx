import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'

const ProfilePanel = () => {
    const { currentUser } = useAppStore()
    const [aboutOpen, setAboutOpen] = useState(true)
    const [filesOpen, setFilesOpen] = useState(false)

    if (!currentUser) return null

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">My Profile</h2>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center px-4 pb-4">
                <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" />
                <h3 className="mt-3 font-semibold text-lg text-gray-800 dark:text-white">{currentUser.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-500 font-medium">Active</span>
                </div>
            </div>

            {/* Bio */}
            <div className="px-4 pb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed text-center">
                    {currentUser.bio}
                </p>
            </div>

            {/* About Section */}
            <div className="mx-4 mb-3 rounded-xl bg-gray-50 dark:bg-dark-card overflow-hidden">
                <button
                    onClick={() => setAboutOpen(!aboutOpen)}
                    className="w-full flex items-center justify-between px-4 py-3"
                >
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-sm">About</span>
                    </div>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${aboutOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>

                {aboutOpen && (
                    <div className="px-4 pb-4 grid grid-cols-1 gap-3">
                        {[
                            { label: 'Name', value: currentUser.name },
                            { label: 'Email', value: currentUser.email },
                            { label: 'Time', value: '11:40 AM' },
                            { label: 'Location', value: currentUser.location || 'California, USA' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Attached Files */}
            <div className="mx-4 mb-3 rounded-xl bg-gray-50 dark:bg-dark-card overflow-hidden">
                <button
                    onClick={() => setFilesOpen(!filesOpen)}
                    className="w-full flex items-center justify-between px-4 py-3"
                >
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="font-medium text-sm">Attached Files</span>
                    </div>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${filesOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {filesOpen && (
                    <div className="px-4 pb-4 text-sm text-gray-400">No files attached yet.</div>
                )}
            </div>
        </div>
    )
}

export default ProfilePanel
