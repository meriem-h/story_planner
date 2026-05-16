import React, { useState } from 'react'
import { FilePlus, ChevronUp, BadgePlus } from 'lucide-react'

export default function ChapterLayout(props) {
    const [descOpen, setDescOpen] = useState(false)
    const [bookOpen, setBookOpen] = useState(false)

    const changeChapter = async (e) => {
        const chapter = props.chapters.find(ch => ch.id == e.target.dataset.id)
        props.setSelectedChapter(chapter)
    }
    const addChapter = async (e) => {
        props.addChapter(true)

    }
    const addBook = async (e) => {
        props.addBook(true)
    }
    const changeBook = async (e) => {
        const book = props.books.find(b => b.id == e.target.value)
        props.setSelectedBook(book)
    }

    return (
        <div>
            <section className='flex justify-between py-4 ps-2'>
                <div className='mb-4 w-full'>
                    <div>
                        <div className='flex justify-between mb-4'>
                            <select
                                className='w-full bg-transparent border-none outline-none cursor-pointer font-bold text-lg appearance-none'
                                value={props.selectedBook?.id}
                                onChange={changeBook}
                            >
                                {props.books?.map((book) => (
                                    <option key={book.id} value={book.id}>
                                        {book.title}
                                    </option>
                                ))}

                            </select>
                            <button onClick={addBook}>

                                <BadgePlus />
                            </button>
                        </div>

                    </div>

                    <div>
                        <div className='flex justify-between mb-4 cursor-pointer' onClick={() => setDescOpen(!descOpen)}>
                            <p>Description :</p>
                            <ChevronUp className={`transition-transform duration-300 ${descOpen ? 'rotate-0' : 'rotate-180'}`} />
                        </div>

                        <div className={`overflow-hidden transition-all duration-300 ${descOpen ? 'max-h-40' : 'max-h-0'}`}>
                            <p className='ml-4 overflow-y-auto'>{props.selectedBook?.description}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className='ml-4'>
                <div className='flex justify-between'>
                    <p>Liste des chapitres :</p>
                    <button onClick={addChapter}>
                        <BadgePlus />
                    </button>

                </div>
                <div className='p-4 overflow-y-auto max-h-[calc(90vh-80px)] flex flex-col items-start gap-4 ml-4'>
                    {props?.chapters?.map((chapter) => (
                        <li key={chapter.id}>
                            <button data-id={chapter.id} onClick={changeChapter}>
                                {chapter.title}
                            </button>
                        </li>
                    ))}



                </div>
            </section>
        </div>
    )
}