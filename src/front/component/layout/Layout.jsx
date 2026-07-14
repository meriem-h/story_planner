import React, { useState, useEffect } from 'react'
import { X, Lightbulb, BookUser, BookOpenText, NotebookPen, ScrollText, Images, Download, GitBranch, ChevronRight, ChevronLeft, Palette, CalendarDays, Network, UsersRound } from 'lucide-react'

import { useTheme, THEMES } from '../../context/ThemeContext'

import ModalExport from '../modal/ModalExport'
import Chapter from "./ChapterLayout";
import Character from "./CharacterLayout";
import Snippet from "./SnippetLayout";
import Note from "./NoteLayout";
import Lore from "./LoreLayout";
import Modal from '../modal/Modal';
import ModalGallery from '../modal/ModalGallery';
import ModalSchedule from '../modal/ModalSchedule';
import ModalOrganization from '../modal/ModalOrganization';
import ModalFamilyTree from '../modal/ModalFamilyTree';

export default function Layout({ children, books, selectedBook, setSelectedBook, chapters, selectedChapter, setSelectedChapter, addChapter, addBook, fetchChapters, tomes, selectedTome, setSelectedTome, fetchTomes, showTimeline, setShowTimeline, refreshTimeline, onOpenFullscreen, onCloseFullscreen, unlockedBookIds, unlockBook, lockBook }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeView, setActiveView] = useState('chapter')
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [isExportOpen, setIsExportOpen] = useState(false)
    const [isCallandarOpen, setIsCallandarOpen] = useState(false)
    const [isOrgOpen, setIsOrgOpen] = useState(false)
    const [isFamilyTreeOpen, setIsFamilyTreeOpen] = useState(false)
    const { theme, changeTheme, THEME_NAMES, isDark, toggleDark } = useTheme()

    const [isFloatingOpen, setIsFloatingOpen] = useState(true)
    const [isThemeOpen, setIsThemeOpen] = useState(false)

    const chapterProps = {
        chapters, selectedChapter, setSelectedChapter,
        books, selectedBook, setSelectedBook,
        addChapter, addBook, fetchChapters,
        tomes, selectedTome, setSelectedTome,
        fetchTomes,
        unlockedBookIds, unlockBook, lockBook
    }

    const closeAllModals = () => {
        setIsGalleryOpen(false)
        setIsExportOpen(false)
        setIsCallandarOpen(false)
        setIsOrgOpen(false)
        setIsFamilyTreeOpen(false)
        onCloseFullscreen(false)
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
        <div className="flex h-screen">

            <Modal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} size={60}>
                <ModalGallery book={selectedBook} />
            </Modal>
            <Modal isOpen={isCallandarOpen} onClose={() => setIsCallandarOpen(false)} size={80}>
                <ModalSchedule book={selectedBook} chapters={chapters} />
            </Modal>
            <Modal isOpen={isOrgOpen} onClose={() => setIsOrgOpen(false)} size={80}>
                <ModalOrganization book={selectedBook} />
            </Modal>
            <Modal isOpen={isFamilyTreeOpen} onClose={() => setIsFamilyTreeOpen(false)} size={80}>
                <ModalFamilyTree book={selectedBook} />
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
            <div className={`${isOpen ? 'w-80 px-4' : 'w-0'} h-full flex flex-col transition-all duration-300 overflow-hidden bg-primary-200`}>
                <div className='p-4 flex gap-2 justify-center flex-shrink-0'>
                    <button className={btnClass('chapter')} title="Chapitres" onClick={showChapter}>
                        <BookOpenText />
                    </button>
                    {selectedBook &&
                        <button className={btnClass('character')} title="Personnages" onClick={showCharacter}>
                            <BookUser />
                        </button>
                    }
                    {selectedBook &&
                        <button className={btnClass('lore')} title="Lore" onClick={showLore}>
                            <ScrollText />
                        </button>
                    }
                    {selectedBook &&
                        <button className={btnClass('snippet')} title="Snippets" onClick={showSnippet}>
                            <Lightbulb />
                        </button>
                    }
                    {selectedBook &&
                        <button className={btnClass('note')} title="Notes" onClick={showNote}>
                            <NotebookPen />
                        </button>
                    }
                    <button className='bg-primary-400 rounded-2xl p-2 text-primary-100 hover:bg-primary-500' onClick={() => setIsOpen(!isOpen)}>
                        <X />
                    </button>
                </div>
                <div className='flex-1 min-h-0'>{content}</div>
            </div>

            {/* Sidebar fermée */}
            <div className="flex">
                <div className={`${isOpen && "hidden"} p-4 bg-primary-200 flex flex-col gap-4`} onClick={() => setIsOpen(!isOpen)}>
                    {!isOpen &&
                        <>
                            <button className={btnClass('chapter')} title="Chapitres" onClick={(e) => { e.stopPropagation(); showChapter(); setIsOpen(true) }}>
                                <BookOpenText />
                            </button>
                            {selectedBook &&
                                <button className={btnClass('character')} title="Personnages" onClick={(e) => { e.stopPropagation(); showCharacter(); setIsOpen(true) }}>
                                    <BookUser />
                                </button>
                            }
                            {selectedBook &&
                                <button className={btnClass('lore')} title="Lore" onClick={(e) => { e.stopPropagation(); showLore(); setIsOpen(true) }}>
                                    <ScrollText />
                                </button>
                            }
                            {selectedBook &&
                                <button className={btnClass('snippet')} title="Snippets" onClick={(e) => { e.stopPropagation(); showSnippet(); setIsOpen(true) }}>
                                    <Lightbulb />
                                </button>
                            }
                            {selectedBook &&
                                <button className={btnClass('note')} title="Notes" onClick={(e) => { e.stopPropagation(); showNote(); setIsOpen(true) }}>
                                    <NotebookPen />
                                </button>
                            }
                        </>
                    }
                </div>
            </div>

            {/* Page */}
            <div className="flex-1 min-w-0 overflow-hidden px-40">
                {children}
            </div>




            <section className="fixed bottom-6 right-0 z-50 flex items-end gap-2">

                {/* Popover couleurs */}
                {isThemeOpen && isFloatingOpen && (

                    <div className="absolute bottom-0 right-full mr-2 z-20 bg-primary-50 border border-primary-200 rounded-2xl shadow-lg p-3 flex flex-col gap-3 w-64">

                        {/* Toggle dark mode */}
                        <button
                            onClick={toggleDark}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors"
                        >
                            <span className="text-sm font-medium text-primary-700">Mode {isDark ? 'claire' : 'sombre'}</span>
                            <span>{isDark ? '☀️' : '🌙'}</span>
                        </button>

                        <hr className="border-primary-100" />

                        {/* Couleurs */}
                        <div className="flex flex-wrap gap-2">
                            {THEME_NAMES.map(name => (
                                <button
                                    key={name}
                                    onClick={() => { changeTheme(name) }}
                                    title={name}
                                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${theme === name ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                    style={{ backgroundColor: THEMES[name][400] }}
                                />
                            ))}
                        </div>
                    </div>
                )}


                <div className='flex flex-col'>
                    {/* Barre flottante */}

                    <div className={`flex flex-col gap-3 bg-primary-200 rounded-l-2xl p-3 shadow-lg transition-all duration-300 overflow-hidden ${isFloatingOpen ? 'max-h-[100%] opacity-100' : 'max-h-0 opacity-0 p-0'}`}>


                        {selectedBook &&

                            <button
                                onClick={() => { closeAllModals(); onOpenFullscreen(true) }}
                                title="Timeline"
                                className={`text-white rounded-full p-3 transition-colors ${showTimeline ? 'bg-primary-600' : 'bg-primary-400 hover:bg-primary-500'}`}
                            >
                                <GitBranch size={20} />
                            </button>
                        }

                        {selectedBook &&
                            <button
                                onClick={() => { closeAllModals(); setIsCallandarOpen(true) }}

                                title="Callandar"
                                className={`text-white rounded-full p-3 transition-colors bg-primary-400 hover:bg-primary-500`}
                            >
                                <CalendarDays size={20} />
                            </button>
                        }
                        {selectedBook &&
                            <button
                                onClick={() => { closeAllModals(); setIsOrgOpen(true) }}

                                title="Organisation Chart"
                                className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                            >
                                <Network size={20} />
                            </button>
                        }
                        {selectedBook &&
                            <button
                                onClick={() => { closeAllModals(); setIsFamilyTreeOpen(true) }}

                                title="Arbre genealogique"
                                className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                            >
                                <UsersRound size={20} />
                            </button>
                        }

                        {selectedBook &&
                            <button
                                onClick={() => { closeAllModals(); setIsGalleryOpen(true) }}

                                title="Galerie"
                                className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                            >
                                <Images size={20} />
                            </button>
                        }


                        <button
                            onClick={() => setIsThemeOpen(prev => !prev)}

                            title="Thème"
                            className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                        >
                            <Palette size={20} />
                        </button>
                        {selectedBook &&
                            <button
                                onClick={() => { closeAllModals(); setIsExportOpen(true) }}

                                title="Exporter"
                                className="bg-primary-400 hover:bg-primary-500 text-white rounded-full p-3 transition-colors"
                            >
                                <Download size={20} />
                            </button>
                        }
                    </div>

                    {/* Bouton toggle */}
                    <button
                        onClick={() => setIsFloatingOpen(prev => !prev)}
                        className="bg-primary-400 hover:bg-primary-500 text-white rounded-l-full p-2 shadow-lg transition-colors mb-3 mr-0"
                    >
                        {isFloatingOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                </div>
            </section>

        </div >
    )
}