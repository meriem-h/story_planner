import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useApi } from '../../context/ApiContext'
import Modal from './Modal'
import ModalImage from './ModalImage'
import ModalAssignGrade from './ModalAssignGrade'
import ModalOrganizationForm from './form/ModalOrganizationForm'
import OrganizationChart from './ui/OrganizationChart'
import { Network, BadgePlus, Pen, Trash2, AlertTriangle, Settings, Check, Users, ZoomIn, ZoomOut, Maximize } from 'lucide-react'

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

const ZOOM_MIN = 0.3
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1

export default function ModalOrganization(props) {

    const api = useApi()
    const [character, setCharacter] = useState([])
    const [previewSrc, setPreviewSrc] = useState(null)
    const [chapters, setChapters] = useState([])

    const [organizations, setOrganizations] = useState([])
    const [tree, setTree] = useState([])
    const [gradesByCharacter, setGradesByCharacter] = useState({})

    const [mode, setMode] = useState('view')
    const [zoom, setZoom] = useState(1)

    const [selectedOrgId, setSelectedOrgId] = useState(() => {
        const saved = localStorage.getItem(`orgview-org-${props.book?.id}`)
        return saved ? JSON.parse(saved) : null
    })
    const [selectedChapterId, setSelectedChapterId] = useState(() => {
        const saved = localStorage.getItem(`orgview-chapter-${props.book?.id}`)
        return saved ? JSON.parse(saved) : null
    })
    const [selectedCharacterIds, setSelectedCharacterIds] = useState(() => {
        const saved = localStorage.getItem(`orgview-characters-${props.book?.id}`)
        return saved ? JSON.parse(saved) : []
    })

    const [isAddingOrg, setIsAddingOrg] = useState(false)
    const [newOrgName, setNewOrgName] = useState('')

    const [gradeForm, setGradeForm] = useState(null)
    const [gradeToDelete, setGradeToDelete] = useState(null)
    const [isConfirmGradeOpen, setIsConfirmGradeOpen] = useState(false)

    const [hoveredId, setHoveredId] = useState(null)
    const [dragGrade, setDragGrade] = useState(null)
    const [dragOverId, setDragOverId] = useState(null)
    const [hoveredAvatarKey, setHoveredAvatarKey] = useState(null)
    const [characterForGradeAssign, setCharacterForGradeAssign] = useState(null)

    const isFirstMount = useRef(true)

    useEffect(() => {
        fetchCharacter()
        fetchAllChapters()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        if (organizations.length === 0) return
        const stillExists = organizations.some(o => Number(o.id) === Number(selectedOrgId))
        if (!selectedOrgId || !stillExists) setSelectedOrgId(organizations[0].id)
    }, [organizations])

    useEffect(() => {
        if (chapters.length === 0) return
        const stillExists = chapters.some(c => Number(c.id) === Number(selectedChapterId))
        if (!selectedChapterId || !stillExists) setSelectedChapterId(chapters[0].id)
    }, [chapters])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`orgview-org-${props.book.id}`, JSON.stringify(selectedOrgId))
    }, [selectedOrgId])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`orgview-chapter-${props.book.id}`, JSON.stringify(selectedChapterId))
    }, [selectedChapterId])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`orgview-characters-${props.book.id}`, JSON.stringify(selectedCharacterIds))
    }, [selectedCharacterIds])

    useEffect(() => {
        if (selectedOrgId) {
            fetchTree()
            autoSelectOrgMembers()
        }
        setZoom(1)
        // if (!isFirstMount.current) {
        //     setSelectedCharacterIds([])
        // }
        isFirstMount.current = false
    }, [selectedOrgId])

    useEffect(() => {
        if (selectedOrgId && selectedChapterId && selectedCharacterIds.length > 0) {
            fetchGrades()
        } else {
            setGradesByCharacter({})
        }
    }, [selectedOrgId, selectedChapterId, selectedCharacterIds])


    const autoSelectOrgMembers = async () => {
        if (!selectedOrgId) return
        const result = await api('characterGrade:findCharacterIdsByOrganization', selectedOrgId)
        if (!result.success) return
        setSelectedCharacterIds(result.data)
    }

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

    const fetchOrganizations = async () => {
        const result = await api('organization:findBy', { book_id: props.book.id })
        if (result.success) setOrganizations(result.data)
    }

    const fetchTree = async () => {
        const result = await api('grade:getTree', selectedOrgId)
        if (result.success) setTree(result.data)
    }

    const fetchGrades = async () => {
        const result = await api('characterGrade:getGradesForCharactersAtChapter', {
            characterIds: selectedCharacterIds,
            organizationId: selectedOrgId,
            chapterId: selectedChapterId,
        })
        if (result.success) setGradesByCharacter(result.data)
    }

    const toggleCharacter = (id) => {
        setSelectedCharacterIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const toggleAllOrgMembers = async () => {
        if (!selectedOrgId) return
        const result = await api('characterGrade:findCharacterIdsByOrganization', selectedOrgId)
        if (!result.success) return
        const memberIds = result.data
        const allSelected = memberIds.length > 0 && memberIds.every(id => selectedCharacterIds.includes(id))
        if (allSelected) {
            setSelectedCharacterIds(prev => prev.filter(id => !memberIds.includes(id)))
        } else {
            setSelectedCharacterIds(prev => [...new Set([...prev, ...memberIds])])
        }
    }

    const handleCreateOrg = async () => {
        if (!newOrgName.trim()) return
        const result = await api('organization:create', { book_id: props.book.id, name: newOrgName.trim() })
        if (result.success) {
            setNewOrgName('')
            setIsAddingOrg(false)
            await fetchOrganizations()
        }
    }

    const handleSaveGrade = async (data) => {
        const result = gradeForm.grade
            ? await api('grade:update', { id: gradeForm.grade.id, data })
            : await api('grade:create', { ...data, organization_id: selectedOrgId })

        if (result.success) {
            setGradeForm(null)
            await fetchTree()
        }
    }

    const handleDeleteGrade = async () => {
        await api('grade:delete', gradeToDelete.id)
        setIsConfirmGradeOpen(false)
        setGradeToDelete(null)
        await fetchTree()
    }

    const toggleMode = () => {
        if (mode === 'edit') setGradeForm(null)
        setMode(prev => prev === 'view' ? 'edit' : 'view')
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

    const handleDragStart = (grade) => setDragGrade(grade)

    const handleDragOver = (e, grade) => {
        e.preventDefault()
        if (dragGrade && dragGrade.id !== grade.id) setDragOverId(grade.id)
    }

    const findSiblings = (nodes, parentIds) => {
        if (!parentIds || parentIds.length === 0) return nodes
        for (const n of nodes) {
            if (parentIds.includes(n.id)) return n.children
            const found = findSiblings(n.children, parentIds)
            if (found) return found
        }
        return null
    }

    const handleDrop = async (e, targetGrade) => {
        e.preventDefault()
        setDragOverId(null)
        if (!dragGrade || dragGrade.id === targetGrade.id) return

        const siblings = findSiblings(tree, dragGrade.parents)
        if (!siblings) { setDragGrade(null); return }

        const withoutDragged = siblings.filter(s => s.id !== dragGrade.id)
        const targetIndex = withoutDragged.findIndex(s => s.id === targetGrade.id)
        if (targetIndex === -1) { setDragGrade(null); return }
        withoutDragged.splice(targetIndex, 0, dragGrade)

        setDragGrade(null)
        await api('grade:reorderSiblings', withoutDragged.map(s => ({ id: s.id })))
        await fetchTree()
    }

    const charactersByGradeId = useMemo(() => {
        const map = {}
        for (const charId of selectedCharacterIds) {
            const char = character.find(c => c.id === charId)
            if (!char) continue
            const gradeRow = gradesByCharacter[charId]
            const key = gradeRow ? gradeRow.grade_id : '__lowest__'
            if (!map[key]) map[key] = []
            map[key].push(char)
        }
        return map
    }, [selectedCharacterIds, gradesByCharacter, character])

    const initialOf = (text) => text?.trim()?.charAt(0)?.toUpperCase() || '?'
    const lowestOccupants = charactersByGradeId['__lowest__'] || []

    const renderEditOverlayButtons = () => {
        if (mode !== 'edit') return null
        return layout?.positions?.map(({ node, x, y, width }) => {
            if (hoveredId !== node.id) return null
            return (
                <div
                    key={node.id}
                    className='absolute flex gap-1 bg-primary-50 rounded-lg shadow-md p-1'
                    style={{ left: x + width / 2 - 8, top: y - 14 }}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                    <button onClick={() => setGradeForm({ grade: null, defaultParentId: node.id })} title='Ajouter un sous-grade' className='p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                        <BadgePlus size={14} />
                    </button>
                    <button onClick={() => setGradeForm({ grade: node, defaultParentId: null })} title='Modifier' className='p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                        <Pen size={14} />
                    </button>
                    <button onClick={() => { setGradeToDelete(node); setIsConfirmGradeOpen(true) }} title='Supprimer' className='p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded'>
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        })
    }

    const [chartLayout, setChartLayout] = useState({ positions: [] })
    const layout = chartLayout

    return (
        <div className="flex flex-col gap-4 p-4" style={{ height: '70vh' }}>

            <ModalImage src={previewSrc} isOpen={!!previewSrc} onClose={() => setPreviewSrc(null)} />

            <ConfirmInline
                isOpen={isConfirmGradeOpen}
                onClose={() => setIsConfirmGradeOpen(false)}
                onConfirm={handleDeleteGrade}
                message={`Supprimer le grade "${gradeToDelete?.title}" ? Ses sous-grades seront remontés au niveau supérieur.`}
            />

            <Modal isOpen={!!characterForGradeAssign} onClose={() => { setCharacterForGradeAssign(null); fetchGrades() }} size={45}>
                {characterForGradeAssign && (
                    <ModalAssignGrade
                        character={characterForGradeAssign}
                        book={props.book}
                        onClose={() => { setCharacterForGradeAssign(null); fetchGrades() }}
                    />
                )}
            </Modal>

            {isAddingOrg && (
                <div className='fixed inset-0 z-[60] flex items-center justify-center'>
                    <div className='absolute inset-0 bg-black/50' onClick={() => setIsAddingOrg(false)} />
                    <div className='relative bg-primary-1 rounded-lg p-6 shadow-xl z-10 w-[400px]'>
                        <p className='text-center text-primary-800 font-bold mb-4'>Nouvelle organisation</p>
                        <input
                            autoFocus
                            type='text'
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
                            placeholder='Nom (ex: Les Mages)'
                            className='w-full px-3 py-2 rounded-lg text-sm border border-primary-200 outline-none focus:border-primary-400 mb-4'
                        />
                        <div className='flex gap-3'>
                            <button onClick={() => setIsAddingOrg(false)} className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors'>
                                Annuler
                            </button>
                            <button onClick={handleCreateOrg} className='flex-1 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold'>
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='flex flex-wrap gap-4 items-end'>
                {organizations.length > 0 && mode === 'view' && (
                    <div className='flex-1 min-w-[200px]'>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Chapitre</label>
                        <select
                            value={selectedChapterId || ''}
                            onChange={(e) => setSelectedChapterId(e.target.value)}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
                        >
                            {chapters.map(ch => (
                                <option key={ch.id} value={ch.id}>{ch.tome_title} — {ch.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className='flex-1 min-w-[200px]'>
                    <label className='block mb-1 text-xs text-primary-500 font-medium'>Organisation</label>
                    {organizations.length > 0 ? (
                        <select
                            value={selectedOrgId || ''}
                            onChange={(e) => setSelectedOrgId(e.target.value)}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
                        >
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    ) : (
                        <p className='text-xs text-primary-300 italic py-2'>Aucune organisation encore</p>
                    )}
                </div>

                <div className='flex gap-2 flex-shrink-0'>
                    {selectedOrgId && (
                        <button
                            onClick={toggleMode}
                            className={`flex items-center gap-2 px-3 py-2 transition-colors rounded-lg text-sm font-bold ${mode === 'edit' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-primary-100 hover:bg-primary-200 text-primary-600'}`}
                        >
                            {mode === 'edit' ? <Check size={16} /> : <Settings size={16} />}
                            {mode === 'edit' ? 'Terminer' : 'Modifier'}
                        </button>
                    )}
                    <button
                        onClick={() => setIsAddingOrg(true)}
                        className='flex items-center gap-2 px-3 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg text-sm font-bold'
                    >
                        <BadgePlus size={16} /> Nouvelle organisation
                    </button>
                </div>
            </div>

            {organizations.length === 0 ? (
                <div className='flex-1 flex flex-col items-center justify-center gap-2 text-primary-300'>
                    <Network size={32} />
                    <p>Crée ta première organisation pour voir son organigramme.</p>
                </div>
            ) : (
                <div className='flex-1 flex gap-4 min-h-0'>

                    {mode === 'view' && (
                        <div className='w-64 flex-shrink-0 flex flex-col gap-2.5 overflow-y-auto hide-scrollbar pr-1'>
                            <div className='flex items-center justify-between'>
                                <label className='text-sm text-primary-500 font-medium'>Personnages à afficher</label>
                                {selectedOrgId && (
                                    <button
                                        onClick={toggleAllOrgMembers}
                                        className='flex-shrink-0 p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'
                                    >
                                        <Users size={16} />
                                    </button>
                                )}
                            </div>
                            {character.length === 0 && <p className='text-primary-300 text-sm'>Aucun personnage dans ce livre.</p>}
                            {character.map(char => {
                                const isSelected = selectedCharacterIds.includes(char.id)
                                return (
                                    <div
                                        key={char.id}
                                        className={`flex items-center gap-2 rounded-xl transition-colors ${isSelected ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-600 hover:bg-primary-200'}`}
                                    >
                                        <button
                                            onClick={() => toggleCharacter(char.id)}
                                            className='flex-1 flex items-center gap-3 px-3 py-3 text-base font-medium text-left min-w-0'
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
                                        <button
                                            onClick={() => setCharacterForGradeAssign(char)}
                                            className={`flex-shrink-0 p-2 mr-1 rounded-lg transition-colors ${isSelected ? 'hover:bg-primary-300' : 'hover:bg-primary-300 hover:text-white'}`}
                                        >
                                            <Network size={16} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className='flex-1 flex flex-col gap-3 min-h-0'>
                        {mode === 'edit' && (
                            <div className='flex justify-end'>
                                <button
                                    onClick={() => setGradeForm({ grade: null, defaultParentId: null })}
                                    className='flex items-center gap-2 px-3 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg text-sm font-bold'
                                >
                                    <BadgePlus size={16} /> Nouveau grade
                                </button>
                            </div>
                        )}

                        <div className='flex-1 relative min-h-0'>
                            {tree.length > 0 && (
                                <div className='absolute top-3 right-3 z-20 flex items-center gap-1 bg-primary-1 rounded-lg shadow-md p-1'>
                                    <button onClick={zoomOut} className='p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                                        <ZoomOut size={16} />
                                    </button>
                                    <button onClick={zoomReset} className='px-2 text-xs font-bold text-primary-500 hover:text-primary-700 min-w-[3rem] text-center'>
                                        {Math.round(zoom * 100)}%
                                    </button>
                                    <button onClick={zoomIn} className='p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                                        <ZoomIn size={16} />
                                    </button>
                                    <div className='w-px h-5 bg-primary-100 mx-0.5' />
                                    <button onClick={zoomReset} className='p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                                        <Maximize size={16} />
                                    </button>
                                </div>
                            )}

                            <div
                                className='absolute inset-0 overflow-auto hide-scrollbar bg-primary-50 rounded-xl p-4'
                                onWheel={handleWheelZoom}
                            >
                                {tree.length === 0 ? (
                                    <div className='h-full flex flex-col items-center justify-center gap-2 text-primary-300'>
                                        <Network size={32} />
                                        <p>{mode === 'edit' ? "Aucun grade encore." : "Cette organisation n'a encore aucun grade défini."}</p>
                                    </div>
                                ) : (
                                    <div style={{ minWidth: layout.totalWidth ? layout.totalWidth * zoom : '100%', minHeight: '100%' }}>
                                        <div
                                            className='relative'
                                            style={{
                                                width: layout.totalWidth ? layout.totalWidth * zoom : '100%',
                                                height: layout.totalHeight ? layout.totalHeight * zoom : '100%',
                                            }}
                                        >
                                            <div
                                                className='relative'
                                                style={{
                                                    width: layout.totalWidth,
                                                    height: layout.totalHeight,
                                                    transform: `scale(${zoom})`,
                                                    transformOrigin: 'top left',
                                                }}
                                            >
                                                <OrganizationChart
                                                    tree={tree}
                                                    mode={mode}
                                                    charactersByGradeId={charactersByGradeId}
                                                    hoveredId={hoveredId}
                                                    setHoveredId={setHoveredId}
                                                    dragOverId={dragOverId}
                                                    hoveredAvatarKey={hoveredAvatarKey}
                                                    setHoveredAvatarKey={setHoveredAvatarKey}
                                                    onDragStart={handleDragStart}
                                                    onDragOver={handleDragOver}
                                                    onDrop={handleDrop}
                                                    setPreviewSrc={setPreviewSrc}
                                                    onLayoutReady={setChartLayout}
                                                />
                                                {renderEditOverlayButtons()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mode === 'edit' && gradeForm && (
                                <div className='absolute inset-0 bg-primary-50 rounded-xl p-4 overflow-y-auto z-10'>
                                    <ModalOrganizationForm
                                        grade={gradeForm.grade}
                                        defaultParentId={gradeForm.defaultParentId}
                                        organizationId={selectedOrgId}
                                        tree={tree}
                                        onSave={handleSaveGrade}
                                        onClose={() => setGradeForm(null)}
                                    />
                                </div>
                            )}
                        </div>

                        {mode === 'view' && lowestOccupants.length > 0 && (
                            <div className='bg-primary-100 rounded-lg px-3 py-2 flex items-center gap-3 flex-shrink-0'>
                                <span className='text-xs font-bold text-primary-600 flex-shrink-0'>Aucun grade attribué :</span>
                                <div className='flex flex-wrap gap-2'>
                                    {lowestOccupants.map(char => (
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