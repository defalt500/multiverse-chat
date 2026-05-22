import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchApi } from '../api'
import { useAppStore } from '../store/useAppStore'
import { User } from '../types'
import { Shield, Users, Bot, MessageSquare, Menu, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, Database, RefreshCw, RotateCcw, Clock, Archive } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface AiCharacter {
    id: string
    name: string
    personality: string
    systemPrompt: string
    avatarUrl: string
}

interface BackupMetadata {
    id: string
    type: 'full' | 'users' | 'conversations' | 'contactRequests' | 'aiCharacters'
    triggeredBy: string
    timestamp: string
    filePath: string
    stats: Record<string, number>
}

type Section = 'users' | 'ai' | 'backups'

// ── Modal: Edit User ─────────────────────────────────────────────────────────
function EditUserModal({
    user,
    onClose,
    onSaved,
}: {
    user: User
    onClose: () => void
    onSaved: (updated: User) => void
}) {
    const [username, setUsername] = useState(user.name)
    const [bio, setBio] = useState(user.bio || '')
    const [photoUrl, setPhotoUrl] = useState(user.avatar || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const res = await fetchApi(`/users/admin/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({ username, bio, profilePhotoUrl: photoUrl }),
            })
            if (res?.user) {
                onSaved(res.user)
                onClose()
            }
        } catch (e: any) {
            setError(e.message || 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#11131a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-md p-6 animate-slide-up relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Editar Usuario</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1.5">Nombre de usuario</label>
                        <input
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1.5">Biografía</label>
                        <textarea
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1.5">URL de foto</label>
                        <input
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/25"
                    >
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Modal: Edit AI Character ──────────────────────────────────────────────────
function EditAiModal({
    char,
    onClose,
    onSaved,
}: {
    char: AiCharacter | null
    onClose: () => void
    onSaved: (c: AiCharacter) => void
}) {
    const [name, setName] = useState(char?.name || '')
    const [personality, setPersonality] = useState(char?.personality || '')
    const [systemPrompt, setSystemPrompt] = useState(char?.systemPrompt || '')
    const [avatarUrl, setAvatarUrl] = useState(char?.avatarUrl || '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isCreate = !char

    const handleSave = async () => {
        if (!name || !systemPrompt) { setError('El nombre y el prompt del sistema son obligatorios'); return }
        setSaving(true)
        setError(null)
        try {
            const url = isCreate ? '/ai/characters' : `/ai/characters/${char.id}`
            const method = isCreate ? 'POST' : 'PUT'
            const res = await fetchApi(url, {
                method,
                body: JSON.stringify({ name, personality, systemPrompt, avatarUrl }),
            })
            if (res?.character) {
                onSaved({ ...res.character, id: res.character.characterId || res.character.id })
                onClose()
            }
        } catch (e: any) {
            setError(e.message || 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#11131a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-lg p-6 animate-slide-up relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {isCreate ? 'Nuevo Bot de IA' : 'Editar Bot de IA'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1.5">Nombre</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1.5">Tema / Personalidad</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" value={personality} onChange={(e) => setPersonality(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1.5">Prompt del Sistema</label>
                        <textarea rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase mb-1.5">Avatar URL (Opcional)</label>
                        <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/25">
                        {saving ? 'Guardando…' : isCreate ? 'Crear Bot' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Admin Dashboard Page ──────────────────────────────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate()
    const currentUser = useAppStore((s) => s.currentUser)
    const [section, setSection] = useState<Section>('users')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Users state
    const [users, setUsers] = useState<User[]>([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalUsers, setTotalUsers] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    // AI state
    const [characters, setCharacters] = useState<AiCharacter[]>([])
    const [aiLoading, setAiLoading] = useState(true)
    const [editingAi, setEditingAi] = useState<AiCharacter | null | 'new'>('new' as any)
    const [aiModal, setAiModal] = useState(false)

    // Backup state
    const [backups, setBackups] = useState<BackupMetadata[]>([])
    const [backupsLoading, setBackupsLoading] = useState(false)
    const [backupRunning, setBackupRunning] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)
    const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        setUsersLoading(true)
        fetchApi(`/users/all?page=${page}&limit=${limit}`).then((res) => {
            if (res?.users) {
                setUsers(res.users)
                setTotalUsers(res.total || 0)
                setTotalPages(res.totalPages || Math.ceil((res.total || 0) / limit))
            }
        }).finally(() => setUsersLoading(false))
    }, [page, limit])

    useEffect(() => {
        fetchApi('/ai/characters').then((res) => {
            if (res?.characters) setCharacters(res.characters)
        }).finally(() => setAiLoading(false))
    }, [])

    // Load backups when section is active
    useEffect(() => {
        if (section !== 'backups') return
        setBackupsLoading(true)
        fetchApi('/backups').then((res) => {
            if (res?.backups) setBackups(res.backups)
        }).catch(() => setBackupMessage({ type: 'error', text: 'Error al cargar backups' }))
            .finally(() => setBackupsLoading(false))
    }, [section])

    const handleManualBackup = async () => {
        setBackupRunning(true)
        setBackupMessage(null)
        try {
            const res = await fetchApi('/backups', { method: 'POST' })
            if (res?.backup) {
                setBackups((prev) => [res.backup, ...prev])
                setBackupMessage({ type: 'success', text: `✅ Backup creado: ${new Date(res.backup.timestamp).toLocaleString()}` })
            }
        } catch (e: any) {
            setBackupMessage({ type: 'error', text: 'Error al crear backup: ' + (e.message || 'Error desconocido') })
        } finally {
            setBackupRunning(false)
        }
    }

    const handleRestore = async (backupId: string) => {
        const confirmed = window.confirm('¿Restaurar este backup? Los datos existentes se actualizarán con los valores del respaldo.')
        if (!confirmed) return
        setRestoringId(backupId)
        setBackupMessage(null)
        try {
            const res = await fetchApi(`/backups/${encodeURIComponent(backupId)}/restore`, { method: 'POST' })
            setBackupMessage({ type: 'success', text: `✅ Restaurado correctamente. ${res?.restored ?? 0} documentos escritos.` })
        } catch (e: any) {
            setBackupMessage({ type: 'error', text: 'Error al restaurar: ' + (e.message || 'Error desconocido') })
        } finally {
            setRestoringId(null)
        }
    }

    const handleDeleteBackup = async (backupId: string) => {
        if (!window.confirm('¿Eliminar este archivo de backup? No se podrá recuperar.')) return
        try {
            await fetchApi(`/backups/${encodeURIComponent(backupId)}`, { method: 'DELETE' })
            setBackups((prev) => prev.filter((b) => b.id !== backupId))
            setBackupMessage({ type: 'success', text: '🗑️ Backup eliminado correctamente.' })
        } catch (e: any) {
            setBackupMessage({ type: 'error', text: 'Error al eliminar backup.' })
        }
    }

    const handleDeleteUser = async (uid: string) => {
        if (!window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
        await fetchApi(`/users/admin/${uid}`, { method: 'DELETE' })
        setUsers((prev) => prev.filter((u) => u.id !== uid))
    }

    const handleDeleteAi = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este bot de IA?')) return
        await fetchApi(`/ai/characters/${id}`, { method: 'DELETE' })
        setCharacters((prev) => prev.filter((c) => c.id !== id))
    }

    const handleUserSaved = (updated: User) => {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    }

    const handleAiSaved = (saved: AiCharacter) => {
        setCharacters((prev) => {
            const exists = prev.find((c) => c.id === saved.id)
            return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev]
        })
    }

    const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
        { key: 'users', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
        { key: 'ai', label: 'Bots de IA', icon: <Bot className="w-5 h-5" /> },
        { key: 'backups', label: 'Respaldos', icon: <Database className="w-5 h-5" /> },
    ]

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0f] text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            {/* ── Sidebar ── */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#11131a] shadow-2xl flex flex-col border-r border-gray-100 dark:border-white/5
                    transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:relative lg:translate-x-0
                `}
            >
                {/* Logo Area */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-white/5">
                    <div className="w-9 h-9 bg-gradient-to-tr from-primary to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Panel Admin</span>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = section === item.key
                        return (
                            <button
                                key={item.key}
                                onClick={() => { setSection(item.key); setSidebarOpen(false) }}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}
                                `}
                            >
                                <span className={`${isActive ? 'text-primary' : 'text-gray-400'}`}>{item.icon}</span>
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={() => navigate('/chat')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span>Volver al Chat</span>
                    </button>
                </div>
            </aside>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#11131a]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </button>
                        <h1 className="text-xl font-bold tracking-tight">
                            {section === 'users' ? 'Gestión de Usuarios' : section === 'ai' ? 'Bots de Inteligencia Artificial' : 'Respaldos del Sistema'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status badge hidden on mobile */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-500/20">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Sistema Activo
                        </div>

                        <div className="h-8 w-px bg-gray-200 dark:bg-white/10 hidden md:block"></div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none mb-1">{currentUser?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-none">{currentUser?.role || 'Admin'}</p>
                            </div>
                            <div className="relative">
                                <img
                                    src={currentUser?.avatar || `https://ui-avatars.com/api/?name=Admin`}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-md"
                                />
                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 w-full max-w-7xl mx-auto custom-scrollbar">

                    {/* ── USERS Section ── */}
                    {section === 'users' && (
                        <div className="animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Usuarios de la plataforma</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Mostrando <span className="font-semibold text-gray-800 dark:text-gray-200">{users.length}</span> de <span className="font-semibold text-gray-800 dark:text-gray-200">{totalUsers}</span> usuarios registrados.
                                    </p>
                                </div>
                            </div>

                            {usersLoading ? (
                                <div className="flex justify-center items-center py-32">
                                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block bg-white dark:bg-[#11131a] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50/50 dark:bg-black/20 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4">Usuario</th>
                                                        <th className="px-6 py-4">Correo</th>
                                                        <th className="px-6 py-4">Rol</th>
                                                        <th className="px-6 py-4 text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {users.map((u) => (
                                                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <img src={u.avatar} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" />
                                                                    <div>
                                                                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">{u.name}</p>
                                                                        {u.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">{u.bio}</p>}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                                <span className="flex items-center gap-2">
                                                                    {u.email}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin'
                                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                                                                    }`}>
                                                                    {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => setEditingUser(u)}
                                                                        className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                                        title="Editar"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteUser(u.id)}
                                                                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Mobile Cards View */}
                                    <div className="md:hidden grid gap-4">
                                        {users.map((u) => (
                                            <div key={u.id} className="bg-white dark:bg-[#11131a] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={u.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-white/10" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{u.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rol asignado</span>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                                                        }`}>
                                                        {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                                    <button onClick={() => setEditingUser(u)} className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                                        <Edit2 className="w-4 h-4" /> Editar
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                                                        <Trash2 className="w-4 h-4" /> Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 0 && (
                                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#11131a] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Usuarios por página:</span>
                                                <select
                                                    value={limit}
                                                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
                                                    className="bg-gray-50 dark:bg-black/20 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 cursor-pointer focus:outline-none focus:border-primary/50 transition-colors"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={15}>15</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    disabled={page === 1}
                                                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                                </button>
                                                <div className="hidden sm:flex items-center gap-1">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setPage(p)}
                                                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${page === p ? 'bg-primary text-white shadow-md shadow-primary/25' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="sm:hidden text-sm text-gray-600 dark:text-gray-400 font-medium px-2">
                                                    Página {page} de {totalPages}
                                                </div>
                                                <button
                                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={page === totalPages}
                                                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    Siguiente <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── AI BOTS Section ── */}
                    {section === 'ai' && (
                        <div className="animate-fade-in">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Asistentes Virtuales</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Gestiona tus <span className="font-semibold text-gray-800 dark:text-gray-200">{characters.length}</span> bots personalizados.
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setEditingAi(null); setAiModal(true) }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Crear Nuevo Bot</span>
                                </button>
                            </div>

                            {aiLoading ? (
                                <div className="flex justify-center items-center py-32">
                                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {characters.map((c) => (
                                        <div key={c.id} className="group bg-white dark:bg-[#11131a] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary/40 transition-all flex flex-col h-full hover:shadow-xl hover:shadow-primary/5">
                                            <div className="flex items-start gap-4 mb-4">
                                                <img src={c.avatarUrl} className="w-14 h-14 rounded-2xl object-cover bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex-shrink-0" />
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-base truncate group-hover:text-primary transition-colors">{c.name}</h3>
                                                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary dark:bg-primary/20 border border-primary/20">
                                                        {c.personality}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-1 mb-6">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 bg-gray-50/50 dark:bg-black/20 rounded-xl p-3 border border-gray-100 dark:border-white/5 leading-relaxed">
                                                    {c.systemPrompt}
                                                </p>
                                            </div>

                                            <div className="flex gap-3 mt-auto border-t border-gray-100 dark:border-white/5 pt-4">
                                                <button
                                                    onClick={() => { setEditingAi(c); setAiModal(true) }}
                                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors border border-transparent hover:border-primary/50"
                                                >
                                                    <Edit2 className="w-4 h-4" /> Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAi(c.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-xl bg-red-50 dark:bg-red-500/5 text-red-600 hover:bg-red-500 hover:text-white transition-colors border border-transparent hover:border-red-500/50"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── BACKUPS Section ── */}
                    {section === 'backups' && (
                        <div className="animate-fade-in">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Respaldos del Sistema</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {backups.length > 0
                                            ? <span>Último respaldo: <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(backups[0].timestamp).toLocaleString('es-MX')}</span></span>
                                            : 'No hay respaldos aún. Crea uno manualmente o espera el automático (cada 6 hrs).'}
                                    </p>
                                </div>
                                <button
                                    id="btn-crear-backup"
                                    onClick={handleManualBackup}
                                    disabled={backupRunning}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {backupRunning
                                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creando…</>
                                        : <><Archive className="w-5 h-5" /> Crear Backup Ahora</>}
                                </button>
                            </div>

                            {/* Feedback message */}
                            {backupMessage && (
                                <div className={`mb-5 p-4 rounded-xl border text-sm font-medium ${backupMessage.type === 'success'
                                        ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'
                                        : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                                    }`}>
                                    {backupMessage.text}
                                </div>
                            )}

                            {/* Stats row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: 'Total Backups', value: backups.length, icon: <Database className="w-5 h-5" /> },
                                    { label: 'Backups Completos', value: backups.filter(b => b.type === 'full').length, icon: <Archive className="w-5 h-5" /> },
                                    { label: 'Automáticos', value: backups.filter(b => b.triggeredBy.includes('scheduler')).length, icon: <Clock className="w-5 h-5" /> },
                                    { label: 'Pre-eliminación', value: backups.filter(b => b.triggeredBy.includes('pre-delete')).length, icon: <RotateCcw className="w-5 h-5" /> },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white dark:bg-[#11131a] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center gap-2 text-gray-400 mb-2">{stat.icon}<span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</span></div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Backup list */}
                            {backupsLoading ? (
                                <div className="flex justify-center items-center py-32">
                                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : backups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-400 dark:text-gray-600">
                                    <Database className="w-16 h-16 opacity-30" />
                                    <p className="text-lg font-medium">No hay respaldos disponibles</p>
                                    <p className="text-sm">Los backups automáticos se crean cada 6 horas.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {backups.map((b) => {
                                        const isRestoring = restoringId === b.id
                                        const typeLabels: Record<string, string> = {
                                            full: 'Completo', users: 'Usuarios', conversations: 'Conversaciones',
                                            contactRequests: 'Contactos', aiCharacters: 'Bots IA'
                                        }
                                        const triggerLabel = b.triggeredBy.includes('scheduler') ? 'Automático'
                                            : b.triggeredBy.includes('pre-delete-user') ? 'Pre-eliminación usuario'
                                                : b.triggeredBy.includes('pre-delete-conv') ? 'Pre-eliminación conversación'
                                                    : 'Manual (Admin)'
                                        const totalDocs = Object.values(b.stats).reduce((s, n) => s + n, 0)

                                        return (
                                            <div key={b.id} className="group bg-white dark:bg-[#11131a] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm hover:border-primary/30 dark:hover:border-primary/40 transition-all">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    {/* Left: info */}
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                            <Database className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${b.type === 'full'
                                                                        ? 'bg-primary/10 text-primary dark:bg-primary/20 border border-primary/20'
                                                                        : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                                                                    }`}>{typeLabels[b.type] || b.type}</span>
                                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                                                    {triggerLabel}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                {new Date(b.timestamp).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                {totalDocs} documento{totalDocs !== 1 ? 's' : ''} respaldado{totalDocs !== 1 ? 's' : ''}
                                                                {Object.entries(b.stats).map(([col, count]) =>
                                                                    <span key={col} className="ml-2 font-medium">{col}: {count}</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Right: actions */}
                                                    <div className="flex gap-2 sm:flex-shrink-0">
                                                        <button
                                                            id={`btn-restore-${b.id.replace(/[^a-z0-9]/gi, '-')}`}
                                                            onClick={() => handleRestore(b.id)}
                                                            disabled={isRestoring || backupRunning}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isRestoring
                                                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Restaurando…</>
                                                                : <><RotateCcw className="w-4 h-4" /> Restaurar</>}
                                                        </button>
                                                        <button
                                                            id={`btn-delete-backup-${b.id.replace(/[^a-z0-9]/gi, '-')}`}
                                                            onClick={() => handleDeleteBackup(b.id)}
                                                            disabled={isRestoring}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-50 dark:bg-red-500/5 text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/10 transition-colors disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* ── Modals ── */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSaved={handleUserSaved}
                />
            )}

            {aiModal && (
                <EditAiModal
                    char={editingAi as AiCharacter | null}
                    onClose={() => { setAiModal(false); setEditingAi(null) }}
                    onSaved={handleAiSaved}
                />
            )}
        </div>
    )
}

export default AdminDashboard
