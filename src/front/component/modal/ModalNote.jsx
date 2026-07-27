import React, { useState, useEffect } from 'react'
import { NotebookPen, Pin } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalNote({ onSuccess, book, selectedNote }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [note, setNote] = useState(selectedNote || { book_id: book.id })

    const [fieldTitle] = useState([
        { label: 'Titre', name: 'title', type: 'text', placeholder: 'Titre de la note' },
    ])

    const [fieldContent] = useState([
        { label: 'Contenu *', name: 'content', type: 'textarea', rows: 20 },
    ])

    const [titleField, setTitleField] = useState(fieldTitle)
    const [contentField, setContentField] = useState(fieldContent)

    useEffect(() => {
        if (!selectedNote) {
            setNote({ book_id: book.id })
            setTitleField(prev => prev.map(f => ({ ...f, value: undefined })))
            setContentField(prev => prev.map(f => ({ ...f, value: undefined })))
            return
        }
        setNote(selectedNote)
        setTitleField(prev => prev.map(f => ({ ...f, value: selectedNote[f.name] })))
        setContentField(prev => prev.map(f => ({ ...f, value: selectedNote[f.name] })))
    }, [selectedNote])

    const handleChange = (e) => {
        setNote(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setTitleField(prev => prev.map(f =>
            f.name === e.target.name ? { ...f, value: e.target.value } : f
        ))
        setContentField(prev => prev.map(f =>
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
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <NotebookPen className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>
                    {note.title || 'Nouvelle note'}
                </p>
            </div>

            <form className='flex flex-col gap-4'>

                {/* deux colonnes */}
                <div className='flex gap-4 items-start'>

                    {/* colonne gauche : titre + post-it */}
                    <div className='flex flex-col gap-4 w-1/3'>
                        <FormField fields={titleField} onChange={handleChange} errors={error} />

                        <button
                            type="button"
                            onClick={() => setNote(prev => ({ ...prev, is_postit: prev.is_postit ? 0 : 1 }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${note.is_postit ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-400 hover:bg-primary-200'}`}
                        >
                            <Pin size={14} />
                            {note.is_postit ? 'Post-it activé' : 'Ajouter en post-it'}
                        </button>
                    </div>

                    {/* colonne droite : contenu */}
                    <div className='flex-1'>
                        <FormField fields={contentField} onChange={handleChange} errors={error} />
                    </div>

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
                    {selectedNote ? 'Modifier' : 'Créer'}
                </button>
            </form>
        </div>
    )
}