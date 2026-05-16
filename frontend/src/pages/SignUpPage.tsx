import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const SignUpPage = () => {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        // Simulate sign up
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center px-4 py-8">
            {/* Logo + Title */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
                    </svg>
                </div>
                <span className="text-xl font-bold text-gray-800">Multiverse Chat</span>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Registrarse</h1>
                <p className="text-gray-500 mt-1 text-sm">Crear una nueva cuenta</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/60 p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de usuario</label>
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                            <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="flex-1 px-3 py-2.5 text-sm text-gray-700 outline-none bg-transparent"
                                placeholder="Ingresa tu nombre de usuario"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                            <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 px-3 py-2.5 text-sm text-gray-700 outline-none bg-transparent"
                                placeholder="Ingresa tu correo"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                            <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex-1 px-3 py-2.5 text-sm text-gray-700 outline-none bg-transparent"
                                placeholder="Ingresa tu contraseña"
                                required
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar Contraseña</label>
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                            <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="flex-1 px-3 py-2.5 text-sm text-gray-700 outline-none bg-transparent"
                                placeholder="Confirma tu contraseña"
                                required
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full py-2.5 mt-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-sm shadow-md shadow-primary/20"
                    >
                        Crear Cuenta
                    </button>
                </form>
            </div>

            <p className="mt-6 text-sm text-gray-500">
                ¿Ya tienes una cuenta?{' '}
                <button onClick={() => navigate('/login')} className="text-primary font-medium hover:underline">Inicia sesión ahora</button>
            </p>
            <p className="mt-4 text-xs text-gray-400">© 2026 Multiverse Chat</p>
        </div>
    )
}

export default SignUpPage
