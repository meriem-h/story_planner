import React, { useState, useEffect } from 'react'
import { GitBranch } from 'lucide-react'
import Layout from '../component/layout/Layout'
import { useApi } from '../context/ApiContext'
import Modal from '../component/modal/Modal'
import ModalBook from '../component/modal/ModalBook'
import ModalChapter from '../component/modal/ModalChapter'
import ModalUnlockBook from '../component/modal/ModalUnlockBook'
import Editor from "../component/Editor"
import FormField from "../component/FormField"
import Timeline from '../component/Timeline'
import ModalTimelineFullscreen from '../component/modal/ModalTimelineFullscreen'

import { useTheme, THEMES } from '../context/ThemeContext'


export default function Home() {
    const api = useApi()
    const [isOpen, setIsOpen] = useState(false)
    const [isChapterOpen, setIsChapterOpen] = useState(false)
    const [books, setBooks] = useState([])
    const [selectedBook, setSelectedBook] = useState(null)
    const [tomes, setTomes] = useState([])
    const [selectedTome, setSelectedTome] = useState(null)
    const [chapters, setChapters] = useState([])
    const [selectedChapter, setSelectedChapter] = useState(null)
    const [chapterListeField, setChapterListeField] = useState(null)
    const [tomeListeField, setTomeListeField] = useState(null)
    const [content, setContent] = useState([])
    const [saved, setSaved] = useState(false)
    const [showTimeline, setShowTimeline] = useState(false)
    const [timelineKey, setTimelineKey] = useState(0)
    const [isTimelineFullscreen, setIsTimelineFullscreen] = useState(false)

    // ids des livres prives deverrouilles. Persiste en localStorage : un livre reste
    // deverrouille indefiniment (meme apres avoir ferme/rouvert l'appli) jusqu'a un clic
    // explicite sur le cadenas pour le reverrouiller manuellement.
    const [unlockedBookIds, setUnlockedBookIds] = useState(() => {
        const saved = localStorage.getItem('unlockedBookIds')
        return saved ? JSON.parse(saved) : []
    })
    // livre prive selectionne automatiquement au demarrage (dernier livre consulte) mais
    // pas encore deverrouille -- affiche un ecran "verrouille" a la place du contenu.
    const [pendingBook, setPendingBook] = useState(null)

    const { isDark } = useTheme()

    useEffect(() => {
        localStorage.setItem('unlockedBookIds', JSON.stringify(unlockedBookIds))
    }, [unlockedBookIds])

    const unlockBook = (bookId) => {
        setUnlockedBookIds(prev => prev.includes(bookId) ? prev : [...prev, bookId])
    }

    const lockBook = (bookId) => {
        setUnlockedBookIds(prev => prev.filter(id => id !== bookId))
        // si on verrouille le livre actuellement affiche, on efface TOUT son contenu affiche
        // (tomes, chapitres, chapitre selectionne) -- sinon la sidebar continue de montrer
        // les chapitres de ce livre, modifiables/supprimables, alors qu'il est cense etre verrouille
        if (selectedBook?.id === bookId) {
            setPendingBook(selectedBook)
            setSelectedBook(null)
            setTomes([])
            setSelectedTome(null)
            setChapters([])
            setSelectedChapter(null)
        }
    }

    useEffect(() => {
        !selectedBook ? fetchBooks() : fetchTomes(selectedBook.id)
    }, [selectedBook])

    useEffect(() => {
        if (selectedTome) fetchChapters(selectedTome.id)
    }, [selectedTome])

    useEffect(() => {
        if (!tomes.length) return
        const fildListe = tomes.map(t => ({
            value: t.id,
            text: t.title,
            selected: t.id == selectedTome?.id
        }))
        setTomeListeField([{ name: 'tome', type: 'select', value: selectedTome?.id || '', data: fildListe }])
    }, [tomes, selectedTome])

    useEffect(() => {
        if (!chapters.length) return
        const fildListe = chapters.map(element => ({
            value: element.id,
            text: element.title,
            selected: element.id == selectedChapter?.id
        }))
        setChapterListeField([{ name: 'chapter', type: 'select', value: selectedChapter?.id || '', data: fildListe }])
    }, [selectedChapter, chapters])

    useEffect(() => {
        if (selectedBook) localStorage.setItem('lastBookId', selectedBook.id)
    }, [selectedBook])

    useEffect(() => {
        if (selectedChapter) localStorage.setItem('lastChapterId', selectedChapter.id)
    }, [selectedChapter])

    useEffect(() => {
        if (selectedTome) localStorage.setItem('lastTomeId', selectedTome.id)
    }, [selectedTome])

    const fetchBooks = async () => {
        const result = await api('book:findAll')
        if (result.data.length > 0) {
            setBooks(result.data)
            const lastBookId = localStorage.getItem('lastBookId')
            const lastBook = lastBookId
                ? result.data.find(b => b.id == lastBookId) || result.data.reduce((a, b) =>
                    new Date(a.updated_at) > new Date(b.updated_at) ? a : b)
                : result.data.reduce((a, b) =>
                    new Date(a.updated_at) > new Date(b.updated_at) ? a : b)

            // si ce livre est prive et pas encore deverrouille pour cette session, on ne
            // l'ouvre pas tout seul -- on affiche l'ecran de verrouillage a la place
            if (lastBook.is_private && !unlockedBookIds.includes(lastBook.id)) {
                setPendingBook(lastBook)
            } else {
                setSelectedBook(lastBook)
            }
        }
    }

    const fetchTomes = async (bookId) => {
        const result = await api('tome:findBy', { book_id: bookId })
        if (result.data && result.data.length > 0) {
            setTomes(result.data)
            const lastTomeId = localStorage.getItem('lastTomeId')
            const lastTome = lastTomeId
                ? result.data.find(t => t.id == lastTomeId) || result.data[0]
                : result.data[0]
            setSelectedTome(lastTome)
        } else {
            setTomes([])
            setSelectedTome(null)
        }
    }

    const fetchChapters = async (tomeId) => {
        const result = await api('chapter:findBy', { tome_id: tomeId })
        if (result.data && result.data.length > 0) {
            setChapters(result.data)
            const lastChapterId = localStorage.getItem('lastChapterId')
            const lastChapter = lastChapterId
                ? result.data.find(c => c.id == lastChapterId) || result.data[0]
                : result.data[0]
            setSelectedChapter(lastChapter)
        } else {
            setChapters([])
            setSelectedChapter(null)
        }
    }

    const handleBookCreated = () => {
        setIsOpen(false)
        fetchBooks()
    }

    const handleChapterCreated = () => {
        setIsChapterOpen(false)
        fetchChapters(selectedTome.id)
    }

    const handleContentChange = (content) => {
        setContent(content)
    }

    const handleTomeChange = (e) => {
        const tome = tomes.find(t => t.id == e.target.value)
        setSelectedTome(tome)
    }

    const handleChapterChange = (e) => {
        const chapter = chapters.find(ch => ch.id == e.target.value)
        setSelectedChapter(chapter)
    }

    const changeBookTitle = async (e) => {
        await api('book:update', {
            id: selectedBook.id,
            data: { title: e.currentTarget.textContent }
        })
    }

    const changeChapterTitle = async (e) => {
        await api('chapter:update', {
            id: selectedChapter.id,
            data: { title: e.currentTarget.textContent }
        })
    }

    const saveChapter = async () => {
        if (!selectedChapter) return
        const updateResult = await api('chapter:update', {
            id: selectedChapter.id,
            data: { content }
        })
        if (updateResult.success == true) {
            setSaved(true)
            fetchChapters(selectedTome.id)
            setTimeout(() => setSaved(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-primary-50">
            <Layout
                chapters={chapters}
                books={books}
                selectedBook={selectedBook}
                setSelectedBook={setSelectedBook}
                selectedChapter={selectedChapter}
                setSelectedChapter={setSelectedChapter}
                tomes={tomes}
                selectedTome={selectedTome}
                setSelectedTome={setSelectedTome}
                addChapter={setIsChapterOpen}
                addBook={setIsOpen}
                fetchChapters={fetchChapters}
                fetchTomes={fetchTomes}
                showTimeline={showTimeline}
                setShowTimeline={setShowTimeline}
                refreshTimeline={() => setTimelineKey(k => k + 1)}
                onOpenFullscreen={() => setIsTimelineFullscreen(true)}
                onCloseFullscreen={() => setIsTimelineFullscreen(false)}
                unlockedBookIds={unlockedBookIds}
                unlockBook={unlockBook}
                lockBook={lockBook}
            >
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={50}>
                    <ModalBook onSuccess={handleBookCreated} />
                </Modal>
                <Modal isOpen={isChapterOpen} onClose={() => setIsChapterOpen(false)} size={50}>
                    <ModalChapter onSuccess={handleChapterCreated} book={selectedBook} tome={selectedTome} />
                </Modal>

                <Modal isOpen={isTimelineFullscreen} onClose={() => setIsTimelineFullscreen(false)} size={75}>
                    <ModalTimelineFullscreen
                        selectedTome={selectedTome}
                        chapters={chapters}
                        book={selectedBook}
                        onUpdate={() => {
                            setTimelineKey(k => k + 1)
                            fetchChapters(selectedTome.id)
                        }}
                    />
                </Modal>

                <Modal isOpen={!!pendingBook} onClose={() => setPendingBook(null)} size={40}>
                    {pendingBook && (
                        <ModalUnlockBook
                            book={pendingBook}
                            onClose={() => setPendingBook(null)}
                            onUnlocked={(book) => {
                                unlockBook(book.id)
                                setSelectedBook(book)
                                setPendingBook(null)
                            }}
                        />
                    )}
                </Modal>

                {books.length <= 0 ? (
                    <div className='flex justify-center pt-12'>
                        <button
                            onClick={() => setIsOpen(true)}
                            className='border-4 border-primary-200 rounded-xl w-[50%] text-center p-8 text-primary-300 hover:bg-primary-100 transition-colors'
                        >
                            + Créer un nouveau livre
                        </button>
                    </div>
                ) : !selectedBook ? (
                    <div className='flex flex-col items-center justify-center gap-3 pt-24 text-primary-300'>
                        <p>Choisis un livre dans le menu, ou crée-en un nouveau.</p>
                    </div>
                ) : (
                    <div className='flex flex-col h-screen overflow-hidden'>

                        {/* titre / timeline */}
                        {showTimeline ? (
                            <div className="flex items-center w-full overflow-hidden px-4 py-2">
                                <Timeline key={timelineKey} selectedTome={selectedTome} chapters={chapters} book={selectedBook} />
                            </div>
                        ) : (
                            <div className="text-center py-6 ">
                                <h1
                                    className='text-3xl font-bold text-primary-300 cursor-text outline-none'
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={changeBookTitle}
                                >
                                    {selectedBook?.title || 'Aucun livre'}
                                </h1>
                                <p
                                    className='text-lg text-primary-200 cursor-text outline-none mt-1'
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={changeChapterTitle}
                                >
                                    {selectedChapter?.title || ''}
                                </p>
                            </div>
                        )}

                        {/* barre d'actions */}
                        <div className={`flex justify-between rounded-t-2xl border-t-2 ${isDark ? 'border-primary-300' : 'border-primary-200'} items-center px-4 py-2 ${isDark ? 'bg-primary-200' : 'bg-primary-1'} shadow-sm`}>
                            <div className='flex items-center gap-4'>
                                {tomeListeField &&
                                    <FormField
                                        fields={tomeListeField}
                                        onChange={handleTomeChange}
                                        selectClass={"bg-transparent border-none outline-none cursor-pointer appearance-none text-sm text-primary-400 hover:text-primary-300 transition-colors"}
                                    />
                                }
                                {chapterListeField &&
                                    <FormField
                                        fields={chapterListeField}
                                        onChange={handleChapterChange}
                                        selectClass={"bg-transparent border-none outline-none cursor-pointer appearance-none text-xl text-primary-500 hover:text-primary-300 transition-colors"}
                                    />
                                }
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    onClick={() => setShowTimeline(!showTimeline)}
                                    title="Timeline"
                                    className={`flex items-center gap-2 px-4 py-2 transition-colors text-white rounded-lg text-sm font-bold ${showTimeline ? 'bg-primary-600' : 'bg-primary-300 hover:bg-primary-400'}`}
                                >
                                    <GitBranch size={16} />
                                </button>
                                <button
                                    onClick={() => setIsChapterOpen(true)}
                                    className='flex items-center gap-2 px-4 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg text-sm font-bold'
                                >
                                    + Chapitre
                                </button>
                                <button
                                    onClick={saveChapter}
                                    className={`flex items-center gap-2 px-4 py-2 transition-colors text-white rounded-lg text-sm font-bold ${saved ? 'bg-green-400' : 'bg-primary-300 hover:bg-primary-400'}`}
                                >
                                    {saved ? '✅ Sauvegardé !' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>

                        {/* éditeur */}
                        <div className='flex-1 overflow-hidden'>
                            <Editor
                                content={selectedChapter?.content}
                                onChange={handleContentChange}
                                chapters={chapters}
                                selectedChapter={selectedChapter}
                            />
                        </div>

                    </div>
                )}
            </Layout>
        </div>
    )
}