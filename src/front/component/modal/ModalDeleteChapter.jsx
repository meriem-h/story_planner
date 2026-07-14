import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useApi } from '../../context/ApiContext'

export default function ModalDeleteChapter(props) {
    const api = useApi()

    const hasVariant = !!props.chapter?.paired_chapter_id

    const handleDelete = async (deleteType) => {
        if (deleteType === 'both') {
            await api('chapter:delete', props.chapter.paired_chapter_id)
            await api('chapter:delete', props.chapter.id)
        } else {
            await api('chapter:delete', props.chapter.idToDelete)
        }
        props.onSuccess()
        props.onClose()
    }

    return (
        <div className='flex flex-col items-center gap-4'>
            <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center'>
                <AlertTriangle className='text-red-400' size={32} />
            </div>

            <p className='text-center text-primary-800 font-bold'>
                {hasVariant
                    ? 'Ce chapitre a une version alternative'
                    : 'Êtes-vous sûr de vouloir supprimer ?'
                }
            </p>
            <p className='text-center text-primary-400 text-sm'>Cette action est irréversible !</p>

            {hasVariant ? (
                <div className='flex flex-col gap-2 w-full'>
                    <button
                        onClick={() => handleDelete('one')}
                        className='w-full py-2 bg-red-400 hover:bg-red-500 transition-colors text-white rounded-lg font-bold text-sm'
                    >
                        Supprimer uniquement cette version
                    </button>
                    <button
                        onClick={() => handleDelete('both')}
                        className='w-full py-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-lg font-bold text-sm'
                    >
                        Supprimer les deux versions
                    </button>
                    <button
                        onClick={props.onClose}
                        className='w-full py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors text-sm'
                    >
                        Annuler
                    </button>
                </div>
            ) : (
                <div className='flex gap-3 w-full'>
                    <button
                        onClick={props.onClose}
                        className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors'
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => handleDelete('one')}
                        className='flex-1 py-2 bg-red-400 hover:bg-red-500 transition-colors text-white rounded-lg font-bold'
                    >
                        Supprimer
                    </button>
                </div>
            )}
        </div>
    )
}