import React, { useState } from 'react'
import { useApi } from '../../context/ApiContext'
import { Pen, Trash2, X, Plus } from 'lucide-react'

// types de relation proposes dans le select, dans un ordre narratif logique
const RELATION_OPTIONS = [
    { value: 'parent_enfant', label: 'parent de' },
    { value: 'fratrie', label: 'frere/soeur de' },
    { value: 'couple', label: 'en couple avec' },
    { value: 'fiance', label: 'fiance(e) a' },
    { value: 'marie', label: 'marie(e) a' },
    { value: 'divorce', label: 'divorce(e) de' },
]

export default function ModalFamilyRelationForm({ characters, relations, chapters, familyId, onRelationSaved, relationLabels }) {
    const api = useApi()

    // selection des 2 personnages par clic sur les pills : pickedIds[0] = personnage 1,
    // pickedIds[1] = personnage 2. Au-dela de 2, plus rien n'est selectionnable (les
    // autres pills se grisent) tant qu'on n'a pas deselectionne.
    const [pickedIds, setPickedIds] = useState([])
    const [relationType, setRelationType] = useState('')
    const [showDetailField, setShowDetailField] = useState(false)
    const [detail, setDetail] = useState('')
    const [chapterDebut, setChapterDebut] = useState('')
    const [chapterFin, setChapterFin] = useState('')
    const [error, setError] = useState(null)

    // relation en cours d'edition (null = mode creation). On reutilise les memes champs
    // que la creation, prefilles avec les valeurs existantes.
    const [editingId, setEditingId] = useState(null)

    const findChar = (id) => characters.find(c => c.id === id)

    const togglePick = (id) => {
        setError(null)
        if (pickedIds.includes(id)) {
            setPickedIds(prev => prev.filter(p => p !== id))
            return
        }
        if (pickedIds.length >= 2) return // les autres pills sont grisees, rien a faire
        setPickedIds(prev => [...prev, id])
    }

    const resetForm = () => {
        setPickedIds([])
        setRelationType('')
        setShowDetailField(false)
        setDetail('')
        setChapterDebut('')
        setChapterFin('')
        setError(null)
        setEditingId(null)
    }

    const startEdit = (relation) => {
        setPickedIds([relation.character_id_1, relation.character_id_2])
        setRelationType(relation.relation)
        setDetail(relation.detail || '')
        setShowDetailField(!!relation.detail)
        setChapterDebut(relation.chapter_id_debut || '')
        setChapterFin(relation.chapter_id_fin || '')
        setEditingId(relation.id)
        setError(null)
    }

    const handleSave = async () => {
        if (pickedIds.length < 2) {
            setError('Choisis 2 personnages.')
            return
        }
        if (!relationType) {
            setError('Choisis le type de relation.')
            return
        }

        const payload = {
            family_id: familyId,
            character_id_1: pickedIds[0],
            character_id_2: pickedIds[1],
            relation: relationType,
            detail: detail.trim() || null,
            chapter_id_debut: chapterDebut || null,
            chapter_id_fin: chapterFin || null,
        }

        const result = editingId
            ? await api('familyRelation:update', { id: editingId, data: payload })
            : await api('familyRelation:create', payload)

        if (result.success) {
            resetForm()
            await onRelationSaved()
        } else {
            setError(result.message)
        }
    }

    const handleDelete = async (relation) => {
        await api('familyRelation:delete', relation.id)
        if (editingId === relation.id) resetForm()
        await onRelationSaved()
    }

    // libelle lisible d'une plage de chapitres, pour la liste des relations existantes
    const rangeLabel = (relation) => {
        if (!relation.chapter_id_debut && !relation.chapter_id_fin) return null
        const debut = relation.chapter_id_debut ? chapters.find(c => c.id === relation.chapter_id_debut)?.title : null
        const fin = relation.chapter_id_fin ? chapters.find(c => c.id === relation.chapter_id_fin)?.title : null
        const parts = []
        if (debut) parts.push(`depuis "${debut}"`)
        if (fin) parts.push(`jusqu'a "${fin}"`)
        return parts.join(' ')
    }

    const picked1 = pickedIds[0] ? findChar(pickedIds[0]) : null
    const picked2 = pickedIds[1] ? findChar(pickedIds[1]) : null

    return (
        <div className='flex flex-col gap-3'>
            {/* pills de selection des personnages */}
            <div className='flex flex-wrap gap-1.5'>
                {characters.map(char => {
                    const pickIndex = pickedIds.indexOf(char.id)
                    const isPicked = pickIndex !== -1
                    const isDisabled = !isPicked && pickedIds.length >= 2
                    return (
                        <button
                            key={char.id}
                            onClick={() => togglePick(char.id)}
                            disabled={isDisabled}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors
                                ${isPicked ? 'bg-primary-400 text-white' : isDisabled ? 'bg-primary-50 text-primary-200 cursor-not-allowed' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'}`}
                        >
                            {isPicked && <span className='w-4 h-4 rounded-full bg-white text-primary-500 flex items-center justify-center text-[10px] font-bold'>{pickIndex + 1}</span>}
                            {char.name}
                        </button>
                    )
                })}
            </div>

            {/* phrase dynamique : [nom 1] est le [select relation] (+detail) de [nom 2] */}
            {picked1 && (
                <div className='bg-primary-50 rounded-lg p-3 flex flex-col gap-2'>
                    <div className='flex flex-col gap-2 text-sm text-primary-700'>
                        <div className='flex items-center gap-1.5 flex-wrap'>
                            <span className='font-bold'>{picked1.name}</span>
                            <span>est le/la</span>
                            <select
                                value={relationType}
                                onChange={(e) => setRelationType(e.target.value)}
                                className='flex-1 min-w-[140px] px-2 py-1 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
                            >
                                <option value=''>— choisir —</option>
                                {RELATION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {relationType && (
                            <div className='flex items-center gap-1.5 flex-wrap pl-2'>
                                {!showDetailField ? (
                                    <button
                                        onClick={() => setShowDetailField(true)}
                                        title='Ajouter une precision'
                                        className='flex items-center gap-1 px-2 py-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg text-xs flex-shrink-0'
                                    >
                                        <Plus size={12} /> detail
                                    </button>
                                ) : (
                                    <input
                                        type='text'
                                        value={detail}
                                        onChange={(e) => setDetail(e.target.value)}
                                        placeholder='ex: de sang, adoptif, de coeur...'
                                        className='flex-1 min-w-[160px] px-2 py-1 border border-primary-200 rounded-lg text-xs outline-none focus:border-primary-400'
                                    />
                                )}
                                {picked2 && <span className='flex-shrink-0'>de <span className='font-bold'>{picked2.name}</span></span>}
                            </div>
                        )}
                    </div>

                    {!picked2 && <p className='text-xs text-primary-400 italic'>Choisis un 2eme personnage ci-dessus.</p>}

                    {/* chapitres : uniquement pertinent pour les etapes de couple */}
                    {picked2 && relationType && (
                        <div className='flex gap-2'>
                            <div className='flex-1'>
                                <label className='block mb-1 text-xs text-primary-500 font-medium'>Depuis le chapitre</label>
                                <select
                                    value={chapterDebut}
                                    onChange={(e) => setChapterDebut(e.target.value)}
                                    className='w-full px-2 py-1.5 border border-primary-200 rounded-lg text-xs outline-none focus:border-primary-400 bg-white'
                                >
                                    <option value=''>Depuis le debut</option>
                                    {chapters.map(ch => (
                                        <option key={ch.id} value={ch.id}>{ch.tome_title} — {ch.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='flex-1'>
                                <label className='block mb-1 text-xs text-primary-500 font-medium'>Jusqu'au chapitre</label>
                                <select
                                    value={chapterFin}
                                    onChange={(e) => setChapterFin(e.target.value)}
                                    className='w-full px-2 py-1.5 border border-primary-200 rounded-lg text-xs outline-none focus:border-primary-400 bg-white'
                                >
                                    <option value=''>Jusqu'a la fin</option>
                                    {chapters.map(ch => (
                                        <option key={ch.id} value={ch.id}>{ch.tome_title} — {ch.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {error && <p className='text-red-500 text-xs'>{error}</p>}

                    {picked2 && relationType && (
                        <div className='flex gap-2'>
                            <button onClick={resetForm} className='flex-1 py-1.5 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors text-xs'>
                                Annuler
                            </button>
                            <button onClick={handleSave} className='flex-1 py-1.5 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold text-xs'>
                                {editingId ? 'Enregistrer' : 'Ajouter la relation'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* liste des relations existantes de cet arbre */}
            <div className='flex flex-col gap-1.5 mt-2'>
                <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Relations de cet arbre</p>
                {relations.length === 0 && (
                    <p className='text-primary-300 text-xs italic'>Aucune relation encore.</p>
                )}
                {relations.map(r => {
                    const c1 = findChar(r.character_id_1)
                    const c2 = findChar(r.character_id_2)
                    if (!c1 || !c2) return null
                    const range = rangeLabel(r)
                    return (
                        <div key={r.id} className='flex items-center gap-2 bg-primary-50 rounded-lg px-2.5 py-2'>
                            <div className='flex-1 min-w-0'>
                                <p className='text-xs text-primary-700'>
                                    <span className='font-bold'>{c1.name}</span> {relationLabels[r.relation]} <span className='font-bold'>{c2.name}</span>
                                </p>
                                {(r.detail || range) && (
                                    <p className='text-[11px] text-primary-400'>
                                        {r.detail}{r.detail && range ? ' · ' : ''}{range}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => startEdit(r)} title='Modifier' className='p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded flex-shrink-0'>
                                <Pen size={12} />
                            </button>
                            <button onClick={() => handleDelete(r)} title='Supprimer' className='p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded flex-shrink-0'>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}