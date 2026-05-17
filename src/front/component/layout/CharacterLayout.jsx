import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { X, Pen, BadgePlus, Search, Eye, Trash2 } from 'lucide-react'
import Modal from '../modal/Modal'
import ModalDelete from '../modal/ModalDelete'
import ModalCharacter from '../modal/ModalCharacter'
import ModalViewCharacter from '../modal/ModalViewCharacter'

export default function CharacterLayout({ selectedBook }) {

    const api = useApi()
    const [characters, setCharacters] = useState([])
    const [selectedCharacter, setSelectedCharacter] = useState(null)
    const [characterToView, setCharacterToView] = useState(null)
    const [characterToDelete, setCharacterToDelete] = useState(null)
    const [isOpen, setIsOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchCharacter()
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

    const openUpdate = (character) => {
        setSelectedCharacter(character)
        setIsOpen(true)
    }

    const filtered = characters.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={50}>
                <ModalCharacter onSuccess={handleCharacterCreated} book={selectedBook} selectedCharacter={selectedCharacter} />
            </Modal>

            <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} size={50}>
                <ModalViewCharacter character={characterToView} />
            </Modal>

            <ModalDelete
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onSuccess={() => { fetchCharacter(); setIsConfirmOpen(false) }}
                table="characters"
                id={characterToDelete}
            />

            {/* recherche */}
            <div className='px-3 mb-3'>
                <div className='flex items-center gap-2 bg-orange-50 rounded-lg px-2 py-1'>
                    <Search size={12} className='text-orange-400 flex-shrink-0' />
                    <input
                        type='text'
                        placeholder='Rechercher...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-full bg-transparent border-none outline-none text-sm text-orange-600 placeholder:text-orange-300'
                    />
                </div>
            </div>

            {characters.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-6 gap-4'>
                    <p className='text-orange-300 text-center'>Aucun personnage pour ce livre</p>
                    <button
                        onClick={() => { setSelectedCharacter(null); setIsOpen(true) }}
                        className='border border-orange-300 rounded-lg px-4 py-2 text-orange-400 hover:bg-orange-100 transition-colors'
                    >
                        + Créer un personnage
                    </button>
                </div>
            ) : (
                <>
                    <div className='flex justify-between items-center px-3 py-2 mb-2'>
                        <p className='text-xs font-bold text-orange-400 uppercase tracking-wider'>Personnages</p>
                        <button
                            onClick={() => { setSelectedCharacter(null); setIsOpen(true) }}
                            className='text-orange-400 hover:text-orange-600 transition-colors'
                        >
                            <BadgePlus size={20} />
                        </button>
                    </div>

                    <div className='p-3 overflow-y-auto max-h-[calc(90vh-80px)] flex flex-col gap-3'>
                        {filtered.map((character) => (
                            <div key={character.id} className='mb-3'>

                                {/* ticket compact */}
                                <div
                                    id={`card-compact-${character.id}`}
                                    className='p-3 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors'
                                    onClick={() => toggleCard(character.id)}
                                >
                                    <div className='flex items-center gap-3'>
                                        <div className='w-10 h-10 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden'>
                                            {character.image_url
                                                ? <img src={character.image_url} alt={character.name} className='w-full h-full object-cover' />
                                                : character.name[0]
                                            }
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <p className='font-bold text-orange-800'>{character.name}</p>
                                            <p className='text-xs text-orange-400 line-clamp-1'>{character.description}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setCharacterToView(character); setIsViewOpen(true) }}
                                            className='text-orange-300 hover:text-orange-500 transition-colors flex-shrink-0'
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* card complète */}
                                <div
                                    id={`card-detail-${character.id}`}
                                    className='hidden p-4 bg-orange-50 rounded-xl border-2 border-orange-300 cursor-pointer'
                                    onClick={() => { setCharacterToView(character); setIsViewOpen(true) }}
                                >
                                    <div className='flex justify-between items-center mb-3'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-xl overflow-hidden'>
                                                {character.image_url
                                                    ? <img src={character.image_url} alt={character.name} className='w-full h-full object-cover' />
                                                    : character.name[0]
                                                }
                                            </div>
                                            <p className='font-bold text-orange-800 text-lg'>{character.name}</p>
                                        </div>
                                        <div className='flex gap-2'>
                                            <button onClick={(e) => { e.stopPropagation(); openUpdate(character) }} className='text-orange-300 hover:text-orange-500'>
                                                <Pen size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setCharacterToDelete(character.id); setIsConfirmOpen(true) }} className='text-red-300 hover:text-red-500'>
                                                <Trash2 size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); toggleCard(character.id) }} className='text-orange-300 hover:text-orange-500'>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className='flex flex-col gap-3 text-sm'>
                                        {character.description && (
                                            <div>
                                                <p className='font-bold text-orange-600 mb-1'>Description</p>
                                                <p className='text-orange-800 line-clamp-2'>{character.description}</p>
                                            </div>
                                        )}
                                        {character.personality && (
                                            <div>
                                                <p className='font-bold text-orange-600 mb-1'>Personnalité</p>
                                                <p className='text-orange-800 line-clamp-2'>{character.personality}</p>
                                            </div>
                                        )}
                                        {character.notes && (
                                            <div>
                                                <p className='font-bold text-orange-600 mb-1'>Notes</p>
                                                <p className='text-orange-800 line-clamp-2'>{character.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    )
}