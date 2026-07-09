import React, { useState } from 'react'
import { Scissors } from 'lucide-react'
import { useApi } from '../../context/ApiContext'

export default function ModalSplitChapter(props) {
    const api = useApi()
    const [title, setTitle] = useState('')
    const [error, setError] = useState(null)

    const handleSplit = async (mode) => {
        if (!title.trim()) {
            setError('Le titre est obligatoire')
            return
        }

        if (mode === 'A') {
            const result = await api('chapter:splitInsertAfter', {
                chapterIdActuel: props.item.chapter_id,
                itemPosition: props.item.position,
                newTitle: title.trim()
            })
            if (result.success) {
                props.onSuccess(result.data.id)
            } else {
                setError(result.message)
            }
        } else {
            const chaptersOrdered = [...props.chapters].sort((a, b) => a.position - b.position)
            const result = await api('chapter:splitCascade', {
                tomeId: props.selectedTome.id,
                bookId: props.book.id,
                chaptersOrdered,
                itemPosition: props.item.position,
                currentChapterId: props.item.chapter_id,
                newTitle: title.trim()
            })
            if (result.success) {
                props.onSuccess(result.data.id)
            } else {
                setError(result.message)
            }
        }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <Scissors className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>Diviser le chapitre</p>
                <p className='text-sm text-primary-400'>
                    À partir de : <span className='font-bold text-primary-600'>{props.item?.title}</span>
                </p>
            </div>

            <div className='flex flex-col gap-4'>
                <div>
                    <label className='block mb-1 text-xs text-primary-500 font-medium'>Titre du nouveau chapitre *</label>
                    <input
                        autoFocus
                        type='text'
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setError(null) }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSplit('A')}
                        placeholder='ex: Chapitre 5'
                        className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400'
                    />
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={() => handleSplit('A')}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold text-sm'
                >
                    ✂️ Insérer un chapitre après celui-ci
                    <span className='block text-xs font-normal opacity-80 mt-0.5'>
                        Cette scène et les suivantes → nouveau chapitre intercalé
                    </span>
                </button>

                <button
                    onClick={() => handleSplit('B')}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold text-sm'
                >
                    🔀 Décaler tout d'un chapitre
                    <span className='block text-xs font-normal opacity-80 mt-0.5'>
                        Nouveau chapitre créé à la fin, les scènes cascadent vers le suivant
                    </span>
                </button>
            </div>
        </div>
    )
}