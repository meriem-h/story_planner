import React, { useState } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useApi } from '../../context/ApiContext'

// popup de saisie du mot de passe pour acceder a un livre prive. onUnlocked est appele
// uniquement si le mdp est correct (le parent decide alors de selectionner le livre et de
// retenir son id comme "deverrouille" en memoire, pour ne plus redemander pendant la session).
export default function ModalUnlockBook({ book, onUnlocked, onClose }) {
    const api = useApi()
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!password) return
        setLoading(true)
        setError(null)

        const result = await api('book:verifyPassword', { id: book.id, password })

        setLoading(false)
        if (result.success && result.ok) {
            setPassword('')
            onUnlocked(book)
        } else {
            setError('Mot de passe incorrect.')
        }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <Lock className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>{book.title}</p>
                <p className='text-primary-400 text-sm text-center'>Ce livre est protégé, entre le mot de passe pour y accéder.</p>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <div className='relative'>
                    <input
                        autoFocus
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='Mot de passe'
                        className='w-full px-3 py-2 pr-9 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400'
                    />
                    <button
                        type='button'
                        onClick={() => setShowPassword(prev => !prev)}
                        className='absolute right-2 top-1/2 -translate-y-1/2 text-primary-300 hover:text-primary-500'
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className='flex gap-2'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors text-sm'
                    >
                        Annuler
                    </button>
                    <button
                        type='submit'
                        disabled={loading || !password}
                        className='flex-1 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold text-sm disabled:opacity-50'
                    >
                        {loading ? 'Vérification...' : 'Déverrouiller'}
                    </button>
                </div>
            </form>
        </div>
    )
}