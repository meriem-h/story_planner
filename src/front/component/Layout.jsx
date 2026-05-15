import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Lightbulb, BookUser, BookOpenText, NotebookPen } from 'lucide-react'

import Chapter from "./ChapterLayout";
import Character from "./CharacterLayout";
import Snippet from "./SnippetLayout";
import Note from "./NoteLayout";


export default function Layout({ children }) {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState(<Chapter />)

    return (
        <div className="flex h-screen">

            {/* Sidebar */}
            <div className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden  bg-orange-200`}>

                <div className='p-4 flex gap-6 justify-center'>
                    <button onClick={() => setContent(<Chapter />)}> <BookOpenText className='' /> </button>
                    <button onClick={() => setContent(<Character />)}><BookUser className='' /></button>
                    <button onClick={() => setContent(<Snippet />)}><Lightbulb className='' /></button>
                    <button onClick={() => setContent(<Note />)}><NotebookPen className='' /></button>
                </div>

                <div>
                    {content}
                </div>

            
            </div>

            {/* Contenu */}
            <div className="flex-1 flex">
                {/* Burger */}
                <div className="p-4 bg-orange-200 flex flex-col" onClick={() => setIsOpen(!isOpen)}>
                    <button>
                        {isOpen ? <X />
                            : <div>
                                <Menu className='mb-4' />
                            </div>
                        }
                    </button>

                    {!isOpen &&
                        <>
                            <button onClick={() => setContent(<Chapter />)}><BookOpenText className='mb-4' /></button>
                            <button onClick={() => setContent(<Character />)}><BookUser className='mb-4' /></button>
                            <button onClick={() => setContent(<Snippet />)}><Lightbulb className='mb-4' /></button>
                            <button onClick={() => setContent(<Note />)}><NotebookPen className='mb-4' /></button>
                        </>
                    }


                </div>

                {/* Page */}
                <div className="flex-1 p-4">
                    {children}
                </div>
            </div>
        </div>
    )
}