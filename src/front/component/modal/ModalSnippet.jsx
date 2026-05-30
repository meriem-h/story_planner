import React, { useState, useEffect } from 'react'
import { Lightbulb, Pin } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

const TYPE_LABELS = {
    dialogue: 'Dialogue',
    scene: 'Scène',
    description: 'Description',
    flashback: 'Flashback',
    idee: 'Idée',
    citation: 'Citation',
    note_auteur: 'Note auteur',
    transition: 'Transition',
    autre: 'Autre',
}

export default function ModalSnippet({ onSuccess, book, tome, selectedSnippet }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [snippet, setSnippet] = useState(
        selectedSnippet || { 
            book_id: book.id, 
            tome_id: tome?.id || null,
            type: 'autre', 
            pinned: 0, 
            used: 'disponible' 
        }
    )

    const [fieldSnippet, setFieldSnippet] = useState([
        {
            label: 'Type',
            name: 'type',
            type: 'select',
            data: Object.entries(TYPE_LABELS).map(([value, text]) => ({
                value,
                text,
                selected: value === 'autre'
            }))
        },
        { label: 'Titre', name: 'title', type: 'text', placeholder: 'Titre optionnel' },
        { label: 'Contenu *', name: 'content', type: 'textarea' },
    ])

    useEffect(() => {
        if (!selectedSnippet) {
            setSnippet({ 
                book_id: book.id, 
                tome_id: tome?.id || null,
                type: 'autre', 
                pinned: 0, 
                used: 'disponible' 
            })
            setFieldSnippet(prev => prev.map(f => ({ ...f, value: undefined })))
            return
        }
        setSnippet(selectedSnippet)
        setFieldSnippet(prev => prev.map(f => ({
            ...f,
            value: selectedSnippet[f.name],
            ...(f.type === 'select' && {
                data: f.data.map(d => ({ ...d, selected: d.value === selectedSnippet[f.name] }))
            })
        })))
    }, [selectedSnippet])

    const handleChange = (e) => {
        setSnippet(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setFieldSnippet(prev => prev.map(f => {
            if (f.name === e.target.name && f.type === 'select') {
                return { ...f, data: f.data.map(d => ({ ...d, selected: d.value === e.target.value })) }
            }
            return f.name === e.target.name ? { ...f, value: e.target.value } : f
        }))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError('')
        const errorListe = {}

        if (!snippet.content) {
            errorListe.all = 'Le contenu est obligatoire'
            setError(errorListe)
            return
        }

        const result = selectedSnippet
            ? await api('snippet:update', { id: selectedSnippet.id, data: snippet })
            : await api('snippet:create', snippet)

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
                    <Lightbulb className='text-white' size={32} />
                </div>
                <p className='text-orange-800 font-bold text-lg'>
                    {snippet.title || 'Nouveau snippet'}
                </p>
                {tome && (
                    <p className='text-xs text-orange-400'>{tome.title}</p>
                )}
            </div>

            <form className='flex flex-col gap-4'>
                <FormField fields={fieldSnippet} onChange={handleChange} errors={error} />

                {/* pinned */}
                <button
                    type='button'
                    onClick={() => setSnippet(prev => ({ ...prev, pinned: prev.pinned ? 0 : 1 }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${snippet.pinned ? 'bg-orange-100 border-orange-300 text-orange-600' : 'border-gray-200 text-gray-400 hover:border-orange-200'}`}
                >
                    <Pin size={14} className={snippet.pinned ? 'fill-orange-400' : ''} />
                    Épingler
                </button>

                {/* used */}
                <div className='flex gap-2'>
                    <button
                        type='button'
                        onClick={() => setSnippet(prev => ({ ...prev, used: 'disponible' }))}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${snippet.used === 'disponible' ? 'bg-orange-100 border-orange-300 text-orange-600' : 'border-gray-200 text-gray-400'}`}
                    >
                        Disponible
                    </button>
                    <button
                        type='button'
                        onClick={() => setSnippet(prev => ({ ...prev, used: 'utilise' }))}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${snippet.used === 'utilise' ? 'bg-green-100 border-green-300 text-green-600' : 'border-gray-200 text-gray-400'}`}
                    >
                        ✅ Utilisé
                    </button>
                    <button
                        type='button'
                        onClick={() => setSnippet(prev => ({ ...prev, used: 'abandonne' }))}
                        className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${snippet.used === 'abandonne' ? 'bg-red-100 border-red-300 text-red-600' : 'border-gray-200 text-gray-400'}`}
                    >
                        ❌ Abandonné
                    </button>
                </div>

                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}

                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-orange-300 hover:bg-orange-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    {selectedSnippet ? 'Modifier' : 'Créer'}
                </button>
            </form>
        </div>
    )
}