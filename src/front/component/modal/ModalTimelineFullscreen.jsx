import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { ReactSortable } from 'react-sortablejs'
import ModalTimeline from './ModalTimeline'
import Modal from './Modal'
import { BadgePlus } from 'lucide-react'

export default function ModalTimelineFullscreen({ selectedTome, chapters, onUpdate }) {
    const api = useApi()
    const [items, setItems] = useState([])
    const [selectedChapters, setSelectedChapters] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [openPopover, setOpenPopover] = useState(null)

    const buildGrouped = (list) => {
        const g = { null: [] }
        chapters.forEach(ch => g[ch.id] = [])
        list.forEach(item => {
            const key = item.chapter_id ?? 'null'
            if (!g[key]) g[key] = []
            g[key].push(item)
        })
        return g
    }

    const [grouped, setGrouped] = useState(() => buildGrouped([]))

    useEffect(() => {
        if (selectedTome) fetchItems()
        setSelectedChapters(chapters.map(ch => ch.id))
    }, [selectedTome, chapters])

    useEffect(() => {
        setGrouped(buildGrouped(items))
    }, [items, chapters])

    const fetchItems = async () => {
        const result = await api('timeline:findBy', { tome_id: selectedTome.id })
        if (result.success) setItems(result.data)
    }

    const handleSuccess = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
        fetchItems()
         if (onUpdate) onUpdate()
    }

    const getBubbleClass = (item) => {
        if (item.status) return 'bg-green-400 border-green-500'
        if (item.snippet_id) return 'bg-orange-400 border-orange-500'
        return 'bg-white border-orange-300'
    }

    const handleReorder = async (newList, chapterId) => {
        const listWithChapter = newList.map(item => ({ ...item, chapter_id: chapterId ?? null }))
        setGrouped(prev => ({
            ...prev,
            [chapterId ?? 'null']: listWithChapter
        }))
        const updated = listWithChapter.map((item, index) => ({
            id: item.id,
            position: index + 1,
            chapter_id: chapterId ?? null
        }))
        await api('timeline:reorder', updated)
         if (onUpdate) onUpdate()
    }

    const handleToggleStatus = async (item) => {
        await api('timeline:update', { id: item.id, data: { status: !item.status } })
        fetchItems()
        setOpenPopover(null)
         if (onUpdate) onUpdate()
    }

    const handleDelete = async (id) => {
        await api('timeline:delete', id)
        fetchItems()
        setOpenPopover(null)
         if (onUpdate) onUpdate()
    }

    const toggleChapter = (id) => {
        setSelectedChapters(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        if (selectedChapters.length === chapters.length) {
            setSelectedChapters([])
        } else {
            setSelectedChapters(chapters.map(ch => ch.id))
        }
    }

    const unplaced = grouped['null'] || []
    const filteredChapters = chapters.filter(ch => selectedChapters.includes(ch.id))

    const renderItem = (item) => (
        <div key={item.id} className="relative flex items-center gap-3 cursor-grab">
            {openPopover === item.id && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenPopover(null)} />
                    <div
                        className="fixed z-20 bg-white border border-orange-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[120px]"
                        style={{
                            top: document.getElementById(`bubble-fs-${item.id}`)?.getBoundingClientRect().bottom + 8,
                            left: document.getElementById(`bubble-fs-${item.id}`)?.getBoundingClientRect().left - 40,
                        }}
                    >
                        <button onClick={() => handleToggleStatus(item)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-orange-50 text-xs text-orange-600 whitespace-nowrap">
                            {item.status ? '↩️ Dévalider' : '✅ Valider'}
                        </button>
                        <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); setOpenPopover(null) }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-orange-50 text-xs text-orange-600 whitespace-nowrap">
                            ✏️ Modifier
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 text-xs text-red-400 whitespace-nowrap">
                            🗑️ Supprimer
                        </button>
                    </div>
                </>
            )}
            <div
                id={`bubble-fs-${item.id}`}
                className={`w-6 h-6 rounded-full border-2 shrink-0 hover:scale-110 transition-transform cursor-pointer ${getBubbleClass(item)}`}
                onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === item.id ? null : item.id) }}
            />
            <span className="text-sm text-orange-500 font-medium">{item.title}</span>
        </div>
    )

    const renderSortable = (list, chapterId) => (
        <ReactSortable
            list={list}
            setList={(newList) => handleReorder(newList, chapterId)}
            animation={200}
            ghostClass='opacity-30'
            group="timeline-fs"
            className="flex flex-col gap-3 min-h-[40px]"
        >
            {list.map((item) => (
                <div key={item.id}>
                    {renderItem(item)}
                </div>
            ))}
        </ReactSortable>
    )

    return (
        <div className="flex flex-col gap-4" style={{ height: '70vh' }}>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedItem(null) }} size={50}>
                <ModalTimeline
                    onSuccess={handleSuccess}
                    selectedTome={selectedTome}
                    chapters={chapters}
                    selectedItem={selectedItem}
                />
            </Modal>

            {/* Header filtre multi-select + bouton ajouter */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={toggleAll}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedChapters.length === chapters.length ? 'bg-orange-400 text-white' : 'bg-orange-100 text-orange-400 hover:bg-orange-200'}`}
                    >
                        Tous
                    </button>
                    {chapters.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => toggleChapter(ch.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedChapters.includes(ch.id) ? 'bg-orange-400 text-white' : 'bg-orange-100 text-orange-400 hover:bg-orange-200'}`}
                        >
                            {ch.title}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
                    className="text-orange-400 hover:text-orange-600 transition-colors shrink-0"
                    title="Ajouter"
                >
                    <BadgePlus size={20} />
                </button>
            </div>

            {/* Corps */}
            <div className="flex gap-4 flex-1 overflow-hidden">

                {/* Non placés */}
                <div className="w-48 shrink-0 border-e border-orange-200 pr-4 flex flex-col gap-2 overflow-y-auto">
                    <p className="text-xs text-orange-400 font-semibold">? Non placés ({unplaced.length})</p>
                    <ReactSortable
                        list={unplaced}
                        setList={(newList) => handleReorder(newList, null)}
                        animation={200}
                        ghostClass='opacity-30'
                        group="timeline-fs"
                        className="flex flex-col gap-3 min-h-[40px]"
                    >
                        {unplaced.map(item => (
                            <div key={item.id} className="flex items-center gap-2 cursor-grab">
                                <div
                                    id={`bubble-fs-${item.id}`}
                                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${getBubbleClass(item)}`}
                                    onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === item.id ? null : item.id) }}
                                />
                                <span className="text-xs text-orange-500">{item.title}</span>
                            </div>
                        ))}
                    </ReactSortable>
                </div>

                {/* Timeline verticale */}
                <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-0 h-full" style={{ width: 'max-content' }}>
                        {filteredChapters.map((chapter) => (
                            <div key={chapter.id} className="flex flex-col shrink-0 border-s border-orange-400 px-4 overflow-y-auto" style={{ minWidth: '180px' }}>
                                <span className="text-sm text-orange-500 font-semibold mb-3 whitespace-nowrap sticky top-0 bg-white py-1">{chapter.title}</span>
                                {renderSortable(grouped[chapter.id] || [], chapter.id)}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}