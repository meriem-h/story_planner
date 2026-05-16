import React, { useState, useEffect } from 'react'

import { BookOpenText, KeyRound, Mail, Gem, chapter } from 'lucide-react'

import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalChapter({ onSuccess, book }) {

    const [error, setError] = useState(null)
    const [chapter, setChapter] = useState({ book_id: book.id })

    const api = useApi()


    const fieldBook = [
        { name: 'title', type: 'text' },
    ]

    const handleChange = (e) => {

        setChapter(prev => ({ ...prev, [e.target.name]: e.target.value }))

    }




    const handleClick = async (e) => {

        e.preventDefault()
        setError('')


        const errorListe = {}
        const missingFields = []

        if (!chapter.title) missingFields.push('title')

        const result = await api('chapter:create', chapter)



        if (result.success) {
            onSuccess(result)
        } else {
            errorListe[result.type] = result.message
        }

        if (Object.keys(errorListe).length > 0) {
            setError(errorListe)
            return
        }

    }



    return (
        <div className='p-4 flex flex-col gap-6'>

            {/* icône chapitre live */}
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-orange-300 flex items-center justify-center'>
                    <BookOpenText className='text-white' size={32} />
                </div>
                <p className='text-orange-800 font-bold text-lg'>
                    {chapter.title || 'Nouveau chapitre'}
                </p>
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
                    className='w-full py-3 bg-orange-300 hover:bg-orange-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    Créer le chapitre
                </button>
            </form>

        </div>
    )


}