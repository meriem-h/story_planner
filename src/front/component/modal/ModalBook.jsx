import React, { useState, useEffect } from 'react'
import { Book } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalBook({ onSuccess, selectedBook }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [book, setBook] = useState(selectedBook || {})

    const [fieldBook, setFieldBook] = useState([
        { label: 'Titre *', name: 'title', type: 'text' },
        { label: 'Description', name: 'description', type: 'textarea' },
    ])

    useEffect(() => {
        if (!selectedBook) {
            setBook({})
            setFieldBook(prev => prev.map(f => ({ ...f, value: undefined })))
            return
        }
        setBook(selectedBook)
        setFieldBook(prev => prev.map(f => ({ ...f, value: selectedBook[f.name] })))
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

        const result = selectedBook
            ? await api('book:update', { id: selectedBook.id, data: book })
            : await api('book:createWithChapter', book)

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