import React, { useState, useEffect } from 'react'
import { Book, Lock, Eye, EyeOff } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalBook({ onSuccess, selectedBook }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [book, setBook] = useState(selectedBook || {})

    // protection par mot de passe : isPrivate reflete l'etat actuel (charge depuis selectedBook
    // en edition, ou false a la creation). password/confirmPassword ne sont jamais pre-remplis
    // (le hash n'est jamais renvoye par le back) -- vides = "ne pas changer le mdp existant"
    // en mode edition, ou "mdp obligatoire" si isPrivate est coche a la creation.
    const [isPrivate, setIsPrivate] = useState(!!selectedBook?.is_private)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [fieldBook, setFieldBook] = useState([
        { label: 'Titre *', name: 'title', type: 'text' },
        { label: 'Description', name: 'description', type: 'textarea', rows: 10 },
    ])

    useEffect(() => {
        if (!selectedBook) {
            setBook({})
            setFieldBook(prev => prev.map(f => ({ ...f, value: undefined })))
            setIsPrivate(false)
            setPassword('')
            setConfirmPassword('')
            return
        }
        setBook(selectedBook)
        setFieldBook(prev => prev.map(f => ({ ...f, value: selectedBook[f.name] })))
        setIsPrivate(!!selectedBook.is_private)
        setPassword('')
        setConfirmPassword('')
    }, [selectedBook])

    const handleChange = (e) => {
        setBook(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setFieldBook(prev => prev.map(f =>
            f.name === e.target.name ? { ...f, value: e.target.value } : f
        ))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError('')
        const errorListe = {}

        if (!book.title) {
            errorListe.all = 'Le titre est obligatoire'
            setError(errorListe)
            return
        }

        // si on active (ou garde active) la protection et qu'un nouveau mdp est saisi,
        // il doit etre confirme correctement. En edition, si rien n'est saisi dans les
        // 2 champs, on ne touche pas au mdp existant (cas normal : on modifie juste le titre).
        if (isPrivate && password && password !== confirmPassword) {
            errorListe.all = 'Les deux mots de passe ne correspondent pas.'
            setError(errorListe)
            return
        }
        if (isPrivate && !selectedBook && !password) {
            errorListe.all = 'Un mot de passe est requis pour un livre prive.'
            setError(errorListe)
            return
        }

        const payload = { ...book, is_private: isPrivate }
        if (isPrivate && password) payload.plainPassword = password
        if (!isPrivate) { payload.plainPassword = undefined } // back remet le hash a null

        const result = selectedBook
            ? await api('book:update', { id: selectedBook.id, data: payload })
            : await api('book:createWithChapter', payload)

        if (result.success) {
            onSuccess(result)
        } else {
            errorListe.all = result.message
            setError(errorListe)
        }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <Book className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>
                    {book.title || 'Nouveau livre'}
                </p>
            </div>

            <form className='flex flex-col gap-4'>
                <FormField fields={fieldBook} onChange={handleChange} errors={error} />

                {/* protection par mot de passe : toggle custom (pas un champ FormField standard,
                    car FormField ne gere pas les checkbox/booleens) */}
                <div className='border border-primary-200 rounded-lg p-3 flex flex-col gap-3'>
                    <button
                        type='button'
                        onClick={() => setIsPrivate(prev => !prev)}
                        className='flex items-center justify-between w-full'
                    >
                        <span className='flex items-center gap-2 text-sm font-medium text-primary-700'>
                            <Lock size={16} className={isPrivate ? 'text-primary-500' : 'text-primary-300'} />
                            Rendre ce livre privé (protégé par mot de passe)
                        </span>
                        <span className={`w-10 h-6 rounded-full flex items-center transition-colors px-0.5 ${isPrivate ? 'bg-primary-400 justify-end' : 'bg-primary-200 justify-start'}`}>
                            <span className='w-5 h-5 rounded-full bg-white shadow' />
                        </span>
                    </button>

                    {isPrivate && (
                        <div className='flex flex-col gap-2'>
                            {selectedBook && (
                                <p className='text-xs text-primary-400'>
                                    Laisse les champs vides pour garder le mot de passe actuel.
                                </p>
                            )}
                            <div className='relative'>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={selectedBook ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
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
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder='Confirmer le mot de passe'
                                className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400'
                            />
                        </div>
                    )}
                </div>

                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}

                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    {selectedBook ? 'Modifier' : 'Créer le livre'}
                </button>

                {/* bouton archiver — seulement en mode update */}
                {selectedBook && (
                    <button
                        type='button'
                        onClick={async () => {
                            await api('book:update', { id: selectedBook.id, data: { archived: selectedBook.archived ? 0 : 1 } })
                            onSuccess()
                        }}
                        className={`w-full py-2 rounded-lg border text-sm transition-colors ${selectedBook.archived ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}
                    >
                        {selectedBook.archived ? '📦 Désarchiver' : '📦 Archiver ce livre'}
                    </button>
                )}
            </form>
        </div>
    )
}