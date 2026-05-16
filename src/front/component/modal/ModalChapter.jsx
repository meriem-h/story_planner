import React, { useState, useEffect } from 'react'

import { KeyRound, Mail, Gem, chapter } from 'lucide-react'

import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalChapter({ onSuccess, book }) {

    const [error, setError] = useState(null)
    const [chapter, setChapter] = useState({book_id: book.id})

    const api = useApi()


    const fieldBook = [
        { name: 'title', type: 'text' },
    ]

    const handleChange = (e) => {

        setChapter(prev => ({ ...prev, [e.target.name]: e.target.value }))

    }




    const handleClick = async (e) => {

        e.preventDefault()
        setError('')


        const errorListe = {}
        const missingFields = []

        if (!chapter.title) missingFields.push('title')

        const result = await api('chapter:create', chapter)



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
                    <chapter />
                    <h1 className='mb-4 text-center'>Nouveau chapitre</h1>
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