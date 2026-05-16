import { useState, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import { fetchApi } from '../../api'

/** Resize an image File to max 400×400px and return as base64 JPEG data URL */
function resizeImageToBase64(file: File, maxSize = 400, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(url)
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
            const w = Math.round(img.width * scale)
            const h = Math.round(img.height * scale)
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, w, h)
            resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al cargar la imagen')) }
        img.src = url
    })
}

const EditProfileView = () => {
    const { currentUser, updateCurrentUser } = useAppStore()

    const [nickname, setNickname] = useState(currentUser?.nickname || currentUser?.name || '')
    const [bio, setBio] = useState(currentUser?.bio || '')
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!currentUser) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSelectedFile(file)
        const reader = new FileReader()
        reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            let profilePhotoUrl: string | undefined

            if (selectedFile) {
                // Resize + compress client-side, send as base64 — no Storage bucket required
                profilePhotoUrl = await resizeImageToBase64(selectedFile)
            }

            const body: Record<string, string> = { username: nickname, bio }
            if (profilePhotoUrl) body.profilePhotoUrl = profilePhotoUrl

            const res = await fetchApi('/users/me', {
                method: 'PUT',
                body: JSON.stringify(body),
            })
            const updated = res?.user
                ? res.user
                : { nickname, bio, ...(profilePhotoUrl ? { avatar: profilePhotoUrl } : {}) }
            updateCurrentUser(updated)
            setSelectedFile(null)
            setPreviewUrl(null)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err: any) {
            setError(err.message || 'Error al guardar los cambios')
        } finally {
            setSaving(false)
        }
    }

    const displayAvatar = previewUrl || currentUser.avatar

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Editar Perfil</h2>
                <p className="text-sm text-gray-400 mt-0.5">Actualiza tu información personal</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
                {/* Avatar preview + upload button */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar src={displayAvatar} name={currentUser.name} size="xl" isOnline />
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                    >
                        {selectedFile ? `Seleccionado: ${selectedFile.name}` : 'Elegir foto del dispositivo'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Read-only name */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gray-bg dark:bg-dark-card opacity-60 cursor-not-allowed">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{currentUser.name}</span>
                    </div>
                </div>

                {/* Display Name / Nickname */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre a mostrar</label>
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-primary bg-gray-bg dark:bg-dark-card transition-colors">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ingresa tu nombre a mostrar"
                            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
                        />
                    </div>
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Biografía</label>
                    <div className="rounded-xl px-4 py-3 border-2 border-transparent focus-within:border-primary bg-gray-bg dark:bg-dark-card transition-colors">
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Escribe algo sobre ti..."
                            rows={3}
                            maxLength={150}
                            className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none resize-none"
                        />
                    </div>
                    <p className="text-xs text-gray-400 text-right">{bio.length}/150</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center justify-center gap-2 w-full py-3 font-medium rounded-xl transition-all disabled:opacity-60 ${saved
                        ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                        : 'bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/25'
                        }`}
                >
                    {saving ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Guardando...
                        </>
                    ) : saved ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            ¡Guardado!
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default EditProfileView
