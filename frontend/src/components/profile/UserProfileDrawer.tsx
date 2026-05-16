import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import { fetchApi } from '../../api'
import { User } from '../../types'

const UserProfileDrawer = () => {
    const { rightPanelUser, closeRightPanel } = useAppStore()
    const [fullUser, setFullUser] = useState<User | null>(null)

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeRightPanel()
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [closeRightPanel])

    // Fetch full profile when panel opens
    useEffect(() => {
        if (!rightPanelUser) { setFullUser(null); return }
        setFullUser(rightPanelUser)
        fetchApi(`/users/${rightPanelUser.id}`)
            .then((res) => { if (res?.user) setFullUser({ ...rightPanelUser, ...res.user }) })
            .catch(() => {/* fallback to partial data already set */ })
    }, [rightPanelUser?.id])

    const user = fullUser || rightPanelUser

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden ${rightPanelUser ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={closeRightPanel}
            />

            {/* Panel */}
            <div
                className={`
                    fixed top-0 right-0 h-full w-full sm:w-80 z-40 bg-white dark:bg-dark-sidebar shadow-2xl
                    flex flex-col transition-transform duration-300 ease-in-out
                    md:relative md:z-auto md:shadow-none md:border-l md:border-gray-100 md:dark:border-gray-800
                    ${rightPanelUser ? 'translate-x-0' : 'translate-x-full md:hidden'}
                `}
            >
                {user && (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                            <h2 className="text-base font-semibold text-gray-800 dark:text-white">Perfil</h2>
                            <button
                                onClick={closeRightPanel}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                                title="Close"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Avatar + Name */}
                            <div className="flex flex-col items-center px-5 pt-7 pb-5">
                                <Avatar src={user.avatar} name={user.name} size="xl" />
                                <h3 className="mt-4 text-lg font-bold text-gray-800 dark:text-white text-center">
                                    {user.nickname || user.name}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : user.status === 'away' ? 'bg-amber-400' : 'bg-gray-400'}`} />
                                    <span className={`text-sm font-medium capitalize ${user.status === 'online' ? 'text-green-500' : user.status === 'away' ? 'text-amber-400' : 'text-gray-400'}`}>
                                        {user.status === 'online' ? 'En línea' : user.status === 'away' ? 'Ausente' : 'Desconectado'}
                                    </span>
                                </div>
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <div className="mx-4 mb-4 p-4 bg-gray-50 dark:bg-dark-card rounded-2xl">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed text-center italic">
                                        "{user.bio}"
                                    </p>
                                </div>
                            )}

                            {/* Info Cards */}
                            <div className="mx-4 mb-4 rounded-2xl bg-gray-50 dark:bg-dark-card overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Acerca de</p>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {[
                                        {
                                            icon: (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            ),
                                            label: 'Nombre',
                                            value: user.name,
                                        },
                                        {
                                            icon: (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            ),
                                            label: 'Correo',
                                            value: user.email || '—',
                                        },
                                        ...(user.phone
                                            ? [{
                                                icon: (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                ),
                                                label: 'Teléfono',
                                                value: user.phone,
                                            }]
                                            : []),
                                    ].map(({ icon, label, value }) => (
                                        <div key={label} className="flex items-center gap-3 px-4 py-3">
                                            <span className="text-gray-400 flex-shrink-0">{icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default UserProfileDrawer
