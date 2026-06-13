import React, { useState, useEffect } from 'react'
import { X, Lightbulb, BookUser, BookOpenText, NotebookPen, ScrollText, Images, Download, GitBranch, ChevronRight, ChevronLeft, Palette } from 'lucide-react'
import { useTheme, THEMES } from '../../context/ThemeContext'

import ModalExport from '../modal/ModalExport'
import Chapter from "./ChapterLayout";
import Character from "./CharacterLayout";
import Snippet from "./SnippetLayout";
import Note from "./NoteLayout";
import Lore from "./LoreLayout";
import Modal from '../modal/Modal';
import ModalGallery from '../modal/ModalGallery';

export default function Layout({ children, books, selectedBook, setSelectedBook, chapters, selectedChapter, setSelectedChapter, addChapter, addBook, fetchChapters, tomes, selectedTome, setSelectedTome, fetchTomes, showTimeline, setShowTimeline, refreshTimeline }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeView, setActiveView] = useState('chapter')
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const { theme, changeTheme, THEME_NAMES } = useTheme()
    const [isFloatingOpen, setIsFloatingOpen] = useState(true)
    const [isThemeOpen, setIsThemeOpen] = useState(false)

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
        if (activeView === 'snippet') {
            setContent(<Snippet selectedBook={selectedBook} selectedTome={selectedTome} chapters={chapters} />)
        }
    }, [chapters, selectedChapter, books, selectedBook, tomes, selectedTome])

    const btnClass = (view) => `rounded-2xl p-2 transition-colors ${activeView === view ? 'bg-primary-600 text-primary-100' : 'bg-primary-400 text-primary-100 hover:bg-primary-500'}`

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
        setContent(<Snippet selectedBook={selectedBook} selectedTome={selectedTome} chapters={chapters} refreshTimeline={refreshTimeline} />)
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
            <Modal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} size={50}>
                <ModalExport
                    book={selectedBook}
                    tome={selectedTome}
                    chapters={chapters}
                    selectedChapter={selectedChapter}
                />
            </Modal>

            {/* Sidebar ouverte */}
            <div className={`${isOpen ? 'w-80 px-4' : 'w-0'} transition-all duration-300 overflow-hidden bg-primary-200`}>
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
                    <button className='bg-primary-400 rounded-2xl p-2 text-primary-100 hover:bg-primary-500' onClick={() => setIsOpen(!isOpen)}>
                        <X />
                    </button>
                </div>
                <div>{content}</div>
            </div>

            {/* Sidebar fermée */}
            <div className="flex">
                <div className={`${isOpen && "hidden"} p-4 bg-primary-200 flex flex-col gap-4`} onClick={() => setIsOpen(!isOpen)}>
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
            <div className="flex-1 min-w-0 overflow-hidden px-40">
                {children}
            </div>

            {/* 
            <section>
                 Bouton galerie flottant
                <button
                    onClick={() => setIsGalleryOpen(true)}
                    title="Galerie"
                    className='fixed bottom-6 right-24 z-50 bg-primary-400 hover:bg-primary-500 text-white rounded-full p-4 shadow-lg transition-colors'
                >
                    <Images size={22} />
                </button>

                 Bouton download flottant
                <button
                    onClick={() => setIsExportOpen(true)}
                    title="Exporter"
                    className='fixed bottom-6 right-6 z-50 bg-primary-400 hover:bg-primary-500 text-white rounded-full p-4 shadow-lg transition-colors'

                >
                    <Download size={22} />
                </button>

                 Bouton Timeline flottant
                <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    title="Timeline"
                    className={`fixed bottom-6 right-44 z-50 text-white rounded-full p-4 shadow-lg transition-colors ${showTimeline ? 'bg-primary-600' : 'bg-primary-400 hover:bg-primary-500'}`}
                >
                    <GitBranch size={22} />
                </button>
            </section>
            */}


            <section className="fixed bottom-6 right-0 z-50 flex items-end gap-2">

                {/* Popover couleurs */}
                {isThemeOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsThemeOpen(false)} />
                        <div className="absolute bottom-0 right-full mr-2 z-20 bg-white border border-primary-200 rounded-2xl shadow-lg p-3 flex flex-wrap gap-2 w-64">
                            {THEME_NAMES.map(name => (
                                <button
                                    key={name}
                                    onClick={() => { changeTheme(name); setIsThemeOpen(false) }}
                                    title={name}
                                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${theme === name ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                    style={{ backgroundColor: THEMES[name][400] }}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Barre flottante */}
                {isFloatingOpen && (
                    <div className="flex flex-col gap-3 bg-primary-200 rounded-l-2xl p-3 shadow-lg">
                        <button
                            onClick={() => setIsThemeOpen(prev => !prev)}
                            title="Thème"
                            className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                        >
                            <Palette size={20} />
                        </button>
                        <button
                            onClick={() => setIsGalleryOpen(true)}
                            title="Galerie"
                            className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                        >
                            <Images size={20} />
                        </button>
                        <button
                            onClick={() => setIsExportOpen(true)}
                            title="Exporter"
                            className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={() => setShowTimeline(!showTimeline)}
                            title="Timeline"
                            className={`text-white rounded-full p-3 transition-colors ${showTimeline ? 'bg-primary-600' : 'bg-primary-400 hover:bg-primary-500'}`}
                        >
                            <GitBranch size={20} />
                        </button>
                    </div>
                )}

                {/* Bouton toggle */}
                <button
                    onClick={() => setIsFloatingOpen(prev => !prev)}
                    className="bg-primary-400 hover:bg-primary-500 text-white rounded-l-full p-2 shadow-lg transition-colors mb-3 mr-0"
                >
                    {isFloatingOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

            </section>

        </div>
    )
}