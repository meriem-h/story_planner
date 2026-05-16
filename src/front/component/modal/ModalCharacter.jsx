import React, { useState, useEffect } from 'react'
import { KeyRound, Mail, Gem, } from 'lucide-react'

import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

export default function ModalCharacter({ onSuccess, book, selectedCharacter }) {

    const [error, setError] = useState(null)
    const [character, setCharacter] = useState({ book_id: book.id })
    const [fieldCharacter, setFieldCharacter] = useState([
        { label: 'Nom', name: 'name', type: 'text' },
        { label: 'Description', name: 'description', type: 'textarea' },
        { label: 'Personalité', name: 'personality', type: 'textarea' },
        { label: 'Notes', name: 'notes', type: 'textarea' },
        { label: 'Image', name: 'image_url', type: 'text' },
      ])

    const api = useApi()

    useEffect(() => {
        if (!selectedCharacter) return
        setFieldCharacter(prev => prev.map(f => ({
          ...f,
          value: selectedCharacter[f.name]
        })))
      }, [selectedCharacter])


    const handleChange = (e) => {
        setCharacter(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setFieldCharacter(prev => prev.map(f => 
            f.name === e.target.name ? { ...f, value: e.target.value } : f
          ))
    }




    const handleClick = async (e) => {

        e.preventDefault()
        setError('')


        const errorListe = {}
        const missingFields = []

        if (!character.title) missingFields.push('title')


        const result = selectedCharacter
            ? await api('characters:update', { id: selectedCharacter.id, data: character })
            : await api('characters:create', character)


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
        <div className='p-4 flex flex-col gap-6'>

            {/* avatar live */}
            <div className='flex justify-center'>
                <div className='w-16 h-16 rounded-full bg-orange-300 flex items-center justify-center text-white text-2xl font-bold overflow-hidden'>
                    {character.image_url
                        ? <img src={character.image_url} alt='aperçu' className='w-full h-full object-cover' onError={(e) => e.target.style.display = 'none'} />
                        : character.name?.[0]?.toUpperCase() || '?'
                    }
                </div>
            </div>

            <form className='flex flex-col gap-4'>

                
                <FormField
                    fields={fieldCharacter}
                    onChange={handleChange}
                    errors={error}
                />

                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}

                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-orange-300 hover:bg-orange-400 transition-colors text-white rounded-lg font-bold mt-2'
                >
                    { selectedCharacter ? "Modifier le personnage": "Créer le personnage"}
                </button>

            </form>
        </div>
    )

    // return (

    //     <div className=''>
    //         <section>
    //             <article className='border border-2 border-orange-100 bg-orange-100 rounded-lg m-4 p-4'>

    //                 <h1 className='mb-4 text-center'>Nouveau Personnage</h1>
    //                 <form className="max-w-sm mx-auto flex flex-col gap-4">


    //                     <FormField fields={fieldCharacter} onChange={handleChange} errors={error} />

    //                     {error?.all && (
    //                         <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded">
    //                             {error.all}
    //                         </div>
    //                     )}

    //                     <div>
    //                         <button onClick={handleClick} className='border rounded rounded-lg px-4 py-2  bg-orange-300 text-white'>valider</button>
    //                     </div>


    //                 </form>
    //             </article>

    //         </section>


    //     </div>

    // )


}