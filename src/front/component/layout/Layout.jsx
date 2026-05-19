import React, { useState, useEffect } from 'react'
import { X, Lightbulb, BookUser, BookOpenText, NotebookPen, ScrollText } from 'lucide-react'

import Chapter from "./ChapterLayout";
import Character from "./CharacterLayout";
import Snippet from "./SnippetLayout";
import Note from "./NoteLayout";
import Lore from "./LoreLayout";

export default function Layout({ children, books, selectedBook, setSelectedBook, chapters, selectedChapter, setSelectedChapter, addChapter, addBook, fetchChapters }) {

    const [isOpen, setIsOpen] = useState(false)
    const [activeView, setActiveView] = useState('chapter')
    const [content, setContent] = useState(<Chapter chapters={chapters} addChapter={addChapter} selectedChapter={selectedChapter} setSelectedChapter={setSelectedChapter} books={books} addBook={addBook} selectedBook={selectedBook} setSelectedBook={setSelectedBook} fetchChapters={fetchChapters} />)

    useEffect(() => {
        setContent(<Chapter chapters={chapters} selectedChapter={selectedChapter} setSelectedChapter={setSelectedChapter} books={books} selectedBook={selectedBook} setSelectedBook={setSelectedBook} addChapter={addChapter} addBook={addBook} fetchChapters={fetchChapters} />)
    }, [chapters, selectedChapter, books, selectedBook])

    const btnClass = (view) => `rounded-2xl p-2 transition-colors ${activeView === view ? 'bg-orange-600 text-orange-100' : 'bg-orange-400 text-orange-100 hover:bg-orange-500'}`

    const showChapter = () => {
        setActiveView('chapter')
        setContent(<Chapter chapters={chapters} selectedChapter={selectedChapter} setSelectedChapter={setSelectedChapter} books={books} selectedBook={selectedBook} setSelectedBook={setSelectedBook} addChapter={addChapter} addBook={addBook} fetchChapters={fetchChapters} />)
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
        setContent(<Snippet selectedBook={selectedBook} />)
    }
    const showNote = () => {
        setActiveView('note')
        setContent(<Note selectedBook={selectedBook} />)
    }

    return (
        <div className="flex">

            {/* Sidebar */}
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

            {/* Contenu */}
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
        </div>
    )
}