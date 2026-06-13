import React, { useState, useEffect } from 'react'
import { useApi } from '../context/ApiContext'


export default function Timeline({ selectedTome, chapters }) {
    const api = useApi()
    const [items, setItems] = useState([])
    const [draggedItem, setDraggedItem] = useState(null)

    useEffect(() => {
        if (selectedTome) fetchItems()
    }, [selectedTome])

    const fetchItems = async () => {
        const result = await api('timeline:findBy', { tome_id: selectedTome.id })
        if (result.success) setItems(result.data)
    }

    const getStatus = (item) => {
        if (item.status) return 'placed' 
        if (item.snippet_id) return 'written'
        return 'idea'
    }

    const getBubbleClass = (item) => {
        const status = getStatus(item)
        if (status === 'placed') return 'bg-green-400 border-green-500'
        if (status === 'written') return 'bg-primary-400 border-primary-500'
        return 'bg-white border-primary-200'
    }

    const handleClick = async (item) => {
        const status = getStatus(item)
        let newStatus = item.status

        if (status === 'idea' || status === 'written') {
            // passe à placed
            newStatus = true
        } else {
            // passe à written ou idea
            newStatus = false
        }

        await api('timeline:update', { id: item.id, data: { status: newStatus } })
        fetchItems()
    }

    const handleDragStart = (item) => {
        setDraggedItem(item)
    }

    const handleDropOnChapter = async (chapterId) => {
        if (!draggedItem) return
        await api('timeline:update', {
            id: draggedItem.id,
            data: { chapter_id: chapterId }
        })
        setDraggedItem(null)
        fetchItems()
    }

    const handleDropOnUnplaced = async () => {
        if (!draggedItem) return
        await api('timeline:update', {
            id: draggedItem.id,
            data: { chapter_id: null }
        })
        setDraggedItem(null)
        fetchItems()
    }

    const handleReorder = async (targetItem) => {
        if (!draggedItem || draggedItem.id === targetItem.id) return
        const grouped = groupByChapter()
        const allItems = [
            ...(grouped['null'] || []),
            ...chapters.flatMap(ch => grouped[ch.id] || [])
        ]
        const from = allItems.findIndex(i => i.id === draggedItem.id)
        const to = allItems.findIndex(i => i.id === targetItem.id)
        const reordered = [...allItems]
        reordered.splice(from, 1)
        reordered.splice(to, 0, draggedItem)

        const updated = reordered.map((item, index) => ({ id: item.id, position: index + 1, chapter_id: item.chapter_id }))
        await api('timeline:reorder', updated)
        fetchItems()
    }

    const groupByChapter = () => {
        const groups = {}
        items.forEach(item => {
            const key = item.chapter_id ?? 'null'
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        })
        return groups
    }

    const grouped = groupByChapter()
    const unplaced = grouped['null'] || []

    return (
        <div className="flex items-start gap-0 overflow-x-auto py-4 px-6 select-none min-h-[80px]">

            {/* Non placés */}
            <div
                className="flex flex-col items-start shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDropOnUnplaced}
            >
                <span className="text-xs text-primary-300 font-semibold mb-2 whitespace-nowrap">? Non placés</span>
                <div className="flex items-center gap-1">
                    {unplaced.map((item, i) => (
                        <React.Fragment key={item.id}>
                            <div
                                className="flex flex-col items-center gap-1 cursor-grab"
                                draggable
                                onDragStart={() => handleDragStart(item)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={() => handleReorder(item)}
                            >
                                <div
                                    onClick={() => handleClick(item)}
                                    className={`w-4 h-4 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${getBubbleClass(item)}`}
                                    title={item.title}
                                />
                                <span className="text-[10px] text-primary-400 whitespace-nowrap max-w-[60px] truncate text-center">{item.title}</span>
                            </div>
                            {i < unplaced.length - 1 && <div className="w-4 h-[2px] bg-primary-200 shrink-0" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Séparateur */}
            {unplaced.length > 0 && chapters.length > 0 && (
                <div className="flex items-center mx-2 mt-6">
                    <div className="w-6 h-[2px] bg-primary-300" />
                    <div className="w-[2px] h-6 bg-primary-300" />
                </div>
            )}

            {/* Chapitres */}
            {chapters.map((chapter, chIndex) => {
                const chapterItems = grouped[chapter.id] || []
                return (
                    <React.Fragment key={chapter.id}>
                        <div
                            className="flex flex-col items-start shrink-0"
                            onDragOver={e => e.preventDefault()}
                            onDrop={() => handleDropOnChapter(chapter.id)}
                        >
                            <span className="text-xs text-primary-500 font-semibold mb-2 whitespace-nowrap">{chapter.title}</span>
                            <div className="flex items-center gap-1">
                                {chapterItems.length === 0 && (
                                    <div className="w-8 h-[2px] bg-primary-100" />
                                )}
                                {chapterItems.map((item, i) => (
                                    <React.Fragment key={item.id}>
                                        <div
                                            className="flex flex-col items-center gap-1 cursor-grab"
                                            draggable
                                            onDragStart={() => handleDragStart(item)}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={() => handleReorder(item)}
                                        >
                                            <div
                                                onClick={() => handleClick(item)}
                                                className={`w-4 h-4 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform ${getBubbleClass(item)}`}
                                                title={item.title}
                                            />
                                            <span className="text-[10px] text-primary-400 whitespace-nowrap max-w-[60px] truncate text-center">{item.title}</span>
                                        </div>
                                        {i < chapterItems.length - 1 && <div className="w-4 h-[2px] bg-primary-200 shrink-0" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Séparateur entre chapitres */}
                        {chIndex < chapters.length - 1 && (
                            <div className="flex items-center mx-2 mt-6">
                                <div className="w-6 h-[2px] bg-primary-300" />
                                <div className="w-[2px] h-6 bg-primary-300" />
                            </div>
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}