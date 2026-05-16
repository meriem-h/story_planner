import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { X, Pen, BadgePlus } from 'lucide-react'

import Modal from '../../component/modal/Modal'
import ModalCharacter from '../../component/modal/ModalCharacter'



export default function CharacterLayout({ selectedBook }) {

    const api = useApi()
    const [characters, setCharacters] = useState([])
    const [selectedCharacter, setSelectedCharacter] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const result = fetchCharacter()
    }, [])

    const toggleCard = (id) => {
        document.getElementById(`card-compact-${id}`).classList.toggle('hidden')
        document.getElementById(`card-detail-${id}`).classList.toggle('hidden')
    }


    const handleCharacterCreated = () => {
        fetchCharacter()
        setIsOpen(false)
    }


    const fetchCharacter = async () => {
        const result = await api('characters:findBy', { book_id: selectedBook.id })
        setCharacters(result.data || [])
    }

    const openUpdate =  (character) => {
        setSelectedCharacter(character)
        setIsOpen(true)
    }

    return (
        <>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Créer un nouveau personnage" size={50}>
                <ModalCharacter onSuccess={handleCharacterCreated} book={selectedBook} selectedCharacter={selectedCharacter}/>
            </Modal>

            {characters.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-6 gap-4'>
                    <p className='text-orange-300 text-center'>Aucun personnage pour ce livre</p>
                    <button
                        onClick={() => {setSelectedCharacter(null); setIsOpen(true)}}
                        className='border border-orange-300 rounded-lg px-4 py-2 text-orange-400 hover:bg-orange-100 transition-colors'
                    >
                        + Créer un personnage
                    </button>
                </div>
            ) : (
                <>
                    {/* header avec bouton ajouter */}
                    <div className='flex justify-between items-center px-3 py-2 mb-2'>
                        <p className='text-xs font-bold text-orange-400 uppercase tracking-wider'>Personnages</p>
                        <button
                            onClick={() => { setSelectedCharacter(null); setIsOpen(true) }}
                            className='text-orange-400 hover:text-orange-600 transition-colors'
                        >
                            <BadgePlus size={20} />
                        </button>
                    </div>

                    {/* card caracter */}
                    {characters.map((character) => (
                        <div key={character.id} className='mb-3'>

                            {/* ticket compact - visible par défaut */}
                            <div
                                id={`card-compact-${character.id}`}
                                className='p-3 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors'
                                onClick={() => toggleCard(character.id)}
                            >
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-lg flex-shrink-0'>
                                        {character.image_url
                                            ? <img src={character.image_url} alt={character.name} className='w-full h-full object-cover' />
                                            : character.name[0]
                                        }
                                    </div>
                                    <div>
                                        <p className='font-bold text-orange-800'>{character.name}</p>
                                        <p className='text-xs text-orange-400 line-clamp-1'>{character.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* card complète - cachée par défaut */}
                            <div
                                id={`card-detail-${character.id}`}
                                className='hidden p-4 bg-orange-50 rounded-xl border-2 border-orange-300'
                            >
                                <div className='flex justify-between items-center mb-3'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-xl'>
                                            {character.image_url
                                                ? <img src={character.image_url} alt={character.name} className='w-full h-full object-cover' />
                                                : character.name[0]
                                            }
                                        </div>
                                        <p className='font-bold text-orange-800 text-lg'>{character.name}</p>
                                    </div>
                                    <div>
                                        <button onClick={() => openUpdate(character)} className='text-orange-300 hover:text-orange-500'>

                                            <Pen size={16} />
                                        </button>

                                        <button onClick={() => toggleCard(character.id)} className='text-orange-300 hover:text-orange-500'>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className='flex flex-col gap-3 text-sm'>
                                    {character.description && (
                                        <div>
                                            <p className='font-bold text-orange-600 mb-1'>Description</p>
                                            <p className='text-orange-800'>{character.description}</p>
                                        </div>
                                    )}
                                    {character.personality && (
                                        <div>
                                            <p className='font-bold text-orange-600 mb-1'>Personnalité</p>
                                            <p className='text-orange-800'>{character.personality}</p>
                                        </div>
                                    )}
                                    {character.notes && (
                                        <div>
                                            <p className='font-bold text-orange-600 mb-1'>Notes</p>
                                            <p className='text-orange-800'>{character.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </>

            )}

        </>
    )
}