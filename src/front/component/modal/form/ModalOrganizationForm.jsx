import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function ModalOrganizationForm(props) {

    const [title, setTitle] = useState('')
    const [parentIds, setParentIds] = useState([])
    const [rank, setRank] = useState(1)
    const [position, setPosition] = useState(1)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (props.grade) {
            setTitle(props.grade.title)
            setParentIds(props.grade.parents || [])
            setRank(props.grade.rank || 1)
            setPosition(props.grade.position || 1)
        } else {
            setTitle('')
            setParentIds(props.defaultParentId ? [props.defaultParentId] : [])
            setRank(1)
            setPosition(1)
        }
        setError(null)
    }, [props.grade, props.defaultParentId])

    const flattenTree = (nodes, depth = 0, acc = []) => {
        nodes.forEach(n => {
            acc.push({ id: n.id, title: n.title, depth })
            flattenTree(n.children, depth + 1, acc)
        })
        return acc
    }

    const flatOptions = flattenTree(props.tree).filter(opt =>
        !props.grade || opt.id !== props.grade.id
    )

    const toggleParent = (id) => {
        setParentIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        )
    }

    const handleSave = () => {
        if (!title.trim()) {
            setError('Le titre du grade est obligatoire.')
            return
        }
        props.onSave({
            title: title.trim(),
            parent_grade_ids: parentIds,
            rank,
            position,
            organization_id: props.organizationId,
        })
    }

    return (
        <div className='flex flex-col gap-4 h-full'>
            <div className='flex items-center justify-between flex-shrink-0'>
                <p className='text-sm font-bold text-primary-600'>
                    {props.grade ? 'Modifier le grade' : 'Nouveau grade'}
                </p>
                <button onClick={props.onClose} className='p-1 text-primary-300 hover:text-primary-500'>
                    <X size={16} />
                </button>
            </div>

            <div className='flex gap-4 flex-1 min-h-0'>
                {/* Colonne gauche */}
                <div className='flex flex-col gap-3 w-1/2 overflow-y-auto'>
                    <div>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Titre du grade</label>
                        <input
                            autoFocus
                            type='text'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            placeholder='ex: Instructeur'
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400'
                        />
                    </div>

                    <div>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Supérieurs directs</label>
                        <div className='flex flex-wrap gap-2 min-h-[32px]'>
                            {parentIds.length === 0 && (
                                <span className='text-xs text-primary-300 italic'>Aucun (sommet)</span>
                            )}
                            {parentIds.map(pid => {
                                const found = flatOptions.find(o => o.id === pid)
                                if (!found) return null
                                return (
                                    <div key={pid} className='flex items-center gap-1 bg-primary-300 text-white text-xs px-2 py-1 rounded-full'>
                                        <span>{found.title}</span>
                                        <button onClick={() => toggleParent(pid)} className='hover:text-primary-100'>
                                            <X size={10} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Rang hiérarchique</label>
                        <p className='text-xs text-primary-300 mb-1'>1 = juste sous le parent, 2 = deux niveaux en dessous...</p>
                        <input
                            type='number'
                            min={1}
                            max={10}
                            value={rank}
                            onChange={(e) => setRank(Number(e.target.value))}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400'
                        />
                    </div>

                    <div>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Position</label>
                        <input
                            type='number'
                            min={1}
                            value={position}
                            onChange={(e) => setPosition(Number(e.target.value))}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400'
                        />
                    </div>

                    {error && <p className='text-red-500 text-xs'>{error}</p>}
                </div>

                {/* Colonne droite — arborescence */}
                <div className='w-1/2 flex flex-col min-h-0'>
                    <label className='block mb-1 text-xs text-primary-500 font-medium flex-shrink-0'>Choisir les supérieurs</label>
                    <div className='flex-1 overflow-y-auto border border-primary-200 rounded-lg'>
                        {flatOptions.map(opt => {
                            const isSelected = parentIds.includes(opt.id)
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleParent(opt.id)}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${isSelected ? 'bg-primary-100 text-primary-700 font-medium' : 'hover:bg-primary-50 text-primary-500'}`}
                                    style={{ paddingLeft: `${opt.depth * 12 + 12}px` }}
                                >
                                    {isSelected ? '✓ ' : ''}{opt.title}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className='flex gap-2 flex-shrink-0'>
                <button
                    onClick={props.onClose}
                    className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors text-sm'
                >
                    Annuler
                </button>
                <button
                    onClick={handleSave}
                    className='flex-1 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold text-sm'
                >
                    {props.grade ? 'Enregistrer' : 'Créer le grade'}
                </button>
            </div>
        </div>
    )
}