import React, { useState, useEffect } from 'react'
import { GitBranch } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalTimeline({ onSuccess, selectedTome, chapters, selectedItem }) {
    const api = useApi()
    const [error, setError] = useState(null)
    const [item, setItem] = useState(
        selectedItem || {
            tome_id: selectedTome?.id || null,
            chapter_id: chapters?.[0]?.id || null,
            snippet_id: null,
            title: '',
            status: false,
        }
    )

    const [fields, setFields] = useState([
        { label: 'Titre *', name: 'title', type: 'text', placeholder: 'Titre de la scène / idée' },
        {
            label: 'Chapitre',
            name: 'chapter_id',
            type: 'select',
            data: chapters.map((ch, i) => ({
                value: ch.id,
                text: ch.title,
                selected: i === 0
            }))
        }
    ])

    useEffect(() => {
        if (!selectedItem) {
            setItem({
                tome_id: selectedTome?.id || null,
                chapter_id: chapters?.[0]?.id || null,
                snippet_id: null,
                title: '',
                status: false,
            })
            setFields(prev => prev.map(f => ({ ...f, value: undefined })))
            return
        }
        setItem(selectedItem)
        setFields(prev => prev.map(f => ({
            ...f,
            value: selectedItem[f.name],
            ...(f.type === 'select' && {
                data: f.data.map(d => ({ ...d, selected: d.value == selectedItem[f.name] }))
            })
        })))
    }, [selectedItem])

    const handleChange = (e) => {
        setItem(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setFields(prev => prev.map(f => {
            if (f.name === e.target.name && f.type === 'select') {
                return {
                    ...f,
                    value: e.target.value,
                    data: f.data.map(d => ({ ...d, selected: d.value == e.target.value }))
                }
            }
            return f.name === e.target.name ? { ...f, value: e.target.value } : f
        }))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError(null)

        if (!item.title) {
            setError({ all: 'Le titre est obligatoire' })
            return
        }

        const { position, ...itemData } = item

        console.log(item);
        

        // const result = selectedItem
        //     ? await api('timeline:update', { id: selectedItem.id, data: itemData })
        //     : await api('timeline:create', itemData)

        // if (result.success) {
        //     onSuccess(result)
        // } else {
        //     setError({ all: result.message })
        // }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-orange-300 flex items-center justify-center'>
                    <GitBranch className='text-white' size={32} />
                </div>
                <p className='text-orange-800 font-bold text-lg'>
                    {item.title || 'Nouvel élément'}
                </p>
            </div>

            <form className='flex flex-col gap-4'>
                <FormField fields={fields} onChange={handleChange} errors={error} />

                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}

                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-orange-300 hover:bg-orange-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    {selectedItem ? 'Modifier' : 'Créer'}
                </button>
            </form>
        </div>
    )
}