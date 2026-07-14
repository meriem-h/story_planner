import React, { useState } from 'react'
import { GitBranch } from 'lucide-react'
import { useApi } from '../../context/ApiContext'

export default function ModalChapterVariant(props) {
    const api = useApi()
    const [copyContent, setCopyContent] = useState(false)
    const [isAdult, setIsAdult] = useState(true)
    const [error, setError] = useState(null)

    const handleClick = async (e) => {
        e.preventDefault()
        setError(null)

        const result = await api('chapter:createVariant', {
            chapterId: props.chapter.id,
            copyContent,
            isAdult
        })

        if (result.success) {
            props.onSuccess(result)
        } else {
            setError(result.message)
        }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <GitBranch className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>{props.chapter?.title}</p>
                <p className='text-xs text-primary-400'>Créer une version alternative</p>
            </div>

            <div className='flex flex-col gap-4'>

                <div className='flex flex-col gap-2'>
                    <p className='text-sm font-bold text-primary-600'>Cette nouvelle version est...</p>
                    <div className='flex gap-2'>
                        <button
                            onClick={() => setIsAdult(false)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${!isAdult
                                ? 'bg-primary-300 text-white border-primary-300'
                                : 'bg-white text-primary-400 border-primary-200 hover:border-primary-300'
                            }`}
                        >
                            👨‍👩‍👧 Familiale
                        </button>
                        <button
                            onClick={() => setIsAdult(true)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${isAdult
                                ? 'bg-primary-300 text-white border-primary-300'
                                : 'bg-white text-primary-400 border-primary-200 hover:border-primary-300'
                            }`}
                        >
                            🔞 Adulte
                        </button>
                    </div>
                </div>

                <div className='flex flex-col gap-2'>
                    <p className='text-sm font-bold text-primary-600'>Contenu</p>
                    <div className='flex gap-2'>
                        <button
                            onClick={() => setCopyContent(false)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${!copyContent
                                ? 'bg-primary-300 text-white border-primary-300'
                                : 'bg-white text-primary-400 border-primary-200 hover:border-primary-300'
                            }`}
                        >
                            Partir de zéro
                        </button>
                        <button
                            onClick={() => setCopyContent(true)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${copyContent
                                ? 'bg-primary-300 text-white border-primary-300'
                                : 'bg-white text-primary-400 border-primary-200 hover:border-primary-300'
                            }`}
                        >
                            Copier le contenu
                        </button>
                    </div>
                </div>

                {error && (
                    <div className='bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm'>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    Créer la variante
                </button>
            </div>
        </div>
    )
}