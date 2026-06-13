import React, { useState, useEffect } from 'react'
import { BookOpenText } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalChapter({ onSuccess, book, tome }) {
    const [error, setError] = useState(null)
    const [chapter, setChapter] = useState({ 
        book_id: book.id,
        tome_id: tome?.id || null
    })
    const api = useApi()

    const handleChange = (e) => {
        setChapter(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError('')

        if (!chapter.title) {
            setError({ all: 'Le titre est obligatoire' })
            return
        }

        const result = await api('chapter:create', chapter)
        if (result.success) {
            onSuccess(result)
        } else {
            setError({ all: result.message })
        }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <BookOpenText className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>
                    {chapter.title || 'Nouveau chapitre'}
                </p>
                {tome && (
                    <p className='text-xs text-primary-400'>{tome.title}</p>
                )}
            </div>
            <form className='flex flex-col gap-4'>
                <FormField
                    fields={[{ label: 'Titre *', name: 'title', type: 'text', placeholder: 'Titre du chapitre' }]}
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
                    Créer le chapitre
                </button>
            </form>
        </div>
    )
}