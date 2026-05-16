import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { BadgePlus, ScrollText } from 'lucide-react'
import Modal from '../modal/Modal'
import ModalLore from '../modal/ModalLore'

export default function LoreLayout({ selectedBook }) {

    const api = useApi()
    const [lores, setLores] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [loreToEdit, setLoreToEdit] = useState(null)
    const [filterCategory, setFilterCategory] = useState('tous')

    useEffect(() => {
        fetchLore()
    }, [])

    const fetchLore = async () => {
        const result = await api('lore_entrie:findBy', { book_id: selectedBook.id })
        setLores(result.data || [])
    }

    const handleLoreCreated = () => {
        fetchLore()
        setIsOpen(false)
    }

    const categories = ['tous', ...new Set(lores.map(l => l.category).filter(Boolean))]

    const filteredLores = filterCategory === 'tous'
        ? lores
        : lores.filter(l => l.category === filterCategory)

    return (
        <>
            <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setLoreToEdit(null) }} title={loreToEdit ? "Modifier" : "Nouveau lore"} size={50}>
                <ModalLore onSuccess={handleLoreCreated} book={selectedBook} selectedLore={loreToEdit} />
            </Modal>

            {/* header */}
            <div className='flex justify-between items-center px-3 py-2 mb-2'>
                <p className='text-xs font-bold text-orange-400 uppercase tracking-wider'>Lore</p>
                <button onClick={() => { setLoreToEdit(null); setIsOpen(true) }} className='text-orange-400 hover:text-orange-600 transition-colors'>
                    <BadgePlus size={20} />
                </button>
            </div>

            {/* filtre catégorie */}
            {lores.length > 0 && (
                <div className='px-3 mb-3'>
                    <select
                        className='w-full bg-transparent border-none outline-none cursor-pointer text-sm text-orange-600 appearance-none'
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat === 'tous' ? 'Toutes les catégories' : cat}</option>
                        ))}
                    </select>
                </div>
            )}

            {lores.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-6 gap-4'>
                    <p className='text-orange-300 text-center'>Aucune entrée de lore</p>
                    <button onClick={() => setIsOpen(true)} className='border border-orange-300 rounded-lg px-4 py-2 text-orange-400 hover:bg-orange-100 transition-colors'>
                        + Ajouter du lore
                    </button>
                </div>
            ) : (
                <div className='p-3 overflow-y-auto max-h-[calc(90vh-120px)] flex flex-col gap-3'>
                    {filteredLores.map(lore => (
                        <div
                            key={lore.id}
                            className='p-3 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors'
                            onClick={() => { setLoreToEdit(lore); setIsOpen(true) }}
                        >
                            <div className='flex items-start gap-3'>
                                <div className='w-8 h-8 rounded-lg bg-orange-300 flex items-center justify-center text-white flex-shrink-0'>
                                    <ScrollText size={14} />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='font-bold text-orange-800 text-sm'>{lore.title}</p>
                                    {lore.category && (
                                        <span className='text-xs bg-orange-200 text-orange-600 px-2 py-0.5 rounded-full'>
                                            {lore.category}
                                        </span>
                                    )}
                                    {lore.content && (
                                        <p className='text-xs text-orange-400 line-clamp-2 mt-1'>{lore.content}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}