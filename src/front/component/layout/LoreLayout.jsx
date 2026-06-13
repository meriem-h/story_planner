import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { BadgePlus, ScrollText, Search, Trash2, Pen } from 'lucide-react'
import { ReactSortable } from 'react-sortablejs'
import Modal from '../modal/Modal'
import ModalView from '../modal/ModalView'
import ModalLore from '../modal/ModalLore'
import ModalDelete from '../modal/ModalDelete'

export default function LoreLayout({ selectedBook }) {

    const api = useApi()
    const [lores, setLores] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [loreToEdit, setLoreToEdit] = useState(null)
    const [loreToDelete, setLoreToDelete] = useState(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [filterCategory, setFilterCategory] = useState('tous')
    const [search, setSearch] = useState('')
    const [itemToView, setItemToView] = useState(null)
    const [isViewOpen, setIsViewOpen] = useState(false)

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

    const handleReorder = async (newList) => {
        setLores(newList)
        await api('lore_entrie:reorder', newList.map(l => ({ id: l.id })))
    }

    const categories = ['tous', ...new Set(lores.map(l => l.category).filter(Boolean))]

    const filteredLores = lores
        .filter(l => filterCategory === 'tous' || l.category === filterCategory)
        .filter(l => l.title.toLowerCase().includes(search.toLowerCase()))

    const isFiltering = search || filterCategory !== 'tous'

    const renderLore = (lore) => (
        <div
            key={lore.id}
            className='group p-3 bg-primary-50 rounded-xl cursor-pointer hover:bg-primary-100 transition-colors'
            onClick={() => { setItemToView(lore); setIsViewOpen(true) }}
        >
            <div className='flex items-start gap-3'>
                <div className='w-8 h-8 rounded-lg bg-primary-300 flex items-center justify-center text-white flex-shrink-0'>
                    <ScrollText size={14} />
                </div>
                <div className='flex-1 min-w-0'>
                    <p className='font-bold text-primary-800 text-sm'>{lore.title}</p>
                    {lore.category && (
                        <span className='text-xs bg-primary-200 text-primary-600 px-2 py-0.5 rounded-full'>
                            {lore.category}
                        </span>
                    )}
                    {lore.content && (
                        <p className='text-xs text-primary-400 line-clamp-2 mt-1'>{lore.content}</p>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setLoreToEdit(lore); setIsOpen(true) }}
                    className='opacity-0 group-hover:opacity-100 transition-opacity text-primary-300 hover:text-primary-500 flex-shrink-0'
                >
                    <Pen size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setLoreToDelete(lore.id); setIsConfirmOpen(true) }}
                    className='opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500 flex-shrink-0'
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    )

    return (
        <>
            <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setLoreToEdit(null) }} size={50}>
                <ModalLore onSuccess={handleLoreCreated} book={selectedBook} selectedLore={loreToEdit} />
            </Modal>
            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} size={50}>
                <ModalView item={itemToView} type="lore" />
            </Modal>

            <ModalDelete
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onSuccess={() => { fetchLore(); setIsConfirmOpen(false) }}
                table="lore_entrie"
                id={loreToDelete}
            />

            {/* header */}
            <div className='flex justify-between items-center px-3 py-2 mb-2'>
                <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Lore</p>
                <button onClick={() => { setLoreToEdit(null); setIsOpen(true) }} className='text-primary-400 hover:text-primary-600 transition-colors'>
                    <BadgePlus size={20} />
                </button>
            </div>

            {/* recherche */}
            <div className='px-3 mb-2'>
                <div className='flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1'>
                    <Search size={12} className='text-primary-400 flex-shrink-0' />
                    <input
                        type='text'
                        placeholder='Rechercher...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-full bg-transparent border-none outline-none text-sm text-primary-600 placeholder:text-primary-300'
                    />
                </div>
            </div>

            {/* filtre catégorie */}
            {lores.length > 0 && (
                <div className='px-3 mb-3'>
                    <div className='flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1'>
                        <select
                            className='w-full bg-transparent border-none outline-none cursor-pointer text-sm text-primary-600 appearance-none'
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'tous' ? 'Toutes les catégories' : cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {lores.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-6 gap-4'>
                    <p className='text-primary-300 text-center'>Aucune entrée de lore</p>
                    <button onClick={() => setIsOpen(true)} className='border border-primary-300 rounded-lg px-4 py-2 text-primary-400 hover:bg-primary-100 transition-colors'>
                        + Ajouter du lore
                    </button>
                </div>
            ) : (
                <div className='p-3 overflow-y-auto max-h-[calc(90vh-120px)] flex flex-col gap-3'>
                    {isFiltering ? (
                        filteredLores.map(lore => renderLore(lore))
                    ) : (
                        <ReactSortable
                            list={lores}
                            setList={handleReorder}
                            animation={200}
                            ghostClass='opacity-30'
                            className='flex flex-col gap-3'
                        >
                            {lores.map(lore => renderLore(lore))}
                        </ReactSortable>
                    )}
                </div>
            )}
        </>
    )
}