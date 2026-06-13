import React, { useState, useEffect } from 'react'
import { BookOpenText } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalTome({ onSuccess, book, selectedTome }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [tome, setTome] = useState({ book_id: book.id })

    useEffect(() => {
        if (!selectedTome) {
            setTome({ book_id: book.id })
            return
        }
        setTome(selectedTome)
    }, [selectedTome])

    const handleChange = (e) => {
        setTome(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        if (!tome.title) {
            setError({ all: 'Le titre est obligatoire' })
            return
        }

        const result = selectedTome
            ? await api('tome:update', { id: selectedTome.id, data: tome })
            : await api('tome:createWithChapter', tome)

        if (result.success) {
            onSuccess(result)
        } else {
            setError({ all: result.message })
        }
    }

    const handleDelete = async () => {
        await api('tome:delete', selectedTome.id)
        onSuccess()
    }

    return (
        <div className='p-4 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <BookOpenText className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>
                    {tome.title || 'Nouveau tome'}
                </p>
            </div>
            <form className='flex flex-col gap-4'>
                <FormField
                    fields={[
                        { label: 'Titre *', name: 'title', type: 'text', value: tome.title || '', placeholder: 'ex: Tome 2' },
                        { label: 'Tome *', name: 'number', type: 'number',value: tome.number || '', placeholder: 'ex: 2' },
                        { label: 'Description', name: 'description', type: 'textarea', value: tome.description || '', placeholder: 'Résumé du tome...' },
                    ]}
                    onChange={handleChange}
                    errors={error}
                />
                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}
                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    {selectedTome ? 'Modifier' : 'Créer le tome'}
                </button>

                {selectedTome && (
                    <button
                        type='button'
                        onClick={handleDelete}
                        className='w-full py-2 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 text-sm transition-colors'
                    >
                        🗑️ Supprimer ce tome
                    </button>
                )}
            </form>
        </div>
    )
}