import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { ReactSortable } from 'react-sortablejs'
import Modal from './Modal'
import ModalView from './ModalView'
import ModalTimeline from './ModalTimeline'
import ModalSnippet from './ModalSnippet'
import ModalSplitChapter from './ModalSplitChapter'
import { BadgePlus } from 'lucide-react'

export default function ModalTimelineFullscreen({ selectedTome, chapters, onUpdate, book }) {
    const api = useApi()
    const [items, setItems] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [openPopover, setOpenPopover] = useState(null)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [snippetToView, setSnippetToView] = useState(null)
    const [isCreateSnippetOpen, setIsCreateSnippetOpen] = useState(false)
    const [isLinkOpen, setIsLinkOpen] = useState(false)
    const [snippetActionItem, setSnippetActionItem] = useState(null)
    const [availableSnippets, setAvailableSnippets] = useState([])
    const [isSplitOpen, setIsSplitOpen] = useState(false)
    const [splitItem, setSplitItem] = useState(null)
    const [snippetToEdit, setSnippetToEdit] = useState(null)

    const [selectedChapters, setSelectedChapters] = useState(() => {
        const saved = localStorage.getItem(`timeline-chapters-${book?.id}`)
        return saved ? JSON.parse(saved) : chapters.map(ch => ch.id)
    })
    const [showUnplaced, setShowUnplaced] = useState(() => {
        const saved = localStorage.getItem(`timeline-unplaced-${book?.id}`)
        return saved !== null ? JSON.parse(saved) : true
    })


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
        const saved = localStorage.getItem(`timeline-chapters-${book?.id}`)
        if (!saved) setSelectedChapters(chapters.map(ch => ch.id))
    }, [selectedTome, chapters])


    useEffect(() => {
        if (book?.id) localStorage.setItem(`timeline-chapters-${book.id}`, JSON.stringify(selectedChapters))
    }, [selectedChapters])

    useEffect(() => {
        if (book?.id) localStorage.setItem(`timeline-unplaced-${book.id}`, JSON.stringify(showUnplaced))
    }, [showUnplaced])


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
        if (item.snippet_id) return 'bg-amber-200 border-amber-300'
        return 'bg-primary-1 border-primary-300'
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
            setShowUnplaced(false)
        } else {
            setSelectedChapters(chapters.map(ch => ch.id))
            setShowUnplaced(true)
        }
    }

    const handleOpenLink = async (item) => {
        const result = await api('snippet:findWithoutTimeline', selectedTome.id)
        if (result.success) setAvailableSnippets(result.data)
        setSnippetActionItem(item)
        setIsLinkOpen(true)
        setOpenPopover(null)
    }

    const handleLinkSnippet = async (snippetId) => {
        await api('timeline:update', { id: snippetActionItem.id, data: { snippet_id: snippetId } })
        setIsLinkOpen(false)
        setSnippetActionItem(null)
        fetchItems()
        if (onUpdate) onUpdate()
    }

    const handleSnippetCreated = async (result) => {
        await api('timeline:update', { id: snippetActionItem.id, data: { snippet_id: result.id } })
        setIsCreateSnippetOpen(false)
        setSnippetActionItem(null)
        fetchItems()
        if (onUpdate) onUpdate()
    }

    const unplaced = grouped['null'] || []
    const filteredChapters = chapters.filter(ch => selectedChapters.includes(ch.id))

    const renderItem = (item) => (
        <div key={item.id} className="relative flex items-center gap-3 cursor-grab">
            {openPopover === item.id && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenPopover(null)} />
                    <div
                        className="fixed z-20 bg-primary-50 border border-primary-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[140px]"
                        style={{
                            top: document.getElementById(`bubble-fs-${item.id}`)?.getBoundingClientRect().bottom + 8,
                            left: document.getElementById(`bubble-fs-${item.id}`)?.getBoundingClientRect().left - 40,
                        }}
                    >
                        <button onClick={() => handleToggleStatus(item)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 text-xs text-primary-600 whitespace-nowrap">
                            {item.status ? '↩️ Dévalider' : '✅ Valider'}
                        </button>

                        <button
                            // onClick={() => {
                            //     if (item.snippet_id) {
                            //         setSnippetActionItem(item)
                            //         setIsCreateSnippetOpen(true)
                            //         console.log("item =>", item)

                            //     } else {
                            //         setSelectedItem(item)
                            //         setIsModalOpen(true)
                            //     }
                            //     setOpenPopover(null)
                            // }}

                            onClick={async () => {
                                if (item.snippet_id) {
                                    const result = await api('snippet:findById', item.snippet_id)
                                    console.log('snippet complet', result.data)
                                    if (result.success) {
                                        setSnippetToEdit(result.data)
                                        setSnippetActionItem(item)
                                        setIsCreateSnippetOpen(true)
                                    }
                                } else {
                                    setSelectedItem(item)
                                    setIsModalOpen(true)
                                }
                                setOpenPopover(null)
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 text-xs text-primary-600 whitespace-nowrap"
                        >
                            ✏️ Modifier
                        </button>

                        {/* <button onClick={() => { setSelectedItem(item); setIsModalOpen(true); setOpenPopover(null) }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 text-xs text-primary-600 whitespace-nowrap">
                            ✏️ Modifier
                        </button> */}
                        {!item.snippet_id && (
                            <>
                                <hr className="border-primary-100 my-1" />
                                <button
                                    onClick={() => { setSnippetActionItem(item); setIsCreateSnippetOpen(true); setOpenPopover(null) }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 text-xs text-primary-600 whitespace-nowrap"
                                >
                                    ✨ Créer un snippet
                                </button>
                                <button
                                    onClick={() => handleOpenLink(item)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 text-xs text-primary-600 whitespace-nowrap"
                                >
                                    🔗 Lier un snippet
                                </button>
                            </>
                        )}

                        {item.chapter_id && (
                            <>
                                <hr className="border-primary-100 my-1" />
                                <button
                                    onClick={() => { setSplitItem(item); setIsSplitOpen(true); setOpenPopover(null) }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-50 text-xs text-primary-600 whitespace-nowrap"
                                >
                                    ✂️ Diviser le chapitre
                                </button>
                            </>
                        )}
                        <hr className="border-primary-100 my-1" />
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
            <span
                className={`text-sm text-primary-500 font-medium ${item.snippet_id ? 'cursor-pointer hover:text-primary-700 hover:underline' : ''}`}
                onClick={async () => {
                    if (!item.snippet_id) return
                    const result = await api('snippet:findById', item.snippet_id)
                    if (result.success) {
                        setSnippetToView(result.data)
                        setIsViewOpen(true)
                    }
                }}
            >
                {item.s_title ?? item.title}
            </span>
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

            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} size={50}>
                <ModalView item={snippetToView} type="snippet" />
            </Modal>

           

            <Modal isOpen={isCreateSnippetOpen} onClose={() => { setIsCreateSnippetOpen(false); setSnippetActionItem(null); setSnippetToEdit(null) }} size={50}>
                <ModalSnippet
                    onSuccess={snippetToEdit
                        ? () => { setIsCreateSnippetOpen(false); setSnippetToEdit(null); setSnippetActionItem(null); fetchItems(); if (onUpdate) onUpdate() }
                        : handleSnippetCreated
                    }
                    book={book}
                    tome={selectedTome}
                    chapters={chapters}
                    selectedSnippet={snippetToEdit ?? { title: snippetActionItem?.title ?? '' }}
                />
            </Modal>



            <Modal isOpen={isLinkOpen} onClose={() => { setIsLinkOpen(false); setSnippetActionItem(null) }} size={40}>
                <div className="p-4 flex flex-col gap-4">
                    <p className="text-primary-800 font-bold text-lg text-center">Lier un snippet</p>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {availableSnippets.length === 0
                            ? <p className="text-sm text-gray-400 text-center py-4">Aucun snippet disponible</p>
                            : availableSnippets.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleLinkSnippet(s.id)}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-primary-50 text-sm text-primary-600 border border-primary-100 transition-colors"
                                >
                                    {s.title || s.type}
                                </button>
                            ))
                        }
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSplitOpen} onClose={() => { setIsSplitOpen(false); setSplitItem(null) }} size={40}>
                {splitItem && (
                    <ModalSplitChapter
                        item={splitItem}
                        chapters={chapters}
                        selectedTome={selectedTome}
                        book={book}
                        onSuccess={(newChapterId) => {
                            setIsSplitOpen(false)
                            setSplitItem(null)
                            setSelectedChapters(prev => [...prev, newChapterId])
                            fetchItems()
                            if (onUpdate) onUpdate()
                        }}
                    />
                )}
            </Modal>

            {/* Header filtre multi-select + bouton ajouter */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={toggleAll}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedChapters.length === chapters.length ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-400 hover:bg-primary-200'}`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setShowUnplaced(prev => !prev)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showUnplaced ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-400 hover:bg-primary-200'}`}
                    >
                        Non placés
                    </button>
                    {chapters.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => toggleChapter(ch.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedChapters.includes(ch.id) ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-400 hover:bg-primary-200'}`}
                        >
                            {ch.title}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => { setSelectedItem(null); setIsModalOpen(true) }}
                    className="text-primary-400 hover:text-primary-600 transition-colors shrink-0"
                    title="Ajouter"
                >
                    <BadgePlus size={20} />
                </button>
            </div>

            {/* Corps */}
            <div className="flex flex-1 overflow-hidden overflow-x-auto hide-scrollbar">

                {/* Non placés */}
                {showUnplaced && (
                    <div className="flex flex-col w-[400px] shrink-0 border-s border-primary-400 px-4 overflow-y-auto hide-scrollbar">
                        <span className="text-sm text-primary-500 font-semibold mb-3 whitespace-nowrap sticky top-0 bg-primary-50 py-1">Non placés ({unplaced.length})</span>
                        <ReactSortable
                            list={unplaced}
                            setList={(newList) => handleReorder(newList, null)}
                            animation={200}
                            ghostClass='opacity-30'
                            group="timeline-fs"
                            className="flex flex-col gap-3 min-h-[40px]"
                        >
                            {unplaced.map(item => (
                                <div key={item.id}>
                                    {renderItem(item)}
                                </div>
                            ))}
                        </ReactSortable>
                    </div>
                )}

                {/* Timeline verticale */}
                <div className="flex-1 min-w-0">
                    <div className="flex gap-0 h-full" style={{ width: 'max-content' }}>
                        {filteredChapters.map((chapter) => (
                            <div key={chapter.id} className="flex flex-col w-[400px] shrink-0 border-s border-primary-400 px-4 overflow-y-auto hide-scrollbar " >
                                <span className="text-sm text-primary-500 font-semibold mb-3 whitespace-nowrap sticky top-0 bg-primary-50 py-1">{chapter.title}</span>
                                {renderSortable(grouped[chapter.id] || [], chapter.id)}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}