import React, { useState, useEffect, useRef } from 'react'
import { Pin, X } from 'lucide-react'
import { useApi } from '../context/ApiContext'
import Modal from './modal/Modal'
import ModalView from './modal/ModalView'

const POSITION_KEY = 'postit_position'
const VISIBLE_KEY = 'postit_visible'

export default function PostitPanel({ selectedBook }) {

    const api = useApi()
    const [notes, setNotes] = useState([])
    const [visible, setVisible] = useState(() => {
        const saved = localStorage.getItem(VISIBLE_KEY)
        return saved !== null ? JSON.parse(saved) : true
    })
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem(POSITION_KEY)
        return saved ? JSON.parse(saved) : { x: window.innerWidth - 280, y: 80 }
    })
    const [dragging, setDragging] = useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })
    const panelRef = useRef(null)

    const [itemToView, setItemToView] = useState(null)
    const [isViewOpen, setIsViewOpen] = useState(false)

    useEffect(() => {
        if (selectedBook) fetchNotes()
    }, [selectedBook])

    useEffect(() => {
        localStorage.setItem(VISIBLE_KEY, JSON.stringify(visible))
    }, [visible])

    const fetchNotes = async () => {
        const result = await api('note:findBy', { book_id: selectedBook.id, is_postit: 1 })
        setNotes(result.data || [])
    }

    const toggleDone = async (note) => {
        const newVal = note.is_done ? 0 : 1
        await api('note:update', { id: note.id, data: { is_done: newVal } })
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_done: newVal } : n))
    }

    const unpin = async (note) => {
        await api('note:update', { id: note.id, data: { is_postit: 0 } })
        setNotes(prev => prev.filter(n => n.id !== note.id))
    }

    const onMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('.note-item')) return
        setDragging(true)
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        }
    }

    useEffect(() => {
        if (!dragging) return
        const onMouseMove = (e) => {
            setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
        }
        const onMouseUp = () => {
            setDragging(false)
            setPosition(prev => {
                localStorage.setItem(POSITION_KEY, JSON.stringify(prev))
                return prev
            })
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [dragging])

    if (!selectedBook) return null

    return (
        <>
            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} size={50}>
                <ModalView item={itemToView} type="lore" />
            </Modal>

            {/* bouton toggle */}
            <button
                onClick={() => setVisible(prev => !prev)}
                title="Post-it"
                style={{ top: '20px', zIndex: 60 }}
                className={`fixed right-0 flex items-center gap-1 px-2 py-2 rounded-l-xl text-white text-xs font-medium transition-colors shadow-md ${visible ? 'bg-primary-400' : 'bg-primary-300 hover:bg-primary-400'}`}
            >
                <Pin size={20} />
            </button>

            {/* post-it */}
            {visible && (
    <div
        ref={panelRef}
        onMouseDown={onMouseDown}
        style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 9999,
            cursor: dragging ? 'grabbing' : 'grab',
            width: '260px',
        }}
        className='postit'
    >
        {/* header */}
        <div className='flex items-center justify-between px-4 pt-4 pb-2'>
            <div className='flex items-center gap-2'>
                <Pin size={13} className='text-yellow-600' />
                <span className='text-sm font-bold text-yellow-800 uppercase tracking-wider'>Post-it</span>
            </div>
        </div>

        {/* liste */}
        <div className='flex flex-col gap-1 px-3 pb-8 max-h-64 overflow-y-auto hide-scrollbar'>
            {notes.length === 0 ? (
                <p className='text-xs text-yellow-600 text-center py-2 opacity-60'>Aucune note épinglée</p>
            ) : (
                notes.map(note => (
                    <div
                        key={note.id}
                        className='note-item group flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors'
                    >
                        {/* checkbox done */}
                        <button
                            onClick={() => toggleDone(note)}
                            className='flex-shrink-0 mt-0.5 text-yellow-700 hover:text-yellow-900 transition-colors text-sm'
                        >
                            {note.is_done ? '☑' : '☐'}
                        </button>

                        {/* titre cliquable */}
                        <span
                            onClick={() => { setItemToView(note); setIsViewOpen(true) }}
                            className={`flex-1 text-xs cursor-pointer hover:underline font-medium ${note.is_done ? 'line-through text-yellow-700' : 'text-yellow-900'}`}
                            style={{ fontFamily: 'cursive' }}
                        >
                            {note.title || note.content.slice(0, 40)}
                        </span>

                        {/* désépingler */}
                        <button
                            onClick={() => unpin(note)}
                            title="Retirer du post-it"
                            className='flex-shrink-0 text-yellow-800 hover:text-yellow-700 transition-colors opacity-0 group-hover:opacity-100'
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
)}
        </>
    )
}