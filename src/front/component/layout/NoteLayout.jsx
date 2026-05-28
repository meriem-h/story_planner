import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { BadgePlus, NotebookPen, Search, Trash2, Pen } from 'lucide-react'
import { ReactSortable } from 'react-sortablejs'
import Modal from '../modal/Modal'
import ModalView from '../modal/ModalView'
import ModalNote from '../modal/ModalNote'
import ModalDelete from '../modal/ModalDelete'

export default function NoteLayout({ selectedBook }) {
    const api = useApi()
    const [notes, setNotes] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [noteToEdit, setNoteToEdit] = useState(null)
    const [noteToDelete, setNoteToDelete] = useState(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [itemToView, setItemToView] = useState(null)
    const [isViewOpen, setIsViewOpen] = useState(false)

    useEffect(() => {
        fetchNotes()
    }, [])

    const fetchNotes = async () => {
        const result = await api('note:findBy', { book_id: selectedBook.id })
        setNotes(result.data || [])
    }

    const handleNoteCreated = () => {
        fetchNotes()
        setIsOpen(false)
    }

    const handleReorder = async (newList) => {
        setNotes(newList)
        await api('note:reorder', newList.map(n => ({ id: n.id })))
    }

    const filtered = notes.filter(n =>
        (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    )

    const renderNote = (note) => (
        <div
            key={note.id}
            className='group p-3 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors'
            onClick={() => { setItemToView(note); setIsViewOpen(true) }}
        >
            <div className='flex items-start gap-3'>
                <div className='w-8 h-8 rounded-lg bg-orange-300 flex items-center justify-center text-white flex-shrink-0'>
                    <NotebookPen size={14} />
                </div>
                <div className='flex-1 min-w-0'>
                    <p className='font-bold text-orange-800 text-sm'>{note.title || 'Sans titre'}</p>
                    {note.content && (
                        <p className='text-xs text-orange-400 line-clamp-2 mt-1'>{note.content}</p>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); setNoteToEdit(note); setIsOpen(true) }}
                    className='hidden group-hover:flex text-orange-300 hover:text-orange-500 ml-1'
                >
                    <Pen size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); setIsConfirmOpen(true) }}
                    className='opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500 flex-shrink-0'
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    )

    return (
        <>
            <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); setNoteToEdit(null) }} size={50}>
                <ModalNote onSuccess={handleNoteCreated} book={selectedBook} selectedNote={noteToEdit} />
            </Modal>
            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} size={50}>
                <ModalView item={itemToView} type="lore" />
            </Modal>

            <ModalDelete
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onSuccess={() => { fetchNotes(); setIsConfirmOpen(false) }}
                table="note"
                id={noteToDelete}
            />

            {/* header */}
            <div className='flex justify-between items-center px-3 py-2 mb-2'>
                <p className='text-xs font-bold text-orange-400 uppercase tracking-wider'>Notes</p>
                <button onClick={() => { setNoteToEdit(null); setIsOpen(true) }} className='text-orange-400 hover:text-orange-600 transition-colors'>
                    <BadgePlus size={20} />
                </button>
            </div>

            {/* recherche */}
            <div className='px-3 mb-3'>
                <div className='flex items-center gap-2 bg-orange-50 rounded-lg px-2 py-1'>
                    <Search size={12} className='text-orange-400 flex-shrink-0' />
                    <input
                        type='text'
                        placeholder='Rechercher...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-full bg-transparent border-none outline-none text-sm text-orange-600 placeholder:text-orange-300'
                    />
                </div>
            </div>

            {notes.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-6 gap-4'>
                    <p className='text-orange-300 text-center'>Aucune note</p>
                    <button onClick={() => setIsOpen(true)} className='border border-orange-300 rounded-lg px-4 py-2 text-orange-400 hover:bg-orange-100 transition-colors'>
                        + Ajouter une note
                    </button>
                </div>
            ) : (
                <div className='p-3 overflow-y-auto max-h-[calc(90vh-120px)] flex flex-col gap-3'>
                    {search ? (
                        filtered.map(note => renderNote(note))
                    ) : (
                        <ReactSortable
                            list={notes}
                            setList={handleReorder}
                            animation={200}
                            ghostClass='opacity-30'
                            className='flex flex-col gap-3'
                        >
                            {notes.map(note => renderNote(note))}
                        </ReactSortable>
                    )}
                </div>
            )}
        </>
    )
}