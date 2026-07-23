import React, { useState, useEffect, useMemo } from 'react'
import { useApi } from '../../context/ApiContext'
import Modal from './Modal'
import ModalImage from './ModalImage'
import ModalFamilyRelationForm from './form/ModalFamilyRelationForm'
import { Users2, BadgePlus, Pen, Trash2, AlertTriangle, Settings, Check, Heart, Skull, ZoomIn, ZoomOut, Maximize } from 'lucide-react'


function ConfirmInline({ isOpen, onClose, onConfirm, message }) {
    if (!isOpen) return null
    return (
        <div className='fixed inset-0 z-[60] flex items-center justify-center'>
            <div className='absolute inset-0 bg-black/50' onClick={onClose} />
            <div className='relative bg-primary-1 rounded-lg p-6 shadow-xl z-10 w-[400px]'>
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center'>
                        <AlertTriangle className='text-red-400' size={32} />
                    </div>
                    <p className='text-center text-primary-800 font-bold'>{message}</p>
                    <p className='text-center text-primary-400 text-sm'>Cette action est irreversible !</p>
                    <div className='flex gap-3 w-full'>
                        <button onClick={onClose} className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors'>
                            Annuler
                        </button>
                        <button onClick={onConfirm} className='flex-1 py-2 bg-red-400 hover:bg-red-500 transition-colors text-white rounded-lg font-bold'>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


const NODE_WIDTH = 100
const NODE_HEIGHT = 120
const AVATAR_RADIUS = 32
const LEVEL_GAP = 90
const SIBLING_GAP = 28
const COUPLE_GAP = 14

const ZOOM_MIN = 0.3
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1


const RELATION_LABELS = {
    parent_enfant: 'parent de',
    fratrie: 'frere/soeur de',
    couple: 'en couple avec',
    fiance: 'fiance(e) a',
    marie: 'marie(e) a',
    divorce: 'divorce(e) de',
}


const RELATION_COLORS = {
    parent_enfant: '#94a3b8',
    fratrie: '#94a3b8',
    couple: '#f472b6',
    fiance: '#f472b6',
    marie: '#ef4444',
    divorce: '#ef4444',
}

export default function ModalFamilyTree(props) {
    const api = useApi()

    const [character, setCharacter] = useState([])
    const [previewSrc, setPreviewSrc] = useState(null)
    const [chapters, setChapters] = useState([])

    const [families, setFamilies] = useState([])
    const [relations, setRelations] = useState([])
    const [statusesByCharacter, setStatusesByCharacter] = useState({})


    const [mode, setMode] = useState('view')
    const [zoom, setZoom] = useState(1)

    const [selectedFamilyId, setSelectedFamilyId] = useState(() => {
        const saved = localStorage.getItem(`familyview-family-${props.book?.id}`)
        return saved ? JSON.parse(saved) : null
    })
    const [selectedChapterId, setSelectedChapterId] = useState(() => {
        const saved = localStorage.getItem(`familyview-chapter-${props.book?.id}`)
        return saved ? JSON.parse(saved) : null
    })
    const [selectedCharacterIds, setSelectedCharacterIds] = useState(() => {
        const saved = localStorage.getItem(`familyview-characters-${props.book?.id}`)
        return saved ? JSON.parse(saved) : []
    })


    const [isAddingFamily, setIsAddingFamily] = useState(false)
    const [newFamilyName, setNewFamilyName] = useState('')


    const [relationForm, setRelationForm] = useState(null)
    const [relationToDelete, setRelationToDelete] = useState(null)
    const [isConfirmRelationOpen, setIsConfirmRelationOpen] = useState(false)


    const [hoveredAvatarKey, setHoveredAvatarKey] = useState(null)
    const [hoveredLinkId, setHoveredLinkId] = useState(null)

    useEffect(() => {
        fetchCharacter()
        fetchAllChapters()
        fetchFamilies()
    }, [])

    useEffect(() => {
        if (families.length === 0) return
        const stillExists = families.some(f => f.id === selectedFamilyId)
        if (!selectedFamilyId || !stillExists) setSelectedFamilyId(families[0].id)
    }, [families])

    useEffect(() => {
        if (chapters.length === 0) return
        const stillExists = chapters.some(c => c.id === selectedChapterId)
        if (!selectedChapterId || !stillExists) setSelectedChapterId(chapters[0].id)
    }, [chapters])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`familyview-family-${props.book.id}`, JSON.stringify(selectedFamilyId))
    }, [selectedFamilyId])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`familyview-chapter-${props.book.id}`, JSON.stringify(selectedChapterId))
    }, [selectedChapterId])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`familyview-characters-${props.book.id}`, JSON.stringify(selectedCharacterIds))
    }, [selectedCharacterIds])

    useEffect(() => {
        if (selectedFamilyId) fetchRelations()
        setZoom(1)
    }, [selectedFamilyId])

    const fetchCharacter = async () => {
        const result = await api('characters:findBy', { book_id: props.book.id })
        if (result.success) setCharacter(result.data)
    }

    const fetchAllChapters = async () => {
        const tomesResult = await api('tome:findBy', { book_id: props.book.id })
        if (!tomesResult.success) return

        const chaptersPerTome = await Promise.all(
            tomesResult.data.map(t => api('chapter:findBy', { tome_id: t.id }))
        )

        const merged = chaptersPerTome
            .filter(r => r.success)
            .flatMap((r, index) => r.data.map(ch => ({ ...ch, tome_title: tomesResult.data[index].title, tome_number: tomesResult.data[index].number })))

        merged.sort((a, b) => (a.tome_number - b.tome_number) || (a.position - b.position))
        setChapters(merged)
    }

    const fetchFamilies = async () => {
        const result = await api('family:findBy', { book_id: props.book.id })
        if (result.success) setFamilies(result.data)
    }

    const fetchRelations = async () => {
        const result = await api('familyRelation:findByFamily', selectedFamilyId)
        if (result.success) setRelations(result.data)
    }

    const handleCreateFamily = async () => {
        if (!newFamilyName.trim()) return
        const result = await api('family:create', { book_id: props.book.id, name: newFamilyName.trim() })
        if (result.success) {
            setNewFamilyName('')
            setIsAddingFamily(false)
            await fetchFamilies()
        }
    }

    const toggleMode = () => {
        if (mode === 'edit') setRelationForm(null)
        setMode(prev => prev === 'view' ? 'edit' : 'view')
    }

    const toggleCharacter = (id) => {
        setSelectedCharacterIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const toggleAllFamilyMembers = () => {
        const memberIds = [...characterIdsInRelations]
        if (memberIds.length === 0) return

        const allSelected = memberIds.every(id => selectedCharacterIds.includes(id))

        if (allSelected) {
            setSelectedCharacterIds(prev => prev.filter(id => !memberIds.includes(id)))
        } else {
            setSelectedCharacterIds(prev => [...new Set([...prev, ...memberIds])])
        }
    }

    const initialOf = (text) => text?.trim()?.charAt(0)?.toUpperCase() || '?'


    const isDead = (characterId) => {
        const statuses = statusesByCharacter[characterId] || []
        return statuses.some(s => s.label?.toLowerCase().includes('mort'))
    }


    const characterIdsInRelations = useMemo(() => {
        const ids = new Set()
        relations.forEach(r => { ids.add(r.character_id_1); ids.add(r.character_id_2) })
        return ids
    }, [relations])

    const unlinkedSelectedCharacters = useMemo(() => {
        return character.filter(c => selectedCharacterIds.includes(c.id) && !characterIdsInRelations.has(c.id))
    }, [character, selectedCharacterIds, characterIdsInRelations])


    const treeCharacterIds = useMemo(() => {
        if (mode === 'edit') return [...characterIdsInRelations]
        return selectedCharacterIds.filter(id => characterIdsInRelations.has(id))
    }, [mode, characterIdsInRelations, selectedCharacterIds])


    useEffect(() => {
        if (treeCharacterIds.length > 0) {
            fetchStatuses()
        } else {
            setStatusesByCharacter({})
        }
    }, [selectedChapterId, treeCharacterIds])

    const fetchStatuses = async () => {
        const result = await api('characterStatus:getActiveStatusesForCharactersAtChapter', {
            characterIds: treeCharacterIds,
            targetChapterId: selectedChapterId,
        })
        if (result.success) setStatusesByCharacter(result.data)
    }


    const generationByCharacter = useMemo(() => {
        const gen = {}
        const parentEdges = relations.filter(r => r.relation === 'parent_enfant')
        const sameGenEdges = relations.filter(r => ['fratrie', 'couple', 'fiance', 'marie', 'divorce'].includes(r.relation))

        treeCharacterIds.forEach(id => { gen[id] = 0 })


        let changed = true
        let iterations = 0
        while (changed && iterations < 50) {
            changed = false
            iterations++

            parentEdges.forEach(r => {
                const parentGen = gen[r.character_id_1] ?? 0
                const childGen = gen[r.character_id_2] ?? 0
                if (childGen < parentGen + 1) {
                    gen[r.character_id_2] = parentGen + 1
                    changed = true
                }
            })

            sameGenEdges.forEach(r => {
                const g1 = gen[r.character_id_1] ?? 0
                const g2 = gen[r.character_id_2] ?? 0
                if (g1 !== g2) {
                    const maxGen = Math.max(g1, g2)
                    gen[r.character_id_1] = maxGen
                    gen[r.character_id_2] = maxGen
                    changed = true
                }
            })
        }

        return gen
    }, [relations, treeCharacterIds])


    const layout = useMemo(() => {
        const byGen = {}
        treeCharacterIds.forEach(id => {
            const g = generationByCharacter[id] ?? 0
            if (!byGen[g]) byGen[g] = []
            byGen[g].push(id)
        })


        const coupleOf = {}
        relations
            .filter(r => ['couple', 'fiance', 'marie', 'divorce'].includes(r.relation))
            .forEach(r => {
                coupleOf[r.character_id_1] = r.character_id_2
                coupleOf[r.character_id_2] = r.character_id_1
            })

        const positions = {}
        const sortedGens = Object.keys(byGen).map(Number).sort((a, b) => a - b)

        sortedGens.forEach(genLevel => {
            const idsInGen = byGen[genLevel]
            const placed = new Set()
            const units = []

            idsInGen.forEach(id => {
                if (placed.has(id)) return
                const partner = coupleOf[id]
                if (partner && idsInGen.includes(partner) && !placed.has(partner)) {
                    units.push([id, partner])
                    placed.add(id)
                    placed.add(partner)
                } else {
                    units.push([id])
                    placed.add(id)
                }
            })

            let cursorX = 0

            const y = 50 + genLevel * (NODE_HEIGHT + LEVEL_GAP)

            units.forEach(unit => {
                if (unit.length === 2) {
                    positions[unit[0]] = { x: cursorX, y, genLevel }
                    cursorX += NODE_WIDTH + COUPLE_GAP
                    positions[unit[1]] = { x: cursorX, y, genLevel }
                    cursorX += NODE_WIDTH + SIBLING_GAP
                } else {
                    positions[unit[0]] = { x: cursorX, y, genLevel }
                    cursorX += NODE_WIDTH + SIBLING_GAP
                }
            })
        })

        const totalWidth = Object.values(positions).length > 0
            ? Math.max(NODE_WIDTH, ...Object.values(positions).map(p => p.x + NODE_WIDTH))
            : NODE_WIDTH
        const totalHeight = Object.values(positions).length > 0
            ? Math.max(...Object.values(positions).map(p => p.y + NODE_HEIGHT))
            : NODE_HEIGHT + 50

        return { positions, totalWidth: totalWidth + 20, totalHeight: totalHeight + 20 }
    }, [treeCharacterIds, generationByCharacter, relations])




    const resolvedEdges = useMemo(() => {
        const targetIndex = chapters.findIndex(c => Number(c.id) === Number(selectedChapterId))

        const isChapterInRange = (debut, fin) => {
            if (!selectedChapterId) return !debut && !fin
            const debutIndex = debut ? chapters.findIndex(c => Number(c.id) === Number(debut)) : -1
            const finIndex = fin ? chapters.findIndex(c => Number(c.id) === Number(fin)) : Infinity
            return targetIndex >= (debutIndex === -1 ? -1 : debutIndex) && targetIndex <= finIndex
        }

        const groups = new Map()
        relations.forEach(r => {
            const key = [r.character_id_1, r.character_id_2].sort((a, b) => a - b).join('-') + '|' + r.relation
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key).push(r)
        })

        const resolved = []
        groups.forEach(stages => {

            const active = stages.find(s => isChapterInRange(s.chapter_id_debut, s.chapter_id_fin))

                || stages
                    .filter(s => {
                        const debutIndex = s.chapter_id_debut
                            ? chapters.findIndex(c => Number(c.id) === Number(s.chapter_id_debut))
                            : -1
                        return debutIndex !== -1 && debutIndex <= targetIndex
                    })
                    .sort((a, b) =>
                        chapters.findIndex(c => Number(c.id) === Number(a.chapter_id_debut)) -
                        chapters.findIndex(c => Number(c.id) === Number(b.chapter_id_debut))
                    )
                    .pop()

                || stages.find(s => !s.chapter_id_debut && isChapterInRange(s.chapter_id_debut, s.chapter_id_fin))

            if (active) resolved.push(active)
        })

        return resolved
    }, [relations, selectedChapterId, chapters])


    const getTooltipText = (edge) => {
        const base = RELATION_LABELS[edge.relation] || edge.relation
        return edge.detail ? `${base} (${edge.detail})` : base
    }

    const renderTooltip = (x, y, text) => {
        const width = Math.max(70, text.length * 6 + 16)
        return (
            <g>
                <rect x={x - width / 2} y={y - 22} width={width} height={20} rx={4} fill='#1f2937' />
                <text x={x} y={y - 8} textAnchor='middle' fontSize='10' fill='white'>{text}</text>
            </g>
        )
    }

    const getEdgeStyle = (edge) => {
        const dead = isDead(edge.character_id_1) || isDead(edge.character_id_2)
        if (dead) return { color: '#1f2937', dashed: false, broken: false }

        const color = RELATION_COLORS[edge.relation] || '#94a3b8'
        return {
            color,
            dashed: false,
            broken: edge.relation === 'divorce',
        }
    }

    const posById = layout.positions

    const renderEdges = () => {
        return resolvedEdges.map((edge, i) => {
            const from = posById[edge.character_id_1]
            const to = posById[edge.character_id_2]
            if (!from || !to) return null

            const style = getEdgeStyle(edge)
            const fromCx = from.x + NODE_WIDTH / 2
            const fromCy = from.y + NODE_HEIGHT / 2
            const toCx = to.x + NODE_WIDTH / 2
            const toCy = to.y + NODE_HEIGHT / 2

            const isCoupleType = ['couple', 'fiance', 'marie', 'divorce'].includes(edge.relation)
            const isHovered = hoveredLinkId === edge.id

            if (isCoupleType) {
                const midX = (fromCx + toCx) / 2
                const midY = (fromCy + toCy) / 2
                const dashArray = style.broken ? '2,6' : 'none'
                return (
                    <g key={edge.id} onMouseEnter={() => setHoveredLinkId(edge.id)} onMouseLeave={() => setHoveredLinkId(null)}>
                        <line
                            x1={fromCx} y1={fromCy} x2={toCx} y2={toCy}
                            stroke={style.color}
                            strokeWidth={isHovered ? 4 : 3}
                            strokeDasharray={dashArray}
                        />

                        <line x1={fromCx} y1={fromCy} x2={toCx} y2={toCy} stroke='transparent' strokeWidth={16} style={{ cursor: 'pointer' }} />
                        <circle cx={midX} cy={midY} r={11} fill='white' stroke={style.color} strokeWidth={2} />
                        {(edge.relation === 'couple') && <Heart size={12} x={midX - 6} y={midY - 6} fill={style.color} stroke={style.color} />}
                        {(edge.relation === 'fiance' || edge.relation === 'marie' || edge.relation === 'divorce') && (
                            <text x={midX} y={midY + 4} textAnchor='middle' fontSize='12'>💍</text>
                        )}
                        {isHovered && renderTooltip(midX, midY - 12, getTooltipText(edge))}
                    </g>
                )
            }


            if (edge.relation === 'parent_enfant') {
                const midY = fromCy + (toCy - fromCy) / 2
                const path = `M ${fromCx} ${from.y + NODE_HEIGHT} L ${fromCx} ${midY} L ${toCx} ${midY} L ${toCx} ${to.y}`
                return (
                    <g key={edge.id} onMouseEnter={() => setHoveredLinkId(edge.id)} onMouseLeave={() => setHoveredLinkId(null)}>
                        <path d={path} fill='none' stroke={style.color} strokeWidth={isHovered ? 3 : 2} />
                        <path d={path} fill='none' stroke='transparent' strokeWidth={14} style={{ cursor: 'pointer' }} />
                        {isHovered && renderTooltip((fromCx + toCx) / 2, midY - 12, getTooltipText(edge))}
                    </g>
                )
            }


            const lineY = Math.min(from.y, to.y) - 14
            return (
                <g key={edge.id} onMouseEnter={() => setHoveredLinkId(edge.id)} onMouseLeave={() => setHoveredLinkId(null)}>
                    <path
                        d={`M ${fromCx} ${lineY} L ${toCx} ${lineY}`}
                        fill='none'
                        stroke={style.color}
                        strokeWidth={isHovered ? 3 : 2}
                    />
                    <path d={`M ${fromCx} ${lineY} L ${toCx} ${lineY}`} fill='none' stroke='transparent' strokeWidth={14} style={{ cursor: 'pointer' }} />
                    <path d={`M ${fromCx} ${lineY} L ${fromCx} ${fromCy - NODE_HEIGHT / 2 + 4}`} fill='none' stroke={style.color} strokeWidth={isHovered ? 3 : 2} />
                    <path d={`M ${toCx} ${lineY} L ${toCx} ${toCy - NODE_HEIGHT / 2 + 4}`} fill='none' stroke={style.color} strokeWidth={isHovered ? 3 : 2} />
                    {isHovered && renderTooltip((fromCx + toCx) / 2, lineY - 12, getTooltipText(edge))}
                </g>
            )
        })
    }


    const renderAvatar = (char) => {
        const pos = posById[char.id]
        if (!pos) return null
        const dead = isDead(char.id)
        const avatarKey = `node-${char.id}`
        const isHovered = hoveredAvatarKey === avatarKey
        const r = isHovered ? AVATAR_RADIUS * 1.1 : AVATAR_RADIUS
        const cx = pos.x + NODE_WIDTH / 2
        const cy = pos.y + NODE_HEIGHT / 2 - 10
        const clipId = `clip-family-${char.id}`

        return (
            <g
                key={char.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredAvatarKey(avatarKey)}
                onMouseLeave={() => setHoveredAvatarKey(null)}
                onClick={() => setPreviewSrc(char.image_url)}
            >
                {char.image_url ? (
                    <>
                        <clipPath id={clipId}><circle cx={cx} cy={cy} r={r} /></clipPath>
                        <image href={char.image_url} x={cx - r} y={cy - r} width={r * 2} height={r * 2} clipPath={`url(#${clipId})`} preserveAspectRatio='xMidYMid slice' opacity={dead ? 0.45 : 1} />
                        <circle cx={cx} cy={cy} r={r} fill='none' stroke={dead ? '#1f2937' : 'white'} strokeWidth={2} />
                    </>
                ) : (
                    <>
                        <circle cx={cx} cy={cy} r={r} fill={dead ? '#cbd5e1' : 'var(--primary-500, #64748b)'} />
                        <text x={cx} y={cy} textAnchor='middle' dominantBaseline='central' fontSize={r} fontWeight='bold' fill='white'>
                            {initialOf(char.name)}
                        </text>
                    </>
                )}
                {dead && (
                    <text x={cx + r - 6} y={cy - r + 8} textAnchor='middle' fontSize='14'>💀</text>
                )}
                <text x={cx} y={pos.y + NODE_HEIGHT - 4} textAnchor='middle' fontSize='11' fontWeight='bold' fill='var(--primary-700, #334155)'>
                    {char.name.length > 13 ? char.name.slice(0, 12) + '…' : char.name}
                </text>
            </g>
        )
    }

    const renderNodes = () => {
        return character
            .filter(c => treeCharacterIds.includes(c.id))
            .map(c => renderAvatar(c))
    }


    const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))
    const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))
    const zoomReset = () => setZoom(1)
    const handleWheelZoom = (e) => {
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        if (e.deltaY < 0) zoomIn()
        else zoomOut()
    }

    const handleDeleteRelation = async () => {
        await api('familyRelation:delete', relationToDelete.id)
        setIsConfirmRelationOpen(false)
        setRelationToDelete(null)
        await fetchRelations()
    }

    return (
        <div className="flex flex-col gap-4 p-4" style={{ height: '70vh' }}>

            <ModalImage src={previewSrc} isOpen={!!previewSrc} onClose={() => setPreviewSrc(null)} />

            <ConfirmInline
                isOpen={isConfirmRelationOpen}
                onClose={() => setIsConfirmRelationOpen(false)}
                onConfirm={handleDeleteRelation}
                message='Supprimer cette relation ?'
            />


            {isAddingFamily && (
                <div className='fixed inset-0 z-[60] flex items-center justify-center'>
                    <div className='absolute inset-0 bg-black/50' onClick={() => setIsAddingFamily(false)} />
                    <div className='relative bg-primary-1 rounded-lg p-6 shadow-xl z-10 w-[400px]'>
                        <p className='text-center text-primary-800 font-bold mb-4'>Nouvel arbre genealogique</p>
                        <input
                            autoFocus
                            type='text'
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                            placeholder='Nom (ex: Famille de Mia)'
                            className='w-full px-3 py-2 rounded-lg text-sm border border-primary-200 outline-none focus:border-primary-400 mb-4'
                        />
                        <div className='flex gap-3'>
                            <button onClick={() => setIsAddingFamily(false)} className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors'>
                                Annuler
                            </button>
                            <button onClick={handleCreateFamily} className='flex-1 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold'>
                                Creer
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className='flex flex-wrap gap-4 items-end'>
                {families.length > 0 && mode === 'view' && (
                    <div className='flex-1 min-w-[200px]'>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Chapitre</label>
                        <select
                            value={selectedChapterId || ''}
                            onChange={(e) => setSelectedChapterId(Number(e.target.value))}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
                        >
                            {chapters.map(ch => (
                                <option key={ch.id} value={ch.id}>{ch.tome_title} — {ch.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className='flex-1 min-w-[200px]'>
                    <label className='block mb-1 text-xs text-primary-500 font-medium'>Arbre genealogique</label>
                    {families.length > 0 ? (
                        <select
                            value={selectedFamilyId || ''}
                            onChange={(e) => setSelectedFamilyId(e.target.value)}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
                        >
                            {families.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    ) : (
                        <p className='text-xs text-primary-300 italic py-2'>Aucun arbre encore</p>
                    )}
                </div>

                <div className='flex gap-2 flex-shrink-0'>
                    {selectedFamilyId && (
                        <button
                            onClick={toggleMode}
                            className={`flex items-center gap-2 px-3 py-2 transition-colors rounded-lg text-sm font-bold ${mode === 'edit' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-primary-100 hover:bg-primary-200 text-primary-600'}`}
                        >
                            {mode === 'edit' ? <Check size={16} /> : <Settings size={16} />}
                            {mode === 'edit' ? 'Terminer' : 'Modifier'}
                        </button>
                    )}
                    <button
                        onClick={() => setIsAddingFamily(true)}
                        className='flex items-center gap-2 px-3 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg text-sm font-bold'
                    >
                        <BadgePlus size={16} /> Nouvel arbre
                    </button>
                </div>
            </div>

            {families.length === 0 ? (
                <div className='flex-1 flex flex-col items-center justify-center gap-2 text-primary-300'>
                    <Users2 size={32} />
                    <p>Cree ton premier arbre genealogique.</p>
                </div>
            ) : (
                <div className='flex-1 flex gap-4 min-h-0'>


                    <div className={`${mode === 'edit' ? 'w-[420px]' : 'w-64'} flex-shrink-0 flex flex-col gap-2.5 overflow-y-auto hide-scrollbar pr-1`}>
                        <div className='flex items-center justify-between'>
                            <label className='text-sm text-primary-500 font-medium'>
                                {mode === 'edit' ? 'Gerer les relations' : 'Personnages a afficher'}
                            </label>
                            {mode === 'view' && selectedFamilyId && (
                                <button
                                    onClick={toggleAllFamilyMembers}
                                    title='Selectionner/deselectionner tous les membres de cette famille'
                                    className='flex-shrink-0 p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'
                                >
                                    <Users2 size={16} />
                                </button>
                            )}
                        </div>
                        {character.length === 0 && <p className='text-primary-300 text-sm'>Aucun personnage dans ce livre.</p>}
                        {mode === 'view' && character.map(char => {
                            const isSelected = selectedCharacterIds.includes(char.id)
                            return (
                                <button
                                    key={char.id}
                                    onClick={() => toggleCharacter(char.id)}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-base font-medium text-left min-w-0 ${isSelected ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'}`}
                                >
                                    {char.image_url ? (
                                        <img src={char.image_url} alt={char.name} className='w-10 h-10 rounded-full object-cover flex-shrink-0' />
                                    ) : (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${isSelected ? 'bg-white text-primary-500' : 'bg-primary-400 text-white'}`}>
                                            {initialOf(char.name)}
                                        </div>
                                    )}
                                    <span className='truncate'>{char.name}</span>
                                </button>
                            )
                        })}
                        {mode === 'edit' && (
                            <ModalFamilyRelationForm
                                characters={character}
                                relations={relations}
                                chapters={chapters}
                                familyId={selectedFamilyId}
                                onRelationSaved={fetchRelations}
                                relationLabels={RELATION_LABELS}
                            />
                        )}
                    </div>


                    <div className='flex-1 flex flex-col gap-3 min-w-0'>
                        <div className='flex-1 relative min-h-0'>
                            {treeCharacterIds.length > 0 && (
                                <div className='absolute top-3 right-3 z-20 flex items-center gap-1 bg-primary-1 rounded-lg shadow-md p-1'>
                                    <button onClick={zoomOut} title='Zoom -' className='p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                                        <ZoomOut size={16} />
                                    </button>
                                    <button onClick={zoomReset} title='Reinitialiser le zoom' className='px-2 text-xs font-bold text-primary-500 hover:text-primary-700 min-w-[3rem] text-center'>
                                        {Math.round(zoom * 100)}%
                                    </button>
                                    <button onClick={zoomIn} title='Zoom +' className='p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                                        <ZoomIn size={16} />
                                    </button>
                                    <div className='w-px h-5 bg-primary-100 mx-0.5' />
                                    <button onClick={zoomReset} title='Ajuster a 100%' className='p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                                        <Maximize size={16} />
                                    </button>
                                </div>
                            )}

                            <div
                                className='absolute inset-0 overflow-auto hide-scrollbar bg-primary-50 rounded-xl p-4'
                                onWheel={handleWheelZoom}
                            >
                                {treeCharacterIds.length === 0 ? (
                                    <div className='h-full flex flex-col items-center justify-center gap-2 text-primary-300'>
                                        <Users2 size={32} />
                                        <p>{mode === 'edit' ? 'Choisis 2 personnages a gauche pour creer une relation.' : "Selectionne des personnages ayant des relations dans cet arbre."}</p>
                                    </div>
                                ) : (
                                    // <div className='min-w-full min-h-full flex items-start justify-center'>
                                    <div style={{ minWidth: layout.totalWidth * zoom, minHeight: '100%' }} >
                                        <div className='relative' style={{ width: layout.totalWidth * zoom, height: layout.totalHeight * zoom }}>
                                            <div
                                                className='relative'
                                                style={{ width: layout.totalWidth, height: layout.totalHeight, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                                            >
                                                <svg width={layout.totalWidth} height={layout.totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
                                                    {renderEdges()}
                                                    {renderNodes()}
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                        {mode === 'view' && unlinkedSelectedCharacters.length > 0 && (
                            <div className='bg-primary-100 rounded-lg px-3 py-2 flex items-center gap-3 flex-shrink-0'>
                                <span className='text-xs font-bold text-primary-600 flex-shrink-0'>Sans relation dans cet arbre :</span>
                                <div className='flex flex-wrap gap-2'>
                                    {unlinkedSelectedCharacters.map(char => (
                                        <div key={char.id} className='flex items-center gap-1.5 bg-primary-50 rounded-full pr-2 py-0.5'>
                                            {char.image_url ? (
                                                <img src={char.image_url} alt={char.name} onClick={() => setPreviewSrc(char.image_url)} className='w-6 h-6 rounded-full object-cover cursor-pointer' />
                                            ) : (
                                                <div className='w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold'>
                                                    {initialOf(char.name)}
                                                </div>
                                            )}
                                            <span className='text-xs text-primary-600'>{char.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}