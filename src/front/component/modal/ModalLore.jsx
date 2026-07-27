import React, { useState, useEffect } from 'react'
import { ScrollText } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalLore({ onSuccess, book, selectedLore }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [lore, setLore] = useState(selectedLore || { book_id: book.id })

    const [fieldLore, setFieldLore] = useState([
        { label: 'Titre *', name: 'title', type: 'text', placeholder: 'Nom du lieu, personnage, événement...' },
        { label: 'Catégorie', name: 'category', type: 'text', placeholder: 'Lieu, Magie, Histoire...' },
        { label: 'Contenu', name: 'content', type: 'textarea', rows : 15 },
    ])

    useEffect(() => {
        if (!selectedLore) {
            setLore({ book_id: book.id })
            setFieldLore(prev => prev.map(f => ({ ...f, value: undefined })))
            return
        }
        setLore(selectedLore)
        setFieldLore(prev => prev.map(f => ({ ...f, value: selectedLore[f.name] })))
    }, [selectedLore])

    const handleChange = (e) => {
        setLore(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setFieldLore(prev => prev.map(f =>
            f.name === e.target.name ? { ...f, value: e.target.value } : f
        ))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError('')
        const errorListe = {}

        if (!lore.title) {
            errorListe.all = 'Le titre est obligatoire'
            setError(errorListe)
            return
        }

        const result = selectedLore
            ? await api('lore_entrie:update', { id: selectedLore.id, data: lore })
            : await api('lore_entrie:create', lore)

        if (result.success) {
            onSuccess(result)
        } else {
            errorListe.all = result.message
            setError(errorListe)
        }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>

            {/* icône live */}
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <ScrollText className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>
                    {lore.title || 'Nouvelle entrée'}
                </p>
                {lore.category && (
                    <span className='text-xs bg-primary-200 text-primary-600 px-2 py-0.5 rounded-full'>
                        {lore.category}
                    </span>
                )}
            </div>

            <form className='flex flex-col gap-4'>
                <FormField fields={fieldLore} onChange={handleChange} errors={error} />

                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}

                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    {selectedLore ? 'Modifier' : 'Créer'}
                </button>
            </form>
        </div>
    )
}