import React, { useState, useEffect } from 'react'
import Layout from '../component/Layout'
import { useApi } from '../context/ApiContext'
import Modal from '../component/modal/Modal'
import ModalBook from '../component/modal/ModalBook'
import ModalChapter from '../component/modal/ModalChapter'
import Editor from "../component/Editor"
import FormField from "../component/FormField";

export default function Home() {
    const api = useApi()
    const [isOpen, setIsOpen] = useState(false)
    const [isChapterOpen, setIsChapterOpen] = useState(false)
    const [books, setBooks] = useState([])
    const [selectedBook, setSelectedBook] = useState(null)
    const [chapters, setChapters] = useState([])
    const [selectedChapter, setSelectedChapter] = useState(null)
    const [chapterListeField, setChapterListeField] = useState(null)
    const [content, setContent] = useState([])
    const [saved, setSaved] = useState(false)


    // 1. Au démarrage → charge les livres
    useEffect(() => {
        fetchBooks()
    }, [])


    useEffect(() => {
        console.log("selectedChapter => ", selectedChapter);
        console.log("chapterListeField => ", chapterListeField);
    }, [selectedChapter, chapterListeField])

    // 2. Quand selectedBook change → charge les chapitres
    useEffect(() => {
        if (!selectedBook) return
        fetchChapters(selectedBook.id)
    }, [selectedBook])

    const fetchBooks = async () => {
        const result = await api('book:findAll')
        if (result.data.length > 0) {
            setBooks(result.data)
            // dernier livre modifié
            const lastBook = result.data.reduce((a, b) =>
                new Date(a.updated_at) > new Date(b.updated_at) ? a : b
            )
            setSelectedBook(lastBook)
        }
    }

    const fetchChapters = async (bookId) => {
        const result = await api('chapter:findBy', { book_id: bookId })
        const fildListe = []

        console.log('chapter data => ', result);
        if (result.data && result.data.length > 0) {  // ← vérifie que data existe
            setChapters(result.data)
            const lastChapter = result.data.reduce((a, b) =>
                new Date(a.updated_at) > new Date(b.updated_at) ? a : b
            )
            setSelectedChapter(lastChapter)


            // la je crée les filds
            result.data.forEach(element => {
                element.id == lastChapter.id ?
                    fildListe.push({ value: element.id, text: element.title, selected: true })
                    :
                    fildListe.push({ value: element.id, text: element.title })
            });
            setChapterListeField([{
                name: 'chapter', type: 'select', data: fildListe
            }])


        } else {
            setChapters([])
            setSelectedChapter(null)
        }
    }

    const handleBookCreated = (bookId) => {
        setIsOpen(false)
        fetchBooks()
    }
    const handleChapterCreated = (bookId) => {

        console.log('bookId => ', bookId);
        setIsChapterOpen(false)
        fetchChapters(bookId.id)
    }

    const handleContentChange = (content) => {
        setContent(content)
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

        const updateResult =
            await api('chapter:update', {
                id: selectedChapter.id,
                data: { content }
            })

        if (updateResult.success == true) {
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-orange-50">
            <Layout
                books={books}
                selectedBook={selectedBook}
                setSelectedBook={setSelectedBook}
                chapters={chapters}
                selectedChapter={selectedChapter}
                setSelectedChapter={setSelectedChapter}
            >
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Créer un nouveau livre" size={50}>
                    <ModalBook onSuccess={handleBookCreated} />
                </Modal>
                <Modal isOpen={isChapterOpen} onClose={() => setIsChapterOpen(false)} title="Créer un nouveau chapitre" size={50}>
                    <ModalChapter onSuccess={handleChapterCreated} book={selectedBook} />
                </Modal>

                <div className=''>
                    <div className="text-center mb-8 font-bold text-orange-300">
                        {/* <h1 className='text-4xl'>{selectedBook?.title || 'Aucun livre'}</h1> */}

                        <h1
                            className='text-4xl'
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => {
                                changeBookTitle(e)
                            }}
                        >
                            {selectedBook?.title || 'Aucun livre'}
                        </h1>

                        <p className='text-2xl'
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => {
                                changeChapterTitle(e)
                            }}>{selectedChapter?.title || ''}</p>
                    </div>

                    {books.length <= 0 ?
                        <div className='flex justify-center pt-12'>
                            <button onClick={() => setIsOpen(true)} className='border border-4 border-orange-200 w-[50%] text-center p-6'>
                                crée un nouveau livre
                            </button>
                        </div>
                        :
                        <div>



                            <section className='flex justify-between'>
                                <div>
                                    {chapterListeField &&

                                        <FormField fields={chapterListeField} onChange={handleChapterChange} />
                                    }
                                </div>

                                <div className='flex justify-end'>

                                    <button onClick={() => setIsChapterOpen(true)} className='border rounded-lg px-4 py-2 bg-orange-300 text-white'>
                                        ajouter un nouveau chapitre
                                    </button>
                                    <button onClick={saveChapter} className='border rounded-lg px-4 py-2 bg-orange-300 text-white'>
                                        Enregistrer
                                    </button>
                                </div>

                            </section>
                            <section className='mt-10'>
                                {saved && (
                                    <span className="text-green-500">✅ Sauvegardé !</span>
                                )}
                                <Editor content={selectedChapter?.content} onChange={handleContentChange} />
                            </section>
                        </div>
                    }
                </div>
            </Layout>
        </div>
    )
}