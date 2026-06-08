import React, { useState, useEffect } from 'react'
import { useApi } from '../context/ApiContext'
import { ReactSortable } from 'react-sortablejs'
import Modal from './modal/Modal'
import ModalTimeline from './modal/ModalTimeline'
import ModalTimelineFullscreen from './modal/ModalTimelineFullscreen'
import { BadgePlus, Maximize2 } from 'lucide-react'

export default function Timeline({ selectedTome, chapters, refreshTimeline, book }) {
    const api = useApi()
    const [items, setItems] = useState([])
    const [showUnplaced, setShowUnplaced] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [openPopover, setOpenPopover] = useState(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const handleSuccess = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
        fetchItems()
    }

    const buildGrouped = (list) => {
        const g = { null: [] }
        chapters.forEach(ch => g[ch.id] = [])
        list
            .filter(item => item && item.id) // filtre les items vides
            .forEach(item => {
                const key = item.chapter_id ?? 'null'
                if (!g[key]) g[key] = []
                g[key].push(item)
            })
        return g
    }
    const [grouped, setGrouped] = useState(() => buildGrouped([]))


    useEffect(() => {
        if (selectedTome) fetchItems()
    }, [selectedTome])

    useEffect(() => {
        setGrouped(buildGrouped(items))
    }, [items.length, chapters])

    // useEffect(() => {
    //     setGrouped(buildGrouped(items))
    // }, [items, chapters])

    const fetchItems = async () => {
        const result = await api('timeline:findBy', { tome_id: selectedTome.id })
        if (result.success) setItems(result.data)
    }

    const getBubbleClass = (item) => {
        if (item.status) return 'bg-green-400 border-green-500'
        if (item.snippet_id) return 'bg-orange-400 border-orange-500'
        return 'bg-white border-orange-300'
    }

    const handleReorder = async (newList, chapterId) => {

        const listWithChapter = newList
            .filter(item => item && item.id)
            .map(item => ({ ...item, chapter_id: chapterId ?? null }))

        // Met à jour grouped directement
        setGrouped(prev => ({
            ...prev,
            [chapterId ?? 'null']: listWithChapter
        }))

        // Met à jour items pour garder la cohérence
        setItems(prev => {
            const others = prev.filter(i => (i.chapter_id ?? null) !== (chapterId ?? null))
            return [...others, ...listWithChapter]
        })

        const updated = listWithChapter.map((item, index) => ({
            id: item.id,
            position: index + 1,
            chapter_id: chapterId ?? null
        }))

        await api('timeline:reorder', updated)
    }

    const unplaced = grouped['null'] || []

    const handleToggleStatus = async (item) => {
        await api('timeline:update', { id: item.id, data: { status: !item.status } })
        fetchItems()
        setOpenPopover(null)
    }

    const handleDelete = async (id) => {
        await api('timeline:delete', id)
        fetchItems()
        setOpenPopover(null)
    }

    const renderItem = (item) => (
        <div key={item.id} className="relative flex flex-col items-center gap-1 cursor-grab">

            {/* Popover */}
            {openPopover === item.id && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenPopover(null)} />
                    <div className="fixed z-20 bg-white border border-orange-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[120px]"
                        style={{
                            top: document.getElementById(`bubble-${item.id}`)?.getBoundingClientRect().bottom + 8,
                            left: document.getElementById(`bubble-${item.id}`)?.getBoundingClientRect().left - 40,
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

            {/* Bulle */}
            <div id={`bubble-${item.id}`}
                className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${getBubbleClass(item)}`}
                onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === item.id ? null : item.id) }}
            />
            <span className="text-xs text-orange-500 whitespace-nowrap max-w-[70px] truncate text-center font-medium">{item.title}</span>
        </div>
    )

    const renderSortable = (list, chapterId) => (
        <ReactSortable
            list={list.filter(item => item && item.id)}
            setList={(newList) => handleReorder(newList.filter(item => item && item.id), chapterId)}
            animation={200}
            ghostClass='opacity-30'
            group="timeline"
            className="flex items-center gap-1"
        >
            {list.filter(item => item && item.id).map((item) => (
                <div key={item.id} className="flex items-center">
                    {renderItem(item)}
                    <div className="w-5 h-[2px] bg-orange-300 shrink-0 mx-1 last:hidden" />
                </div>
            ))}
        </ReactSortable>
    )






    return (
        <div className="flex items-center w-full px-4 py-2">

            {/* Non placés */}
            {/* <div className="flex flex-col items-start shrink-0 border-e border-orange-300 pr-3 mr-2">
                <button
                    onClick={() => setShowUnplaced(!showUnplaced)}
                    className="text-xs text-orange-300 font-semibold mb-2 hover:text-orange-500 transition-colors whitespace-nowrap"
                >
                    ? {unplaced.length > 0 && <span className="bg-orange-200 rounded-full px-1">{unplaced.length}</span>} {showUnplaced ? '▲' : '▼'}
                </button>
                {showUnplaced && renderSortable(unplaced, null)}
            </div> */}

            {/* Zone chapitres scrollable */}
            <div className="flex-1 min-w-0 overflow-x-auto hide-scrollbar">
                <div className="flex items-start py-1" style={{ width: 'max-content' }}>
                    {chapters.map((chapter) => (
                        <div key={chapter.id} className="flex flex-col items-center shrink-0 border-s border-orange-400 px-3">
                            <span className="text-xs text-orange-500 font-semibold mb-2 whitespace-nowrap">{chapter.title}</span>
                            {renderSortable(grouped[chapter.id] || [], chapter.id)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bouton actions */}
            <div className="shrink-0 ml-2 pl-2 border-s border-orange-300">
                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedItem(null) }} size={50}>
                    <ModalTimeline
                        onSuccess={handleSuccess}
                        selectedTome={selectedTome}
                        chapters={chapters}
                        selectedItem={selectedItem}
                    />
                </Modal>
                {/* <Modal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)} size={50}> */}
                <Modal isOpen={isFullscreen} onClose={() => { setIsFullscreen(false); fetchItems() }} size={50}>
                    <ModalTimelineFullscreen selectedTome={selectedTome} chapters={chapters} onUpdate={refreshTimeline} book={book} />
                </Modal>

                <div className='flex flex-col gap-4 ml-2'>

                    <button
                        onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
                        className="text-orange-400 hover:text-orange-600 transition-colors"
                        title="Ajouter"
                    >
                        <BadgePlus size={20} />
                    </button>
                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="text-orange-400 hover:text-orange-600 transition-colors"
                        title="Agrandir"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

        </div>
    )
}