import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { BadgePlus, Pin, Check, Tag, Filter, Search, Trash2, Pen } from 'lucide-react'
import { ReactSortable } from 'react-sortablejs'
import Modal from '../modal/Modal'
import ModalView from '../modal/ModalView'
import ModalSnippet from '../modal/ModalSnippet'
import ModalDelete from '../modal/ModalDelete'

const TYPE_COLORS = {
    dialogue: 'bg-blue-100 text-blue-600',
    scene: 'bg-green-100 text-green-600',
    description: 'bg-purple-100 text-purple-600',
    flashback: 'bg-yellow-100 text-yellow-600',
    idee: 'bg-primary-100 text-primary-600',
    citation: 'bg-pink-100 text-pink-600',
    note_auteur: 'bg-gray-100 text-gray-600',
    transition: 'bg-cyan-100 text-cyan-600',
    autre: 'bg-gray-100 text-gray-500',
}

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

export default function SnippetLayout({ selectedBook, selectedTome, chapters, refreshTimeline }) {

    const api = useApi()
    const [snippets, setSnippets] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [snippetToEdit, setSnippetToEdit] = useState(null)
    const [snippetToDelete, setSnippetToDelete] = useState(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [filterType, setFilterType] = useState('tous')
    const [filterPinned, setFilterPinned] = useState(false)
    const [filterUsed, setFilterUsed] = useState('disponible')
    const [search, setSearch] = useState('')
    const [itemToView, setItemToView] = useState(null)
    const [isViewOpen, setIsViewOpen] = useState(false)

    useEffect(() => {
        fetchSnippets()
    }, [selectedTome])

    const fetchSnippets = async () => {
        const conditions = selectedTome
            ? { tome_id: selectedTome.id }
            : { book_id: selectedBook.id }
        const result = await api('snippet:findBy', conditions)
        setSnippets(result.data || [])
    }

    const handleSnippetCreated = () => {
        fetchSnippets()
        setIsOpen(false)
        if (refreshTimeline) refreshTimeline()
    }

    const handleReorder = async (newList) => {
        const reordered = [
            ...newList,
            ...snippets.filter(s => !newList.find(n => n.id === s.id))
        ]
        setSnippets(reordered)
        await api('snippet:reorder', newList.map(s => ({ id: s.id })))
    }

    const isFiltering = !!search || filterType !== 'tous' || filterPinned

    const filtered = snippets
        .filter(s => filterType === 'tous' || s.type === filterType)
        .filter(s => !filterPinned || s.pinned)
        .filter(s => filterUsed === 'tous' || s.used === filterUsed)
        .filter(s => !search ||
            (s.title || '').toLowerCase().includes(search.toLowerCase()) ||
            s.content.toLowerCase().includes(search.toLowerCase())
        )

    const renderSnippet = (snippet) => (
        <div
            key={snippet.id}
            className={`group p-3 rounded-xl cursor-pointer transition-colors border-l-4 ${snippet.used === 'utilise' ? 'bg-green-50 border-green-200 opacity-70'
                    : snippet.used === 'abandonne' ? 'bg-red-50 border-red-200 opacity-70'
                        : 'bg-primary-50 border-primary-200 hover:bg-primary-50'
                }`}
            onClick={() => { setItemToView(snippet); setIsViewOpen(true) }}
        >
            <div className='flex justify-between items-start mb-2'>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[snippet.type] || TYPE_COLORS.autre}`}>
                    {TYPE_LABELS[snippet.type] || snippet.type}
                </span>
                <div className='flex gap-1 items-center'>
                    {snippet.pinned == 1 && <Pin size={14} className='text-primary-400 fill-orange-400' />}
                    {snippet.used === 'utilise' && <Check size={14} className='text-green-400' />}
                    {snippet.used === 'abandonne' && <span className='text-xs text-red-400'>❌</span>}
                    <button
                        onClick={(e) => { e.stopPropagation(); setSnippetToEdit(snippet); setIsOpen(true) }}
                        className='hidden group-hover:flex text-primary-300 hover:text-primary-500 ml-1'
                    >
                        <Pen size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setSnippetToDelete(snippet.id); setIsConfirmOpen(true) }}
                        className='hidden group-hover:flex text-red-300 hover:text-red-500 ml-1'
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            {snippet.title && (
                <p className='font-bold text-primary-800 text-sm mb-1'>{snippet.title}</p>
            )}
            <p className={`text-xs line-clamp-2 ${snippet.used === 'abandonne' ? 'text-red-300 line-through'
                    : snippet.used === 'utilise' ? 'text-gray-400'
                        : 'text-primary-400'
                }`}>
                {snippet.content}
            </p>
        </div>
    )

    return (
        <>
            <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setSnippetToEdit(null) }} size={50}>
                <ModalSnippet onSuccess={handleSnippetCreated} book={selectedBook} tome={selectedTome} selectedSnippet={snippetToEdit} chapters={chapters} />
            </Modal>
            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} size={50}>
                <ModalView item={itemToView} type="snippet" />
            </Modal>

            <ModalDelete
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onSuccess={() => { fetchSnippets(); setIsConfirmOpen(false) }}
                table="snippet"
                id={snippetToDelete}
            />

            {/* header */}
            <div className='flex justify-between items-center px-3 py-2 mb-2'>
                <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>
                    Snippets {selectedTome && <span className='normal-case font-normal'>— {selectedTome.title}</span>}
                </p>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => setFilterPinned(!filterPinned)}
                        className={`p-1 rounded-lg transition-colors ${filterPinned ? 'text-primary-500 bg-primary-100' : 'text-primary-300 hover:text-primary-500'}`}
                        title="Afficher seulement les épinglés"
                    >
                        <Pin size={16} />
                    </button>
                    <button onClick={() => { setSnippetToEdit(null); setIsOpen(true) }} className='text-primary-400 hover:text-primary-600 transition-colors'>
                        <BadgePlus size={20} />
                    </button>
                </div>
            </div>

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

            <div className='px-3 mb-3 flex gap-2'>
                <div className='flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1'>
                    <Tag size={12} className='text-primary-400 flex-shrink-0' />
                    <select
                        className='w-full bg-transparent border-none outline-none cursor-pointer text-sm text-primary-600 appearance-none'
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value='tous'>Tous les types</option>
                        {Object.entries(TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className='flex items-center gap-2 bg-primary-50 rounded-lg px-2 py-1'>
                    <Filter size={12} className='text-primary-400 flex-shrink-0' />
                    <select
                        className='w-full bg-transparent border-none outline-none cursor-pointer text-sm text-primary-600 appearance-none'
                        value={filterUsed}
                        onChange={(e) => setFilterUsed(e.target.value)}
                    >
                        <option value='tous'>Tous les statuts</option>
                        <option value='disponible'>Disponible</option>
                        <option value='utilise'>✅ Utilisé</option>
                        <option value='abandonne'>❌ Abandonné</option>
                    </select>
                </div>
            </div>

            {snippets.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-6 gap-4'>
                    <p className='text-primary-300 text-center'>Aucun snippet</p>
                    <button onClick={() => setIsOpen(true)} className='border border-primary-300 rounded-lg px-4 py-2 text-primary-400 hover:bg-primary-100 transition-colors'>
                        + Ajouter un snippet
                    </button>
                </div>
            ) : (
                <div className='p-3 overflow-y-auto max-h-[calc(90vh-160px)] flex flex-col gap-3'>
                    {isFiltering ? (
                        filtered.map(snippet => renderSnippet(snippet))
                    ) : (
                        <ReactSortable
                            list={filtered}
                            setList={handleReorder}
                            animation={200}
                            ghostClass='opacity-30'
                            className='flex flex-col gap-3'
                        >
                            {filtered.map(snippet => renderSnippet(snippet))}
                        </ReactSortable>
                    )}
                </div>
            )}
        </>
    )
}