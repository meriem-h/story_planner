import React, { useState, useEffect } from 'react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

const TABS = [
    { key: 'infos',        label: 'Infos' },
    { key: 'description',  label: 'Description' },
    { key: 'personnalite', label: 'Personnalité' },
    { key: 'notes',        label: 'Notes' },
]

export default function ModalCharacter({ onSuccess, book, selectedCharacter }) {

    const [error, setError] = useState(null)
    const [character, setCharacter] = useState({ book_id: book.id })
    const [characterTypes, setCharacterTypes] = useState([])
    const [activeTab, setActiveTab] = useState('infos')
    const api = useApi()

    useEffect(() => {
        fetchTypes()
    }, [])

    useEffect(() => {
        if (!selectedCharacter) {
            setCharacter({ book_id: book.id })
            return
        }
        setCharacter({
            book_id:     book.id,
            name:        selectedCharacter.name        || '',
            age:         selectedCharacter.age         || '',
            role:        selectedCharacter.role        || '',
            type_id:     selectedCharacter.type_id     || '',
            precision:   selectedCharacter.precision   || '',
            description: selectedCharacter.description || '',
            personality: selectedCharacter.personality || '',
            notes:       selectedCharacter.notes       || '',
            image_url:   selectedCharacter.image_url   || '',
        })
    }, [selectedCharacter])

    const fetchTypes = async () => {
        const result = await api('character_type:findBy', { book_id: book.id })
        setCharacterTypes(result.data || [])
    }

    const roleOptions = [
        { value: '',           text: '— Aucun —' },
        { value: 'principal',  text: 'Principal' },
        { value: 'secondaire', text: 'Secondaire' },
        { value: 'tertiaire',  text: 'Tertiaire' },
        { value: 'pnj',        text: 'PNJ' },
    ]

    const typeOptions = [
        { value: '', text: '— Aucun —' },
        ...characterTypes.map(t => ({
            value: t.id,
            text:  t.label,
        }))
    ]

    const fieldsInfos = [
        { label: 'Nom',       name: 'name',      type: 'text',   value: character.name      || '' },
        { label: 'Âge',       name: 'age',       type: 'text',   value: character.age       || '', placeholder: 'ex: 25' },
        { label: 'Rôle',      name: 'role',      type: 'select', value: character.role      || '', data: roleOptions },
        { label: 'Type',      name: 'type_id',   type: 'select', value: character.type_id   || '', data: typeOptions },
        { label: 'Précision', name: 'precision', type: 'text',   value: character.precision || '', placeholder: 'ex: female lead' },
        { label: 'Image',     name: 'image_url', type: 'text',   value: character.image_url || '' },
    ]

    const handleChange = (e) => {
        setCharacter(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError('')

        const result = selectedCharacter
            ? await api('characters:update', { id: selectedCharacter.id, data: character })
            : await api('characters:create', character)

        if (result.success) {
            onSuccess(result)
        } else {
            setError({ all: result.message })
        }
    }

    return (
        <div className='p-4 flex flex-col gap-4 h-full'>

            {/* avatar live */}
            <div className='flex justify-center'>
                <div className='w-16 h-16 rounded-full bg-orange-300 flex items-center justify-center text-white text-2xl font-bold overflow-hidden'>
                    {character.image_url
                        ? <img src={character.image_url} alt='aperçu' className='w-full h-full object-cover' onError={(e) => e.target.style.display = 'none'} />
                        : character.name?.[0]?.toUpperCase() || '?'
                    }
                </div>
            </div>

            {/* onglets */}
            <div className='flex gap-1 border-b border-orange-100'>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-2 text-sm font-medium transition-colors rounded-t-lg
                            ${activeTab === tab.key
                                ? 'text-orange-600 border-b-2 border-orange-400 bg-orange-50'
                                : 'text-orange-300 hover:text-orange-500'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* contenu avec scroll */}
            <div className='overflow-y-auto flex-1 max-h-[45vh]'>

                {activeTab === 'infos' && (
                    <div className='flex flex-col gap-4 pr-1'>
                        <FormField
                            fields={fieldsInfos}
                            onChange={handleChange}
                            errors={error}
                        />
                    </div>
                )}

                {activeTab === 'description' && (
                    <textarea
                        name='description'
                        placeholder='Description du personnage...'
                        value={character.description || ''}
                        onChange={handleChange}
                        className='w-full h-64 px-3 py-2.5 border rounded-lg text-sm text-orange-800 placeholder:text-orange-300 focus:ring-orange-300 focus:border-orange-300 outline-none resize-none'
                    />
                )}

                {activeTab === 'personnalite' && (
                    <textarea
                        name='personality'
                        placeholder='Personnalité du personnage...'
                        value={character.personality || ''}
                        onChange={handleChange}
                        className='w-full h-64 px-3 py-2.5 border rounded-lg text-sm text-orange-800 placeholder:text-orange-300 focus:ring-orange-300 focus:border-orange-300 outline-none resize-none'
                    />
                )}

                {activeTab === 'notes' && (
                    <textarea
                        name='notes'
                        placeholder='Notes diverses...'
                        value={character.notes || ''}
                        onChange={handleChange}
                        className='w-full h-64 px-3 py-2.5 border rounded-lg text-sm text-orange-800 placeholder:text-orange-300 focus:ring-orange-300 focus:border-orange-300 outline-none resize-none'
                    />
                )}

            </div>

            {/* erreur + bouton toujours visibles */}
            <div className='flex flex-col gap-2 mt-auto'>
                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}
                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-orange-300 hover:bg-orange-400 transition-colors text-white rounded-lg font-bold'
                >
                    {selectedCharacter ? "Modifier le personnage" : "Créer le personnage"}
                </button>
            </div>

        </div>
    )
}