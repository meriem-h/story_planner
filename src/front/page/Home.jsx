import React, { useState, useEffect } from 'react'
import Layout from '../component/layout/Layout'
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


    // Au démarrage → charge les livres  Quand selectedBook change → charge les chapitres
    useEffect(() => {
        !selectedBook ? fetchBooks()
        : fetchChapters(selectedBook.id)
    }, [selectedBook])

    useEffect(() => {
        if (!chapters.length) return
        const fildListe = chapters.map(element => ({
          value: element.id,
          text: element.title,
          selected: element.id == selectedChapter?.id
        }))
        setChapterListeField([{ name: 'chapter', type: 'select', data: fildListe }])
      }, [selectedChapter])

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
            chapters={chapters}
            books={books}
            selectedBook={selectedBook}
            setSelectedBook={setSelectedBook}
            selectedChapter={selectedChapter}
            setSelectedChapter={setSelectedChapter}
            addChapter={setIsChapterOpen}
            addBook={setIsOpen}
          >
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={50}>
              <ModalBook onSuccess={handleBookCreated} />
            </Modal>
            <Modal isOpen={isChapterOpen} onClose={() => setIsChapterOpen(false)} size={50}>
              <ModalChapter onSuccess={handleChapterCreated} book={selectedBook} />
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
      
                {/* titre + sous titre */}
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
                  <div>
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
                  <Editor content={selectedChapter?.content} onChange={handleContentChange} />
                </div>
      
              </div>
            )}
      
          </Layout>
        </div>
      )


}