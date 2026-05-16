import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Lightbulb, BookUser, BookOpenText, NotebookPen } from 'lucide-react'

import Chapter from "./ChapterLayout";
import Character from "./CharacterLayout";
import Snippet from "./SnippetLayout";
import Note from "./NoteLayout";


export default function Layout({ children, books, selectedBook, setSelectedBook, chapters, selectedChapter, setSelectedChapter, addChapter, addBook }) {

    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState(<Chapter chapters={chapters} addChapter={addChapter} selectedChapter={selectedChapter} setSelectedChapter={setSelectedChapter} books={books} addBook={addBook} selectedBook={selectedBook} setSelectedBook={setSelectedBook} />)

    useEffect(() => {
        setContent(<Chapter chapters={chapters} selectedChapter={selectedChapter} setSelectedChapter={setSelectedChapter} books={books} selectedBook={selectedBook} setSelectedBook={setSelectedBook} addChapter={addChapter} addBook={addBook} />)
    }, [chapters, selectedChapter, books, selectedBook])

    return (
        <div className="flex h-screen">

            {/* Sidebar */}
            <div className={`${isOpen ? 'w-80 px-4' : 'w-0'} transition-all duration-300 overflow-hidden  bg-orange-200`}>

                <div className='p-4 flex gap-2 justify-center'>
                    <button className='bg-orange-400 rounded-2xl p-2 text-orange-100'
                        onClick={() => setContent(<Chapter
                            chapters={chapters}
                            selectedChapter={selectedChapter}
                            setSelectedChapter={setSelectedChapter}
                            books={books}
                            selectedBook={selectedBook}
                            setSelectedBook={setSelectedBook}
                            addChapter={addChapter}
                            addBook={addBook}
                        />)}> <BookOpenText className='' /></button>
                    <button className='bg-orange-400 rounded-2xl p-2 text-orange-100' onClick={() => setContent(<Character selectedBook={selectedBook}/>)}><BookUser /></button>
                    <button className='bg-orange-400 rounded-2xl p-2 text-orange-100' onClick={() => setContent(<Snippet selectedBook={selectedBook}/>)}><Lightbulb /></button>
                    <button className='bg-orange-400 rounded-2xl p-2 text-orange-100' onClick={() => setContent(<Note selectedBook={selectedBook}/>)}><NotebookPen /></button>
                    <button className='bg-orange-400 rounded-2xl p-2 text-orange-100' onClick={() => setIsOpen(!isOpen)}><X /></button>

                </div>

                <div>
                    {content}
                </div>


            </div>

            {/* Contenu */}
            <div className="flex">
                {/* Burger */}
                <div className={`${isOpen && "hidden" } p-4 bg-orange-200 flex flex-col gap-4`} onClick={() => setIsOpen(!isOpen)}>


                    {!isOpen &&
                        <>
                            <button className='bg-orange-400 rounded-2xl p-2 text-orange-100'
                                onClick={() => setContent(<Chapter
                                    chapters={chapters}
                                    selectedChapter={selectedChapter}
                                    setSelectedChapter={setSelectedChapter}
                                    books={books}
                                    selectedBook={selectedBook}
                                    setSelectedBook={setSelectedBook}
                                    addChapter={addChapter}
                                    addBook={addBook}
                                />)}> <BookOpenText className='' /></button>
                            <button className='bg-orange-400 rounded-2xl p-2 text-orange-100' onClick={() => setContent(<Character selectedBook={selectedBook} />)}><BookUser /></button>
                            <button className='bg-orange-400 rounded-2xl p-2 text-orange-100' onClick={() => setContent(<Snippet selectedBook={selectedBook} />)}><Lightbulb /></button>
                            <button className='bg-orange-400 rounded-2xl p-2 text-orange-100' onClick={() => setContent(<Note selectedBook={selectedBook} />)}><NotebookPen /></button>
                        </>
                    }


                </div>

                
            </div>

            {/* Page */}
            <div className="flex-1 py-10 px-40">
                    {children}
                </div>
        </div>
    )
}