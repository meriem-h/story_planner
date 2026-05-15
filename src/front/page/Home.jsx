import React, { useState, useEffect } from 'react'
import Layout from '../component/Layout'
import { useApi } from '../context/ApiContext'

import Modal from '../component/modal/Modal'
import ModalBook from '../component/modal/ModalBook'


export default function Dashboard() {

    const api = useApi()

    const [isOpen, setIsOpen] = useState(false)
    const [book, setBook] = useState([])
    const [selectedBook, setSelectedBook] = useState([])



    useEffect(() => {

        console.log("book => ", book)

    }, [book]);

    useEffect(() => {
        const fetchBooks = async () => {
            const result = await api('book:findAll')
            setBook(result)
        }
    }, [])



    const selectBook = async (e) => {
        let id = e.target.value
        const result = await api('wedding:findById', id)
        setSelectedBook(result)
    }

    const addBook = (e) => {

        setIsOpen(true)
    }

    return (
        <div className="min-h-screen bg-orange-50 ">

            {/* menu burger */}
            <Layout>

                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Créer un nouveau livre" size={50}>
                    <ModalBook />
                </Modal>

                <div className=''>

                    {/* titre */}
                    <h1 className="text-4xl text-center mb-8 font-bold text-orange-300">
                        Mode ecriture

                    </h1>
                    {/* content */}
                    <div>

                        <section className='flex justify-end'>
                            {/* menue */}

                            <div>
                                <button onClick={addBook} className='border rounded rounded-lg px-4 py-2  bg-orange-300 text-white '>ajouter un livre</button>
                            </div>
                        </section>


                        {/* edditeur de texte  */}
                        <section className='mt-10'>

                            <p>ici mettre editeur texte</p>

                        </section>
                    </div>

                </div>
            </Layout>

        </div>
    )
}