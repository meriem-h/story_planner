import React, { useState, useEffect } from 'react'
import { NotebookPen } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalNote({ onSuccess, book, selectedNote }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [note, setNote] = useState(selectedNote || { book_id: book.id })

    const [fieldNote, setFieldNote] = useState([
        { label: 'Titre', name: 'title', type: 'text', placeholder: 'Titre de la note' },
        { label: 'Contenu *', name: 'content', type: 'textarea' },
    ])

    useEffect(() => {
        if (!selectedNote) {
            setNote({ book_id: book.id })
            setFieldNote(prev => prev.map(f => ({ ...f, value: undefined })))
            return
        }
        setNote(selectedNote)
        setFieldNote(prev => prev.map(f => ({ ...f, value: selectedNote[f.name] })))
    }, [selectedNote])

    const handleChange = (e) => {
        setNote(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setFieldNote(prev => prev.map(f =>
            f.name === e.target.name ? { ...f, value: e.target.value } : f
        ))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError('')
        const errorListe = {}

        if (!note.content) {
            errorListe.all = 'Le contenu est obligatoire'
            setError(errorListe)
            return
        }

        const result = selectedNote
            ? await api('note:update', { id: selectedNote.id, data: note })
            : await api('note:create', note)

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
                <div className='w-16 h-16 rounded-2xl bg-orange-300 flex items-center justify-center'>
                    <NotebookPen className='text-white' size={32} />
                </div>
                <p className='text-orange-800 font-bold text-lg'>
                    {note.title || 'Nouvelle note'}
                </p>
            </div>

            <form className='flex flex-col gap-4'>
                <FormField fields={fieldNote} onChange={handleChange} errors={error} />

                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}

                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-orange-300 hover:bg-orange-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    {selectedNote ? 'Modifier' : 'Créer'}
                </button>
            </form>
        </div>
    )
}