import React, { useState, useEffect } from 'react'
import { ChevronUp, BadgePlus, Trash2, Eye, Pen, Lock } from 'lucide-react'
import Modal from '../modal/Modal'
import ModalView from '../modal/ModalView'
import ModalBook from '../modal/ModalBook'
import ModalDelete from '../modal/ModalDelete'
import ModalTome from '../modal/ModalTome'
import ModalUnlockBook from '../modal/ModalUnlockBook'

export default function ChapterLayout(props) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [chapterToDelete, setChapterToDelete] = useState(null)
    const [isViewBookOpen, setIsViewBookOpen] = useState(false)
    const [isUpdateBookOpen, setIsUpdateBookOpen] = useState(false)
    const [bookSearch, setBookSearch] = useState('')
    const [bookDropdownOpen, setBookDropdownOpen] = useState(false)
    const [showArchived, setShowArchived] = useState(false)
    const [isTomeOpen, setIsTomeOpen] = useState(false)
    const [tomeToEdit, setTomeToEdit] = useState(null)
    const [isViewTomeOpen, setIsViewTomeOpen] = useState(false)
    const [tomeToView, setTomeToView] = useState(null)

    // livre prive en attente de mot de passe (null = pas de demande en cours)
    const [bookToUnlock, setBookToUnlock] = useState(null)

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

    // selection d'un livre dans le dropdown : si le livre est prive et pas encore deverrouille
    // pour cette session, on ouvre la popup de mot de passe au lieu de selectionner direct.
    // unlockedBookIds/unlockBook viennent de Home.jsx (etat en memoire, pas en localStorage,
    // donc tout se reverrouille quand on ferme l'appli).
    const selectBook = (book) => {
        const isUnlocked = props.unlockedBookIds?.includes(book.id)
        if (book.is_private && !isUnlocked) {
            setBookToUnlock(book)
            return
        }
        props.setSelectedBook(book)
        setBookDropdownOpen(false)
        setBookSearch('')
    }

    return (
        <div className='flex flex-col h-full'>

            <Modal isOpen={isViewBookOpen} onClose={() => setIsViewBookOpen(false)} size={50}>
                <ModalView item={props.selectedBook} type="book" />
            </Modal>

            <Modal isOpen={isUpdateBookOpen} onClose={() => setIsUpdateBookOpen(false)} size={50}>
                <ModalBook onSuccess={() => { props.fetchChapters(props.selectedTome?.id); setIsUpdateBookOpen(false) }} selectedBook={props.selectedBook} />
            </Modal>

            <Modal isOpen={isViewTomeOpen} onClose={() => setIsViewTomeOpen(false)} size={50}>
                <ModalView item={tomeToView} type="tome" />
            </Modal>

            <Modal isOpen={isTomeOpen} onClose={() => { setIsTomeOpen(false); setTomeToEdit(null) }} size={50}>
                <ModalTome
                    onSuccess={() => {
                        setIsTomeOpen(false)
                        setTomeToEdit(null)
                        props.fetchTomes(props.selectedBook.id)
                    }}
                    book={props.selectedBook}
                    selectedTome={tomeToEdit}
                />
            </Modal>

            <ModalDelete
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onSuccess={() => { props.fetchChapters(props.selectedTome?.id); setIsConfirmOpen(false) }}
                table="chapter"
                id={chapterToDelete}
            />

            {/* popup de mot de passe pour un livre prive, affichee a la place de la selection
                directe tant que le livre n'a pas ete deverrouille pour cette session */}
            <Modal isOpen={!!bookToUnlock} onClose={() => setBookToUnlock(null)} size={40}>
                {bookToUnlock && (
                    <ModalUnlockBook
                        book={bookToUnlock}
                        onClose={() => setBookToUnlock(null)}
                        onUnlocked={(book) => {
                            props.unlockBook(book.id)
                            props.setSelectedBook(book)
                            setBookToUnlock(null)
                            setBookDropdownOpen(false)
                            setBookSearch('')
                        }}
                    />
                )}
            </Modal>

            {/* header livre */}
            <div className='p-4 border-b border-primary-300'>
                <div className='group flex items-center justify-between gap-2 mb-3'>

                    {/* dropdown livres */}
                    <div className='relative flex-1 min-w-0' onClick={(e) => e.stopPropagation()}>
                        <div
                            className='flex items-center gap-1 cursor-pointer'
                            onClick={() => setBookDropdownOpen(!bookDropdownOpen)}
                        >
                            {!!props.selectedBook?.is_private && (
                                <Lock size={14} className='text-primary-400 flex-shrink-0' />
                            )}
                            <p className='font-bold text-lg text-primary-800 truncate'>
                                {props.selectedBook?.title || 'Choisir un livre...'}
                            </p>
                            <ChevronUp
                                className={`text-primary-400 flex-shrink-0 transition-transform duration-300 ${bookDropdownOpen ? 'rotate-0' : 'rotate-180'}`}
                                size={14}
                            />
                        </div>

                        {bookDropdownOpen && (
                            <div className='absolute top-full left-0 w-64 bg-primary-50 rounded-xl shadow-lg z-50 p-2 flex flex-col gap-1'>
                                <input
                                    type='text'
                                    placeholder='Rechercher...'
                                    value={bookSearch}
                                    onChange={(e) => setBookSearch(e.target.value)}
                                    className='w-full px-2 py-1 text-sm border border-primary-200 rounded-lg outline-none text-primary-600'
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowArchived(!showArchived) }}
                                        className={`text-xs px-2 py-1 rounded-lg text-left transition-colors ${showArchived ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        📦 {showArchived ? 'Masquer les archivés' : 'Afficher les archivés'}
                                    </button>
                                </div>
                                <hr className='border-primary-100' />
                                <div className='overflow-y-auto max-h-48'>
                                    {filteredBooks?.map(book => (
                                        <div
                                            key={book.id}
                                            onClick={() => selectBook(book)}
                                            className={`px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors flex items-center gap-2 ${book.id === props.selectedBook?.id
                                                ? 'bg-primary-300 text-white font-bold'
                                                : 'hover:bg-primary-50 text-primary-800'
                                                }`}
                                        >
                                            {book.archived ? <span className='text-xs'>📦</span> : null}
                                            {!!book.is_private && (
                                                <Lock
                                                    size={12}
                                                    className={book.id === props.selectedBook?.id ? 'text-white' : 'text-primary-300'}
                                                />
                                            )}
                                            {book.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='hidden group-hover:flex gap-1'>
                        {!!props.selectedBook?.is_private && (
                            <button
                                onClick={() => props.lockBook(props.selectedBook.id)}
                                title='Verrouiller ce livre'
                                className='text-primary-400 hover:text-red-500 transition-colors'
                            >
                                <Lock size={16} />
                            </button>
                        )}
                        <button onClick={() => setIsViewBookOpen(true)} className='text-primary-400 hover:text-primary-600 transition-colors'>
                            <Eye size={16} />
                        </button>
                        <button onClick={() => setIsUpdateBookOpen(true)} className='text-primary-400 hover:text-primary-600 transition-colors'>
                            <Pen size={16} />
                        </button>
                    </div>

                    <button onClick={() => props.addBook(true)} className='text-primary-400 hover:text-primary-600 transition-colors flex-shrink-0'>
                        <BadgePlus size={20} />
                    </button>
                </div>

                {/* select tome + actions */}
                {props.tomes && props.tomes.length > 0 && (
                    <div className='group flex items-center gap-2'>
                        <select
                            value={props.selectedTome?.id || ''}
                            onChange={(e) => {
                                const tome = props.tomes.find(t => t.id == e.target.value)
                                props.setSelectedTome(tome)
                            }}
                            className='flex-1 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1 text-sm text-primary-600 outline-none cursor-pointer'
                        >
                            {props.tomes.map(tome => (
                                <option key={tome.id} value={tome.id}>Tome {tome.number} : {tome.title}</option>
                            ))}
                        </select>
                        <div className='hidden group-hover:flex gap-1'>
                            <button
                                onClick={() => { setTomeToView(props.selectedTome); setIsViewTomeOpen(true) }}
                                className='text-primary-400 hover:text-primary-600 transition-colors'
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                onClick={() => { setTomeToEdit(props.selectedTome); setIsTomeOpen(true) }}
                                className='text-primary-400 hover:text-primary-600 transition-colors'
                            >
                                <Pen size={16} />
                            </button>

                            <button
                                onClick={() => { setTomeToEdit(null); setIsTomeOpen(true) }}
                                className='text-primary-400 hover:text-primary-600 transition-colors'
                            >
                                <BadgePlus size={16} />
                            </button>
                        </div>

                    </div>
                )}
            </div>

            {/* liste chapitres */}
            <div className='flex-1 overflow-hidden flex flex-col p-4'>
                <div className='flex justify-between items-center mb-3'>
                    <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Chapitres</p>
                    <button onClick={() => props.addChapter(true)} className='text-primary-400 hover:text-primary-600 transition-colors'>
                        <BadgePlus size={20} />
                    </button>
                </div>
                <div className='overflow-y-auto flex flex-col gap-1'>
                    {props?.chapters?.map((chapter) => (
                        <div
                            key={chapter.id}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${props.selectedChapter?.id == chapter.id
                                ? 'bg-primary-300 text-white font-bold'
                                : 'hover:bg-primary-100 text-primary-800'
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