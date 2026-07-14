import React, { useState, useEffect } from 'react'
import { useApi } from '../context/ApiContext'
import { ReactSortable } from 'react-sortablejs'
import Modal from './modal/Modal'
import ModalView from './modal/ModalView'
import ModalSnippet from './modal/ModalSnippet'
import ModalTimeline from './modal/ModalTimeline'
import ModalTimelineFullscreen from './modal/ModalTimelineFullscreen'
import { BadgePlus, Maximize2, MessageCircleMore, Clapperboard, Quote, FileText, History, Lightbulb, PenLine, ChevronsRight, CircleSlash } from 'lucide-react'


export default function Timeline({ selectedTome, chapters, refreshTimeline, book }) {
    const api = useApi()
    const [items, setItems] = useState([])
    // const [showUnplaced, setShowUnplaced] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [openPopover, setOpenPopover] = useState(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    // const [snippetToEdit, setSnippetToEdit] = useState(null)
    // const [snippetActionItem, setSnippetActionItem] = useState(null)
    // const [isSnippetOpen, setIsSnippetOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [snippetToView, setSnippetToView] = useState(null)

    const SNIPPET_ICONS = {
        dialogue: MessageCircleMore,
        scene: Clapperboard,
        citation: Quote,
        description: FileText,
        flashback: History,
        idee: Lightbulb,
        note_auteur: PenLine,
        transition: ChevronsRight,
        autre: CircleSlash,
    }

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

    const fetchItems = async () => {
        const result = await api('timeline:findBy', { tome_id: selectedTome.id })
        if (result.success) setItems(result.data)
    }

    const getBubbleClass = (item) => {
        if (item.status) return 'bg-green-300 border-green-500 text-green-600'
        if (item.snippet_id) return 'bg-amber-200 border-amber-300 text-amber-500'
        return 'bg-primary-1 border-primary-300 text-primary-500'
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

    const renderItem = (item) => {
        const Icon = SNIPPET_ICONS[item.s_type] || CircleSlash

        return (
            <div key={item.id} className="relative flex flex-col items-center gap-1 cursor-grab">

                {/* Popover */}
                {openPopover === item.id && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenPopover(null)} />
                        <div className="fixed z-20 bg-primary-50 border border-primary-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[120px]"
                            style={{
                                top: document.getElementById(`bubble-${item.id}`)?.getBoundingClientRect().bottom + 8,
                                left: document.getElementById(`bubble-${item.id}`)?.getBoundingClientRect().left - 40,
                            }}
                        >
                            <button onClick={() => handleToggleStatus(item)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 text-xs text-primary-600 whitespace-nowrap">
                                {item.status ? '↩️ Dévalider' : '✅ Valider'}
                            </button>

                            <button onClick={() => handleDelete(item.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 text-xs text-red-400 whitespace-nowrap">
                                🗑️ Supprimer
                            </button>
                        </div>
                    </>
                )}

                

                {/* pastille */}
                <div
                    id={`bubble-fs-${item.id}`}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 hover:scale-110 transition-transform cursor-pointer ${getBubbleClass(item)}
                    flex justify-center items-center
                    `}
                    onClick={(e) => { e.stopPropagation(); setOpenPopover(openPopover === item.id ? null : item.id) }}
                >
                    {/* ici mettre icone */}
                    <Icon size={18} />
                </div>


                <span
                    className={`text-xs text-primary-500 whitespace-nowrap max-w-[70px] truncate text-center font-medium ${item.snippet_id ? 'cursor-pointer hover:text-primary-700 hover:underline' : ''}`}
                    onClick={() => {
                        if (!item.snippet_id) return
                        setSnippetToView({
                            id: item.snippet_id,
                            title: item.s_title,
                            type: item.s_type,
                            content: item.s_content
                        })
                        setIsViewOpen(true)
                    }}
                >
                    {item.s_title ?? item.title}
                </span>
            </div>
        )
    }

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
                    <div className="w-5 h-[2px] bg-primary-300 shrink-0 mx-1 last:hidden" />
                </div>
            ))}
        </ReactSortable>
    )






    return (
        <div className="flex items-center w-full px-4 py-2">

            {/* Zone chapitres scrollable */}
            <div className="flex-1 min-w-0 overflow-x-auto hide-scrollbar">
                <div className="flex items-start py-1" style={{ width: 'max-content' }}>
                    {chapters.map((chapter) => (
                        <div key={chapter.id} className="flex flex-col items-center shrink-0 border-s border-primary-400 px-3">
                            <span className="text-xs text-primary-500 font-semibold mb-2 whitespace-nowrap">{chapter.title}</span>
                            {renderSortable(grouped[chapter.id] || [], chapter.id)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bouton actions */}
            <div className="shrink-0 ml-2 pl-2 border-s border-primary-300">
                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedItem(null) }} size={50}>
                    <ModalTimeline
                        onSuccess={handleSuccess}
                        selectedTome={selectedTome}
                        chapters={chapters}
                        selectedItem={selectedItem}
                    />
                </Modal>

                <Modal isOpen={isFullscreen} onClose={() => { setIsFullscreen(false); fetchItems() }} >
                    <ModalTimelineFullscreen selectedTome={selectedTome} chapters={chapters} onUpdate={refreshTimeline} book={book} />
                </Modal>

                <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} size={50}>
                    <ModalView item={snippetToView} type="snippet" />
                </Modal>

                <div className='flex flex-col gap-4 ml-2'>

                    <button
                        onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
                        className="text-primary-400 hover:text-primary-600 transition-colors"
                        title="Ajouter"
                    >
                        <BadgePlus size={20} />
                    </button>
                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="text-primary-400 hover:text-primary-600 transition-colors"
                        title="Agrandir"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

        </div>
    )
}