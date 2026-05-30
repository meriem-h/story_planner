import React, { useState, useEffect } from 'react'
import { X, Lightbulb, BookUser, BookOpenText, NotebookPen, ScrollText, Images } from 'lucide-react'

import Chapter from "./ChapterLayout";
import Character from "./CharacterLayout";
import Snippet from "./SnippetLayout";
import Note from "./NoteLayout";
import Lore from "./LoreLayout";
import Modal from '../modal/Modal';
import ModalGallery from '../modal/ModalGallery';

export default function Layout({ children, books, selectedBook, setSelectedBook, chapters, selectedChapter, setSelectedChapter, addChapter, addBook, fetchChapters, tomes, selectedTome, setSelectedTome, fetchTomes }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeView, setActiveView] = useState('chapter')
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)

     const chapterProps = {
        chapters, selectedChapter, setSelectedChapter,
        books, selectedBook, setSelectedBook,
        addChapter, addBook, fetchChapters,
        tomes, selectedTome, setSelectedTome,
        fetchTomes
    }

    const [content, setContent] = useState(<Chapter {...chapterProps} />)

    useEffect(() => {
        if (activeView === 'chapter') {
            setContent(<Chapter {...chapterProps} />)
        }
    }, [chapters, selectedChapter, books, selectedBook, tomes, selectedTome])

    const btnClass = (view) => `rounded-2xl p-2 transition-colors ${activeView === view ? 'bg-orange-600 text-orange-100' : 'bg-orange-400 text-orange-100 hover:bg-orange-500'}`

    const showChapter = () => {
        setActiveView('chapter')
        setContent(<Chapter {...chapterProps} />)
    }
    const showCharacter = () => {
        setActiveView('character')
        setContent(<Character selectedBook={selectedBook} />)
    }
    const showLore = () => {
        setActiveView('lore')
        setContent(<Lore selectedBook={selectedBook} />)
    }
    const showSnippet = () => {
        setActiveView('snippet')
        setContent(<Snippet selectedBook={selectedBook} selectedTome={selectedTome} />)
    }
    const showNote = () => {
        setActiveView('note')
        setContent(<Note selectedBook={selectedBook} />)
    }

    return (
        <div className="flex">

            <Modal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} size={60}>
                <ModalGallery book={selectedBook} />
            </Modal>

            {/* Sidebar ouverte */}
            <div className={`${isOpen ? 'w-80 px-4' : 'w-0'} transition-all duration-300 overflow-hidden bg-orange-200`}>
                <div className='p-4 flex gap-2 justify-center'>
                    <button className={btnClass('chapter')} title="Chapitres" onClick={showChapter}>
                        <BookOpenText />
                    </button>
                    <button className={btnClass('character')} title="Personnages" onClick={showCharacter}>
                        <BookUser />
                    </button>
                    <button className={btnClass('lore')} title="Lore" onClick={showLore}>
                        <ScrollText />
                    </button>
                    <button className={btnClass('snippet')} title="Snippets" onClick={showSnippet}>
                        <Lightbulb />
                    </button>
                    <button className={btnClass('note')} title="Notes" onClick={showNote}>
                        <NotebookPen />
                    </button>
                    <button className='bg-orange-400 rounded-2xl p-2 text-orange-100 hover:bg-orange-500' onClick={() => setIsOpen(!isOpen)}>
                        <X />
                    </button>
                </div>
                <div>{content}</div>
            </div>

            {/* Sidebar fermée */}
            <div className="flex">
                <div className={`${isOpen && "hidden"} p-4 bg-orange-200 flex flex-col gap-4`} onClick={() => setIsOpen(!isOpen)}>
                    {!isOpen &&
                        <>
                            <button className={btnClass('chapter')} title="Chapitres" onClick={(e) => { e.stopPropagation(); showChapter(); setIsOpen(true) }}>
                                <BookOpenText />
                            </button>
                            <button className={btnClass('character')} title="Personnages" onClick={(e) => { e.stopPropagation(); showCharacter(); setIsOpen(true) }}>
                                <BookUser />
                            </button>
                            <button className={btnClass('lore')} title="Lore" onClick={(e) => { e.stopPropagation(); showLore(); setIsOpen(true) }}>
                                <ScrollText />
                            </button>
                            <button className={btnClass('snippet')} title="Snippets" onClick={(e) => { e.stopPropagation(); showSnippet(); setIsOpen(true) }}>
                                <Lightbulb />
                            </button>
                            <button className={btnClass('note')} title="Notes" onClick={(e) => { e.stopPropagation(); showNote(); setIsOpen(true) }}>
                                <NotebookPen />
                            </button>
                        </>
                    }
                </div>
            </div>

            {/* Page */}
            <div className="flex-1 px-40">
                {children}
            </div>

            {/* Bouton galerie flottant */}
            <button
                onClick={() => setIsGalleryOpen(true)}
                title="Galerie"
                className='fixed bottom-6 right-6 z-50 bg-orange-400 hover:bg-orange-500 text-white rounded-full p-4 shadow-lg transition-colors'
            >
                <Images size={22} />
            </button>

        </div>
    )
}