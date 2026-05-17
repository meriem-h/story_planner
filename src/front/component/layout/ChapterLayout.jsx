import React, { useState, useEffect } from 'react'
import { ChevronUp, BadgePlus, Trash2, Eye, Pen } from 'lucide-react'
import Modal from '../modal/Modal'
import ModalView from '../modal/ModalView'
import ModalBook from '../modal/ModalBook'
import ModalDelete from '../modal/ModalDelete'

export default function ChapterLayout(props) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [chapterToDelete, setChapterToDelete] = useState(null)
    const [isViewBookOpen, setIsViewBookOpen] = useState(false)
    const [isUpdateBookOpen, setIsUpdateBookOpen] = useState(false)
    const [bookSearch, setBookSearch] = useState('')
    const [bookDropdownOpen, setBookDropdownOpen] = useState(false)
    const [showArchived, setShowArchived] = useState(false)

    useEffect(() => {
        const close = () => setBookDropdownOpen(false)
        document.addEventListener('click', close)
        return () => document.removeEventListener('click', close)
    }, [])

    const filteredBooks = props.books
        ?.filter(b => showArchived ? true : !b.archived)
        .filter(b => b.title.toLowerCase().includes(bookSearch.toLowerCase()))

    const changeChapter = async (e) => {
        const chapter = props.chapters.find(ch => ch.id == e.target.dataset.id)
        props.setSelectedChapter(chapter)
    }

    return (
        <div className='flex flex-col h-full'>

            <Modal isOpen={isViewBookOpen} onClose={() => setIsViewBookOpen(false)} size={50}>
                <ModalView item={props.selectedBook} type="book" />
            </Modal>

            <Modal isOpen={isUpdateBookOpen} onClose={() => setIsUpdateBookOpen(false)} size={50}>
                <ModalBook onSuccess={() => { props.fetchChapters(props.selectedBook.id); setIsUpdateBookOpen(false) }} selectedBook={props.selectedBook} />
            </Modal>

            <ModalDelete
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onSuccess={() => { props.fetchChapters(props.selectedBook.id); setIsConfirmOpen(false) }}
                table="chapter"
                id={chapterToDelete}
            />

            {/* header livre */}
            <div className='p-4 border-b border-orange-300'>
                <div className='group flex items-center justify-between gap-2 mb-3'>

                    {/* dropdown custom */}
                    <div className='relative flex-1 min-w-0' onClick={(e) => e.stopPropagation()}>
                        <div
                            className='flex items-center gap-1 cursor-pointer'
                            onClick={() => setBookDropdownOpen(!bookDropdownOpen)}
                        >
                            <p className='font-bold text-lg text-orange-800 truncate'>
                                {props.selectedBook?.title}
                            </p>
                            <ChevronUp
                                className={`text-orange-400 flex-shrink-0 transition-transform duration-300 ${bookDropdownOpen ? 'rotate-0' : 'rotate-180'}`}
                                size={14}
                            />
                        </div>

                        {bookDropdownOpen && (
                            <div className='absolute top-full left-0 w-64 bg-white rounded-xl shadow-lg z-50 p-2 flex flex-col gap-1'>
                                {/* recherche */}
                                <input
                                    type='text'
                                    placeholder='Rechercher...'
                                    value={bookSearch}
                                    onChange={(e) => setBookSearch(e.target.value)}
                                    className='w-full px-2 py-1 text-sm border border-orange-200 rounded-lg outline-none text-orange-600'
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {/* filtre archivé */}
                                <div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowArchived(!showArchived) }}
                                        className={`text-xs px-2 py-1 rounded-lg text-left transition-colors ${showArchived ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        📦 {showArchived ? 'Masquer les archivés' : 'Afficher les archivés'}
                                    </button>
                                </div>
                                <hr className='border-orange-100' />
                                {/* liste */}
                                <div className='overflow-y-auto max-h-48'>
                                    {filteredBooks?.map(book => (
                                        <div
                                            key={book.id}
                                            onClick={() => { props.setSelectedBook(book); setBookDropdownOpen(false); setBookSearch('') }}
                                            className={`px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors flex items-center gap-2 ${book.id === props.selectedBook?.id
                                                    ? 'bg-orange-300 text-white font-bold'
                                                    : 'hover:bg-orange-50 text-orange-800'
                                                }`}
                                        >
                                            {book.archived ? <span className='text-xs'>📦</span> : null}
                                            {book.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='hidden group-hover:flex gap-1'>
                        <button onClick={() => setIsViewBookOpen(true)} className='text-orange-400 hover:text-orange-600 transition-colors'>
                            <Eye size={16} />
                        </button>
                        <button onClick={() => setIsUpdateBookOpen(true)} className='text-orange-400 hover:text-orange-600 transition-colors'>
                            <Pen size={16} />
                        </button>
                    </div>

                    <button onClick={() => props.addBook(true)} className='text-orange-400 hover:text-orange-600 transition-colors flex-shrink-0'>
                        <BadgePlus size={20} />
                    </button>
                </div>
            </div>

            {/* liste chapitres */}
            <div className='flex-1 overflow-hidden flex flex-col p-4'>
                <div className='flex justify-between items-center mb-3'>
                    <p className='text-xs font-bold text-orange-400 uppercase tracking-wider'>Chapitres</p>
                    <button onClick={() => props.addChapter(true)} className='text-orange-400 hover:text-orange-600 transition-colors'>
                        <BadgePlus size={20} />
                    </button>
                </div>
                <div className='overflow-y-auto flex flex-col gap-1'>
                    {props?.chapters?.map((chapter) => (
                        <div
                            key={chapter.id}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${props.selectedChapter?.id == chapter.id
                                    ? 'bg-orange-300 text-white font-bold'
                                    : 'hover:bg-orange-100 text-orange-800'
                                }`}
                        >
                            <button
                                data-id={chapter.id}
                                onClick={changeChapter}
                                className='flex-1 text-left'
                            >
                                {chapter.title}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setChapterToDelete(chapter.id); setIsConfirmOpen(true) }}
                                className='hidden group-hover:block text-red-400 hover:text-red-600 ml-2'
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}