import React, { useState, useEffect } from 'react'

import { KeyRound, Mail, Gem, Book } from 'lucide-react'

import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalBook({ onSuccess }) {

    const [error, setError] = useState(null)
    const [book, setBook] = useState({})

    const api = useApi()


    const fieldBook = [
        { label: 'titre *', name: 'title', type: 'text' },
        { label: 'description', name: 'description', type: 'textarea' },
    ]

    const handleChange = (e) => {

        setBook(prev => ({ ...prev, [e.target.name]: e.target.value }))

    }


    const handleClick = async (e) => {

        e.preventDefault()
        setError('')


        const errorListe = {}
        const missingFields = []

        if (!book.title) missingFields.push('title')


        // if (missingFields.length > 0) {
        //     missingFields.forEach(field => errorListe[field] = true) // juste pour mettre en rouge
        //     errorListe.all = 'Le champ est obligatoire'
        //     return
        // }


        // const result = await api('book:create',book)
        const result = await api('book:createWithChapter',book)



        if (result.success) {
            onSuccess(result)

        } else {
            errorListe[result.type] = result.message
        }

        if (Object.keys(errorListe).length > 0) {
            setError(errorListe)
            return
        }

    }


    return (

        <div className=''>
            <section>
                <article className='border border-2 border-orange-100 bg-orange-100 rounded-lg m-4 p-4'>
                    {/* <Book /> */}
                    <h1 className='mb-4 text-center'>Livre</h1>
                    <form className="max-w-sm mx-auto flex flex-col gap-4">


                        <FormField fields={fieldBook} onChange={handleChange} errors={error} />

                        {error?.all && (
                            <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded">
                                {error.all}
                            </div>
                        )}

                        <div>
                            <button onClick={handleClick} className='border rounded rounded-lg px-4 py-2  bg-orange-300 text-white'>valider</button>
                        </div>


                    </form>
                </article>

            </section>


        </div>

    )


}