import React, { useState, useEffect } from 'react'
import Layout from '../component/Layout'
import { useApi } from '../context/ApiContext'

import Modal from '../component/modal/Modal'
import ModalBook from '../component/modal/ModalBook'
import Editor from "../component/Editor";


export default function Dashboard() {

    const api = useApi()

    const [isOpen, setIsOpen] = useState(false)
    const [book, setBook] = useState([])
    const [selectedBook, setSelectedBook] = useState([])

    useEffect(() => {
        fetchBooks()
    }, [])


    useEffect(() => {
        console.log("book => ", book)
    }, [book]);

    const fetchBooks = async () => {
        const result = await api('book:findAll')
        setBook(result.data)
    }


    const selectBook = async (id) => {
        console.log('book id => ', id);
    }

    // const selectBook = async (e) => {
    //     let id = e.target.value
    //     const result = await api('book:findAll')
    //     // const result = await api('book:findById', id)
    //     setSelectedBook(result)
    // }

    const addBook = async (e) => {
        // const result = await api('book:Create', book)

        setIsOpen(true)
    }
    const createBook = async (e) => {
        // const result = await api('book:Create', book)
        console.log('create book => ', e);
        // setIsOpen(true)
    }

    return (
        <div className="min-h-screen bg-orange-50 ">

            {/* menu burger */}
            <Layout>

                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Créer un nouveau livre" size={50}>
                    <ModalBook onSuccess={selectBook} />
                </Modal>

                <div className=''>

                    {/* titre */}
                    <div className="text-center mb-8 font-bold text-orange-300">

                        <h1 id='bookTitle' className='text-4xl'>Titre du livre</h1>
                        <p id='chapterTitle' className='text-2xl'>tittre du chapitre</p>
                    </div>
                    {/* content */}

                    {book.length <= 0 ?

                        <div className='flex justify-center pt-12'>
                            <button onClick={addBook} className='border border-4 border-orange-200 w-[50%] text-center p-6'>
                                crée un nouveau livre
                            </button>
                        </div>

                        :

                        <div>

                            <section className='flex justify-end'>
                                {/* menue */}

                                <div>
                                    <button onClick={addBook} className='border rounded rounded-lg px-4 py-2  bg-orange-300 text-white '>ajouter un nouveau chapitre</button>
                                </div>
                            </section>


                            {/* edditeur de texte  */}
                            <section className='mt-10'>
                                <Editor />
                            </section>
                        </div>
                    }

                </div>
            </Layout>

        </div>
    )
}