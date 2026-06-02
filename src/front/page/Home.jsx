import React, { useState, useEffect } from 'react'
import Layout from '../component/layout/Layout'
import { useApi } from '../context/ApiContext'
import Modal from '../component/modal/Modal'
import ModalBook from '../component/modal/ModalBook'
import ModalChapter from '../component/modal/ModalChapter'
import Editor from "../component/Editor"
import FormField from "../component/FormField"

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
            setSelectedBook(lastBook)
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
        <div className="min-h-screen bg-orange-50">
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
            >
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={50}>
                    <ModalBook onSuccess={handleBookCreated} />
                </Modal>
                <Modal isOpen={isChapterOpen} onClose={() => setIsChapterOpen(false)} size={50}>
                    <ModalChapter onSuccess={handleChapterCreated} book={selectedBook} tome={selectedTome} />
                </Modal>

                {books.length <= 0 ? (
                    <div className='flex justify-center pt-12'>
                        <button
                            onClick={() => setIsOpen(true)}
                            className='border-4 border-orange-200 rounded-xl w-[50%] text-center p-8 text-orange-300 hover:bg-orange-100 transition-colors'
                        >
                            + Créer un nouveau livre
                        </button>
                    </div>
                ) : (
                    <div className='flex flex-col h-screen'>

                        {/* titre */}
                        <div className="text-center py-6 border-b border-orange-200">
                            <h1
                                className='text-3xl font-bold text-orange-300 cursor-text outline-none'
                                contentEditable
                                suppressContentEditableWarning
                                onInput={changeBookTitle}
                            >
                                {selectedBook?.title || 'Aucun livre'}
                            </h1>
                            <p
                                className='text-lg text-orange-200 cursor-text outline-none mt-1'
                                contentEditable
                                suppressContentEditableWarning
                                onInput={changeChapterTitle}
                            >
                                {selectedChapter?.title || ''}
                            </p>
                        </div>

                        {/* barre d'actions */}
                        <div className='flex justify-between items-center px-4 py-2 bg-white shadow-sm'>
                            <div className='flex items-center gap-4'>
                                {/* select tome */}
                                {tomeListeField &&
                                    <FormField
                                        fields={tomeListeField}
                                        onChange={handleTomeChange}
                                        selectClass={"bg-transparent border-none outline-none cursor-pointer appearance-none text-sm text-orange-400 hover:text-orange-300 transition-colors"}
                                    />
                                }
                                {/* select chapitre */}
                                {chapterListeField &&
                                    <FormField
                                        fields={chapterListeField}
                                        onChange={handleChapterChange}
                                        selectClass={"bg-transparent border-none outline-none cursor-pointer appearance-none text-xl text-orange-500 hover:text-orange-300 transition-colors"}
                                    />
                                }
                            </div>
                            <div className='flex gap-2'>
                                <button
                                    onClick={() => setIsChapterOpen(true)}
                                    className='flex items-center gap-2 px-4 py-2 bg-orange-300 hover:bg-orange-400 transition-colors text-white rounded-lg text-sm font-bold'
                                >
                                    + Chapitre
                                </button>
                                <button
                                    onClick={saveChapter}
                                    className={`flex items-center gap-2 px-4 py-2 transition-colors text-white rounded-lg text-sm font-bold ${saved ? 'bg-green-400' : 'bg-orange-300 hover:bg-orange-400'}`}
                                >
                                    {saved ? '✅ Sauvegardé !' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>

                        {/* éditeur */}
                        <div className='flex-1 overflow-hidden'>
                            {/* <Editor content={selectedChapter?.content} onChange={handleContentChange} /> */}
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