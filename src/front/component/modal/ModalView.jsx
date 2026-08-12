import React, { useState } from 'react'
import { Pin, BookOpen, ScrollText, NotebookPen, Lightbulb, Copy, Check } from 'lucide-react'

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

const USED_LABELS = {
    disponible: { label: 'Disponible', class: 'bg-primary-100 text-primary-600' },
    utilise: { label: '✅ Utilisé', class: 'bg-green-100 text-green-600' },
    abandonne: { label: '❌ Abandonné', class: 'bg-red-100 text-red-600' },
}

const TYPE_ICONS = {
    lore: <ScrollText size={24} className='text-white' />,
    note: <NotebookPen size={24} className='text-white' />,
    snippet: <Lightbulb size={24} className='text-white' />,
    book: <BookOpen size={24} className='text-white' />,
    tome: <BookOpen size={24} className='text-white' />,
}

export default function ModalView({ item, type }) {
    const [copied, setCopied] = useState(false)

    if (!item) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(item.content || item.description || '')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className='flex flex-col gap-4 max-h-[70vh]'>

            {/* header */}
            <div className='flex items-center gap-3'>
                <div className='w-12 h-12 rounded-2xl bg-primary-300 flex items-center justify-center flex-shrink-0'>
                    {TYPE_ICONS[type]}
                </div>
                <div>
                    <p className='text-xs text-primary-400 uppercase tracking-wider font-bold mb-1'>
                        {type === 'snippet' && (TYPE_LABELS[item.type] || item.type)}
                        {type === 'lore' && 'Lore'}
                        {type === 'note' && 'Note'}
                        {type === 'book' && 'Livre'}
                        {type === 'tome' && 'Tome'}
                    </p>
                    <h2 className='text-xl font-bold text-primary-800'>
                        {item.title || 'Sans titre'}
                    </h2>
                </div>
            </div>

            {/* badges */}
            <div className='flex gap-2 flex-wrap'>
                {type === 'lore' && item.category && (
                    <span className='text-xs bg-primary-100 text-primary-600 px-3 py-1 rounded-full font-medium'>
                        {item.category}
                    </span>
                )}
                {type === 'snippet' && item.used && (
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${USED_LABELS[item.used]?.class}`}>
                        {USED_LABELS[item.used]?.label}
                    </span>
                )}
                {type === 'snippet' && !!item.pinned && (
                    <span className='text-xs bg-primary-100 text-primary-600 px-3 py-1 rounded-full font-medium flex items-center gap-1'>
                        <Pin size={10} className='fill-orange-400' /> Épinglé
                    </span>
                )}
            </div>

            {/* séparateur */}
            <hr className='border-primary-100' />

            {/* contenu */}
            <div className='min-h-[200px] pb-4'>
                {item.content || item.description ? (
                    <div>
                        <div className='flex items-center justify-between mb-3'>
                            <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>
                                {type === 'book' || type === 'tome' ? 'Description' : 'Contenu'}
                            </p>
                            <button
                                onClick={handleCopy}
                                className='flex items-center gap-1.5 text-xs text-primary-300 hover:text-primary-500 transition-colors'
                            >
                                {copied
                                    ? <><Check size={12} className='text-green-500' /> <span className='text-green-500'>Copié !</span></>
                                    : <><Copy size={12} /> Copier</>
                                }
                            </button>
                        </div>
                        <div className=' max-h-[35em] overflow-y-auto hide-scrollbar '>
                            <p className='text-primary-800 leading-relaxed whitespace-pre-wrap'>
                                {item.content || item.description}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className='text-center text-primary-300 italic pt-8'>Aucun contenu</p>
                )}
            </div>

        </div>
    )
}