import React, { useState, useEffect, useMemo } from 'react'
import { useApi } from '../../context/ApiContext'
import Modal from './Modal'
import ModalImage from './ModalImage'
import ModalAssignGrade from './ModalAssignGrade'
import { Network, BadgePlus, Pen, Trash2, AlertTriangle, Settings, Check, Users, ZoomIn, ZoomOut, Maximize } from 'lucide-react'

// petite confirmation inline reutilisable (independante de ModalDelete qui gere son propre
// appel api(`${table}:delete`) -- ici on a besoin de logique supplementaire apres suppression,
// comme rafraichir l'arbre ou fermer le formulaire en cours)
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

// largeur/hauteur d'une case de grade dans le svg, et espacement entre niveaux
// dimensions de base : MIN_NODE_WIDTH/EDIT_NODE_HEIGHT pour les cases vides ou en mode edition,
// CARD_WIDTH/CARD_HEIGHT pour une mini-carte "personne" (avatar + nom) a l'interieur d'une case
// occupee. La largeur/hauteur reelle d'une case occupee depend du nombre de personnes qu'elle
// contient (calculee dynamiquement, voir getNodeSize), donc plus aucun chevauchement ni texte
// qui depasse, peu importe combien de gens partagent le meme grade.
const MIN_NODE_WIDTH = 150
const EDIT_NODE_HEIGHT = 70
const CARD_WIDTH = 92
const CARD_HEIGHT = 88
const CARD_GAP = 10
const CARDS_PER_ROW = 3 // au-dela de 3 personnes sur un meme grade, on passe a la ligne suivante
const AVATAR_RADIUS = 26
const PADDING = 14
const LEVEL_GAP = 70
const SIBLING_GAP = 24

// bornes et pas du zoom de l'organigramme (1 = taille reelle)
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
    const [gradesByCharacter, setGradesByCharacter] = useState({}) // { characterId: ligne_grade | null }

    // mode 'view' = organigramme + selection de persos (par defaut)
    // mode 'edit' = creation/edition/suppression/reorganisation des grades, persos masques
    const [mode, setMode] = useState('view')

    // niveau de zoom de l'organigramme (1 = 100%), reinitialise a chaque changement d'organisation
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

    // creation rapide d'une organisation, en popup separee (ne deplace jamais le select)
    const [isAddingOrg, setIsAddingOrg] = useState(false)
    const [newOrgName, setNewOrgName] = useState('')

    // formulaire grade (mode edit) : null = ferme, sinon { grade: null|existing }
    const [gradeForm, setGradeForm] = useState(null)
    const [gradeTitle, setGradeTitle] = useState('')
    const [gradeParentId, setGradeParentId] = useState('')
    const [gradeToDelete, setGradeToDelete] = useState(null)
    const [isConfirmGradeOpen, setIsConfirmGradeOpen] = useState(false)
    const [gradeError, setGradeError] = useState(null)

    // case survolee (mode edit, pour afficher ses boutons d'action) + drag and drop
    const [hoveredId, setHoveredId] = useState(null)
    const [dragGrade, setDragGrade] = useState(null)
    const [dragOverId, setDragOverId] = useState(null)

    // avatar actuellement survole (cle composite nodeId-characterId), pour l'agrandir et le
    // faire passer au-dessus de tout le reste au survol
    const [hoveredAvatarKey, setHoveredAvatarKey] = useState(null)

    // personnage pour lequel la popup d'attribution de grade est ouverte (null = fermee)
    const [characterForGradeAssign, setCharacterForGradeAssign] = useState(null)

    useEffect(() => {
        fetchCharacter()
        fetchAllChapters()
        fetchOrganizations()
    }, [])

    // si rien n'est sauvegarde (ou si l'orga sauvegardee n'existe plus), on prend la 1ere organisation
    useEffect(() => {
        if (organizations.length === 0) return
        const stillExists = organizations.some(o => o.id === selectedOrgId)
        if (!selectedOrgId || !stillExists) setSelectedOrgId(organizations[0].id)
    }, [organizations])

    // pareil pour le chapitre : par defaut le premier, sinon on garde celui sauvegarde s'il existe encore
    useEffect(() => {
        if (chapters.length === 0) return
        const stillExists = chapters.some(c => c.id === selectedChapterId)
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
        if (selectedOrgId) fetchTree()
        setZoom(1)
    }, [selectedOrgId])

    useEffect(() => {
        if (selectedOrgId && selectedChapterId && selectedCharacterIds.length > 0) {
            fetchGrades()
        } else {
            setGradesByCharacter({})
        }
    }, [selectedOrgId, selectedChapterId, selectedCharacterIds])

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

        // trié par numéro de tome puis position du chapitre, pour un affichage cohérent dans les pills
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

    // selectionne ou deselectionne en bloc tous les personnages ayant au moins une attribution
    // dans l'organisation actuellement choisie. Si tous sont deja selectionnes -> on les retire
    // tous ; sinon -> on ajoute ceux qui manquent (sans toucher aux persos d'autres organisations
    // deja selectionnes par ailleurs).
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

    // --- gestion des grades (mode edit) ---

    // liste plate de tous les grades (pour le select "superieur direct"), avec leur profondeur
    const flattenForSelect = (nodes, depth = 0, acc = []) => {
        nodes.forEach(n => {
            acc.push({ id: n.id, title: n.title, depth })
            flattenForSelect(n.children, depth + 1, acc)
        })
        return acc
    }
    const flatGradeOptions = flattenForSelect(tree)

    const openAddRoot = () => {
        setGradeForm({ grade: null })
        setGradeTitle('')
        setGradeParentId('')
        setGradeError(null)
    }

    const openAddChild = (parentGrade) => {
        setGradeForm({ grade: null })
        setGradeTitle('')
        setGradeParentId(parentGrade.id)
        setGradeError(null)
    }

    const openEditGrade = (grade) => {
        setGradeForm({ grade })
        setGradeTitle(grade.title)
        setGradeParentId(grade.parent_grade_id || '')
        setGradeError(null)
    }

    const closeGradeForm = () => {
        setGradeForm(null)
        setGradeError(null)
    }

    const handleSaveGrade = async () => {
        if (!gradeTitle.trim()) {
            setGradeError('Le titre du grade est obligatoire.')
            return
        }
        const payload = {
            organization_id: selectedOrgId,
            title: gradeTitle.trim(),
            parent_grade_id: gradeParentId || null,
        }

        const result = gradeForm.grade
            ? await api('grade:update', { id: gradeForm.grade.id, data: payload })
            : await api('grade:create', payload)

        if (result.success) {
            closeGradeForm()
            await fetchTree()
        } else {
            setGradeError(result.message)
        }
    }

    const handleDeleteGrade = async () => {
        await api('grade:delete', gradeToDelete.id)
        setIsConfirmGradeOpen(false)
        setGradeToDelete(null)
        await fetchTree()
    }

    // bascule entre les deux modes : en sortant de edit, on referme tout formulaire en cours
    const toggleMode = () => {
        if (mode === 'edit') closeGradeForm()
        setMode(prev => prev === 'view' ? 'edit' : 'view')
    }

    // --- zoom de l'organigramme ---

    const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))
    const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))
    const zoomReset = () => setZoom(1)

    // zoom a la molette uniquement si Ctrl/Cmd est maintenu, pour ne pas gener le scroll normal
    // de la zone (qui sert a se deplacer dans l'arbre quand il est plus grand que la fenetre)
    const handleWheelZoom = (e) => {
        if (!e.ctrlKey && !e.metaKey) return
        e.preventDefault()
        if (e.deltaY < 0) zoomIn()
        else zoomOut()
    }

    // --- drag and drop par fratrie (memes parent_grade_id uniquement), mode edit seulement ---

    const handleDragStart = (grade) => setDragGrade(grade)

    const handleDragOver = (e, grade) => {
        e.preventDefault()
        if (dragGrade && dragGrade.parent_grade_id === grade.parent_grade_id && dragGrade.id !== grade.id) {
            setDragOverId(grade.id)
        }
    }

    // retrouve le tableau (reference live de l'arbre courant) qui contient la fratrie
    // partageant le parentId donne. Si parentId est null/vide, c'est le tableau racine.
    const findSiblings = (nodes, parentId) => {
        if (!parentId) return nodes
        for (const n of nodes) {
            if (n.id === parentId) return n.children
            const found = findSiblings(n.children, parentId)
            if (found) return found
        }
        return null
    }

    const handleDrop = async (e, targetGrade) => {
        e.preventDefault()
        setDragOverId(null)
        if (!dragGrade || dragGrade.id === targetGrade.id) return
        if (dragGrade.parent_grade_id !== targetGrade.parent_grade_id) {
            setDragGrade(null)
            return // pas de deplacement vers une autre fratrie depuis ce drag simple
        }

        const siblings = findSiblings(tree, dragGrade.parent_grade_id)
        const withoutDragged = siblings.filter(s => s.id !== dragGrade.id)
        const targetIndex = withoutDragged.findIndex(s => s.id === targetGrade.id)
        withoutDragged.splice(targetIndex, 0, dragGrade)

        setDragGrade(null)
        await api('grade:reorderSiblings', withoutDragged.map(s => ({ id: s.id })))
        await fetchTree()
    }

    // regroupe les personnages selectionnes par grade_id (plusieurs persos peuvent partager
    // le meme grade). Les persos sans ligne en bdd pour ce chapitre -> grade le plus bas implicite,
    // regroupes sous la cle speciale "__lowest__".
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

    // decoupe un titre en 1 ou 2 lignes maximum pour qu'il ne deborde jamais de la case.
    // Coupe sur un espace le plus proche du milieu, jamais au milieu d'un mot. Si meme la
    // 2eme ligne est trop longue, elle est tronquee avec "...".
    const wrapTitle = (title, maxCharsPerLine = 18) => {
        if (!title || title.length <= maxCharsPerLine) return [title]

        const words = title.split(' ')
        let line1 = ''
        let i = 0
        while (i < words.length && (line1 + words[i]).length <= maxCharsPerLine) {
            line1 += (line1 ? ' ' : '') + words[i]
            i++
        }
        // au moins un mot sur la 1ere ligne, meme s'il depasse legerement, pour eviter une ligne vide
        if (!line1 && words.length > 0) { line1 = words[0]; i = 1 }

        let line2 = words.slice(i).join(' ')
        if (line2.length > maxCharsPerLine) line2 = line2.slice(0, maxCharsPerLine - 1) + '…'

        return line2 ? [line1, line2] : [line1]
    }

    // taille reelle d'une case : en mode edit, taille fixe (pas d'occupants a afficher).
    // En mode vue, la case s'agrandit selon le nombre de personnes qui partagent ce grade
    // (disposees en grille de CARDS_PER_ROW colonnes max), pour que rien ne deborde jamais.
    const getNodeSize = (node) => {
        const titleLines = wrapTitle(node.title).length
        const titleHeight = titleLines === 2 ? 44 : 30 // place reservee en haut de la case pour le titre

        if (mode === 'edit') return { width: MIN_NODE_WIDTH, height: Math.max(EDIT_NODE_HEIGHT, titleHeight + 40) }

        const occupants = charactersByGradeId[node.id] || []
        if (occupants.length === 0) return { width: MIN_NODE_WIDTH, height: titleHeight + EDIT_NODE_HEIGHT }

        const cols = Math.min(occupants.length, CARDS_PER_ROW)
        const rows = Math.ceil(occupants.length / CARDS_PER_ROW)
        const width = Math.max(MIN_NODE_WIDTH, cols * CARD_WIDTH + (cols - 1) * CARD_GAP + PADDING * 2)
        const height = titleHeight + rows * CARD_HEIGHT + (rows - 1) * CARD_GAP + PADDING
        return { width, height, titleHeight }
    }

    // calcule les coordonnees (x, y) de chaque noeud de l'arbre pour le rendu svg.
    // Algorithme : largeur de sous-arbre calculee recursivement a partir de la taille reelle
    // de chaque case (et non plus une constante fixe), hauteur uniforme par NIVEAU de
    // profondeur (le niveau le plus "haut" dicte le y de tous les niveaux suivants), pour que
    // toutes les cases d'une meme rangee restent alignees meme si certaines sont plus hautes.
    const layout = useMemo(() => {
        const positions = []
        const edges = []
        const sizeById = {}

        const collectSizes = (nodes) => {
            nodes.forEach(n => { sizeById[n.id] = getNodeSize(n); collectSizes(n.children) })
        }
        collectSizes(tree)

        const subtreeWidth = (node) => {
            const ownWidth = sizeById[node.id].width
            if (node.children.length === 0) return ownWidth
            const childrenWidth = node.children.reduce((sum, c) => sum + subtreeWidth(c), 0)
                + SIBLING_GAP * (node.children.length - 1)
            return Math.max(ownWidth, childrenWidth)
        }

        // hauteur max des cases a chaque profondeur, pour aligner toute une rangee sur la plus
        // haute case de cette rangee (sinon les niveaux suivants seraient decales de travers)
        const maxHeightByDepth = {}
        const collectHeights = (nodes, depth) => {
            nodes.forEach(n => {
                maxHeightByDepth[depth] = Math.max(maxHeightByDepth[depth] || 0, sizeById[n.id].height)
                collectHeights(n.children, depth + 1)
            })
        }
        collectHeights(tree, 0)

        // y de depart cumule de chaque profondeur (somme des hauteurs max des niveaux precedents + gaps)
        const yByDepth = {}
        let cumulY = 0
        Object.keys(maxHeightByDepth).map(Number).sort((a, b) => a - b).forEach(depth => {
            yByDepth[depth] = cumulY
            cumulY += maxHeightByDepth[depth] + LEVEL_GAP
        })

        const place = (node, x, depth) => {
            const width = subtreeWidth(node)
            const centerX = x + width / 2
            const y = yByDepth[depth]

            positions.push({ node, x: centerX, y, ...sizeById[node.id] })

            let childX = x
            node.children.forEach(child => {
                const childWidth = subtreeWidth(child)
                place(child, childX, depth + 1)
                edges.push({ fromId: node.id, toId: child.id })
                childX += childWidth + SIBLING_GAP
            })
        }

        let rootX = 0
        tree.forEach(root => {
            place(root, rootX, 0)
            rootX += subtreeWidth(root) + SIBLING_GAP * 2
        })

        const totalWidth = positions.length > 0
            ? Math.max(MIN_NODE_WIDTH, ...positions.map(p => p.x + p.width / 2))
            : MIN_NODE_WIDTH
        const totalHeight = positions.length > 0
            ? Math.max(...positions.map(p => p.y + p.height))
            : EDIT_NODE_HEIGHT

        return { positions, edges, totalWidth: totalWidth + 20, totalHeight: totalHeight + 20 }
    }, [tree, mode, charactersByGradeId])

    const posById = useMemo(() => {
        const map = {}
        layout.positions.forEach(p => { map[p.node.id] = p })
        return map
    }, [layout])

    const renderEdges = () => {
        return layout.edges.map((edge, i) => {
            const from = posById[edge.fromId]
            const to = posById[edge.toId]
            if (!from || !to) return null
            const fromY = from.y + from.height
            const toY = to.y
            const midY = fromY + (toY - fromY) / 2
            const path = `M ${from.x} ${fromY} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${toY}`
            return (
                <path
                    key={i}
                    d={path}
                    fill='none'
                    stroke='var(--primary-300, #a3a3a3)'
                    strokeWidth={2}
                />
            )
        })
    }

    // initiale a afficher dans un rond vide (pas de perso) : premiere lettre du titre/nom
    const initialOf = (text) => text?.trim()?.charAt(0)?.toUpperCase() || '?'

    // un avatar individuel (rond) : photo du perso si dispo, sinon initiale. Utilise aussi bien
    // pour un perso que, en mode vide, pour le grade lui-meme (avec son titre comme label).
    // avatarKey permet de savoir si CET avatar precis est celui actuellement survole (pour
    // l'agrandir legerement) ; onAvatarClick/onAvatarHover restent optionnels (cases vides
    // n'ont pas besoin d'etre cliquables).
    const renderAvatar = (avatarKey, cx, cy, imageUrl, label, isEmpty, radius = AVATAR_RADIUS, onAvatarClick = null) => {
        const clipId = `clip-${avatarKey}`
        const isHovered = hoveredAvatarKey === avatarKey
        const r = isHovered ? radius * 1.15 : radius
        return (
            <g
                key={avatarKey}
                style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
                onMouseEnter={() => onAvatarClick && setHoveredAvatarKey(avatarKey)}
                onMouseLeave={() => onAvatarClick && setHoveredAvatarKey(null)}
                onClick={onAvatarClick || undefined}
            >
                {imageUrl ? (
                    <>
                        <clipPath id={clipId}>
                            <circle cx={cx} cy={cy} r={r} />
                        </clipPath>
                        <image
                            href={imageUrl}
                            x={cx - r}
                            y={cy - r}
                            width={r * 2}
                            height={r * 2}
                            clipPath={`url(#${clipId})`}
                            preserveAspectRatio='xMidYMid slice'
                        />
                        <circle cx={cx} cy={cy} r={r} fill='none' stroke='white' strokeWidth={2} />
                    </>
                ) : (
                    <>
                        <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill={isEmpty ? 'var(--primary-200, #e2e8f0)' : 'var(--primary-500, #64748b)'}
                        />
                        <text
                            x={cx}
                            y={cy}
                            textAnchor='middle'
                            dominantBaseline='central'
                            fontSize={r}
                            fontWeight='bold'
                            fill={isEmpty ? 'var(--primary-500, #64748b)' : 'white'}
                        >
                            {initialOf(label)}
                        </text>
                    </>
                )}
            </g>
        )
    }

    const renderNodes = () => {
        if (mode === 'edit') {
            // mode edition : case simple (titre seul), taille fixe, draggable
            return layout.positions.map(({ node, x, y, width, height }) => {
                const isDragOver = dragOverId === node.id
                const isHovered = hoveredId === node.id
                return (
                    <g
                        key={node.id}
                        transform={`translate(${x - width / 2}, ${y})`}
                        draggable
                        onDragStart={() => handleDragStart(node)}
                        onDragOver={(e) => handleDragOver(e, node)}
                        onDrop={(e) => handleDrop(e, node)}
                        onMouseEnter={() => setHoveredId(node.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{ cursor: 'grab' }}
                    >
                        <rect
                            width={width}
                            height={height}
                            rx={12}
                            fill={isDragOver ? 'var(--primary-200, #bfdbfe)' : 'var(--primary-100, #dbeafe)'}
                            stroke={isHovered || isDragOver ? 'var(--primary-500, #3b82f6)' : 'var(--primary-300, #93c5fd)'}
                            strokeWidth={isHovered || isDragOver ? 2.5 : 1.5}
                        />
                        {(() => {
                            const lines = wrapTitle(node.title)
                            const lineHeight = 15
                            const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2
                            return (
                                <text x={width / 2} textAnchor='middle' fontSize='13' fontWeight='bold' fill='var(--primary-700, #1e3a8a)'>
                                    {lines.map((line, i) => (
                                        <tspan key={i} x={width / 2} y={startY + i * lineHeight} dominantBaseline='middle'>{line}</tspan>
                                    ))}
                                </text>
                            )
                        })()}
                    </g>
                )
            })
        }

        // mode vue : grand rectangle pour le grade, contenant une grille de mini-cartes
        // (une par personne occupant ce grade), ou une seule case vide a l'initiale du grade
        return layout.positions.map(({ node, x, y, width, height }) => {
            const occupants = charactersByGradeId[node.id] || []
            const hasOccupants = occupants.length > 0
            const centerX = width / 2
            const titleLines = wrapTitle(node.title)
            const titleAreaHeight = titleLines.length === 2 ? 44 : 30

            return (
                <g key={node.id} transform={`translate(${x - width / 2}, ${y})`}>
                    <rect
                        width={width}
                        height={height}
                        rx={12}
                        fill={hasOccupants ? 'var(--primary-100, #dbeafe)' : 'var(--primary-50, #f8fafc)'}
                        stroke={hasOccupants ? 'var(--primary-400, #60a5fa)' : 'var(--primary-300, #a3a3a3)'}
                        strokeWidth={hasOccupants ? 2.5 : 1.5}
                    />

                    {/* titre du grade, toujours en haut de la case, sur 1 ou 2 lignes */}
                    <text x={centerX} textAnchor='middle' fontSize='12' fontWeight='bold' fill={hasOccupants ? 'var(--primary-700, #1e3a8a)' : 'var(--primary-700, #334155)'}>
                        {titleLines.map((line, i) => (
                            <tspan key={i} x={centerX} y={titleLines.length === 2 ? 17 + i * 16 : 18} dominantBaseline='middle'>{line}</tspan>
                        ))}
                    </text>

                    {hasOccupants ? (
                        // grille de mini-cartes (avatar + nom complet dessous), une par personne.
                        // Chaque ligne de la grille est centree independamment dans la largeur de
                        // la case (une ligne incomplete, ex: 1 perso sur la derniere ligne, reste
                        // centree plutot que collee a gauche).
                        occupants.map((char, i) => {
                            const row = Math.floor(i / CARDS_PER_ROW)
                            const colsInThisRow = Math.min(CARDS_PER_ROW, occupants.length - row * CARDS_PER_ROW)
                            const col = i % CARDS_PER_ROW
                            const rowWidth = colsInThisRow * CARD_WIDTH + (colsInThisRow - 1) * CARD_GAP
                            const rowStartX = (width - rowWidth) / 2
                            const cardX = rowStartX + col * (CARD_WIDTH + CARD_GAP)
                            const cardY = titleAreaHeight + row * (CARD_HEIGHT + CARD_GAP)
                            const avatarKey = `${node.id}-${char.id}`
                            return (
                                <g key={char.id} transform={`translate(${cardX}, ${cardY})`}>
                                    {renderAvatar(
                                        avatarKey,
                                        CARD_WIDTH / 2,
                                        AVATAR_RADIUS + 2,
                                        char.image_url,
                                        char.name,
                                        false,
                                        AVATAR_RADIUS,
                                        () => setPreviewSrc(char.image_url)
                                    )}
                                    <text
                                        x={CARD_WIDTH / 2}
                                        y={AVATAR_RADIUS * 2 + 14}
                                        textAnchor='middle'
                                        dominantBaseline='middle'
                                        fontSize='10'
                                        fill='var(--primary-600, #475569)'
                                    >
                                        {char.name.length > 12 ? char.name.slice(0, 11) + '…' : char.name}
                                    </text>
                                </g>
                            )
                        })
                    ) : (
                        renderAvatar(node.id, centerX, titleAreaHeight + (height - titleAreaHeight) / 2, null, node.title, true)
                    )}
                </g>
            )
        })
    }

    // l'avatar survole doit passer AU-DESSUS de toutes les autres cases (pas seulement la
    // sienne) : en SVG l'empilement suit l'ordre du DOM, donc on redessine une derniere fois,
    // tout en bas de l'arbre de rendu, uniquement la carte actuellement survolee.
    const renderHoveredAvatarOnTop = () => {
        if (mode === 'edit' || !hoveredAvatarKey) return null

        for (const { node, x, y, width } of layout.positions) {
            const occupants = charactersByGradeId[node.id] || []
            const index = occupants.findIndex(c => `${node.id}-${c.id}` === hoveredAvatarKey)
            if (index === -1) continue

            const char = occupants[index]
            const row = Math.floor(index / CARDS_PER_ROW)
            const colsInThisRow = Math.min(CARDS_PER_ROW, occupants.length - row * CARDS_PER_ROW)
            const col = index % CARDS_PER_ROW
            const rowWidth = colsInThisRow * CARD_WIDTH + (colsInThisRow - 1) * CARD_GAP
            const rowStartX = (width - rowWidth) / 2
            const titleAreaHeight = wrapTitle(node.title).length === 2 ? 44 : 30
            const cardX = (x - width / 2) + rowStartX + col * (CARD_WIDTH + CARD_GAP)
            const cardY = y + titleAreaHeight + row * (CARD_HEIGHT + CARD_GAP)

            return (
                <g transform={`translate(${cardX}, ${cardY})`}>
                    {renderAvatar(
                        hoveredAvatarKey,
                        CARD_WIDTH / 2,
                        AVATAR_RADIUS + 2,
                        char.image_url,
                        char.name,
                        false,
                        AVATAR_RADIUS,
                        () => setPreviewSrc(char.image_url)
                    )}
                </g>
            )
        }
        return null
    }

    // boutons d'action superposes en HTML par-dessus chaque case, visibles au survol, mode edit
    // uniquement. Le conteneur parent (relatif) partage le meme repere que le svg, donc les
    // coordonnees x/y du layout correspondent directement aux pixels CSS du conteneur.
    const renderEditOverlayButtons = () => {
        if (mode !== 'edit') return null
        return layout.positions.map(({ node, x, y, width }) => {
            if (hoveredId !== node.id) return null
            return (
                <div
                    key={node.id}
                    className='absolute flex gap-1 bg-primary-50 rounded-lg shadow-md p-1'
                    style={{ left: x + width / 2 - 8, top: y - 14 }}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                    <button onClick={() => openAddChild(node)} title='Ajouter un sous-grade' className='p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                        <BadgePlus size={14} />
                    </button>
                    <button onClick={() => openEditGrade(node)} title='Modifier' className='p-1 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded'>
                        <Pen size={14} />
                    </button>
                    <button onClick={() => { setGradeToDelete(node); setIsConfirmGradeOpen(true) }} title='Supprimer' className='p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded'>
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        })
    }

    // persos sans grade trouve pour ce chapitre (= grade le plus bas implicite), affiches a part
    const lowestOccupants = charactersByGradeId['__lowest__'] || []

    return (
        <div className="flex flex-col gap-4 p-4" style={{ height: '70vh' }}>

            <ModalImage
                src={previewSrc}
                isOpen={!!previewSrc}
                onClose={() => setPreviewSrc(null)}
            />

            <ConfirmInline
                isOpen={isConfirmGradeOpen}
                onClose={() => setIsConfirmGradeOpen(false)}
                onConfirm={handleDeleteGrade}
                message={`Supprimer le grade "${gradeToDelete?.title}" ? Ses sous-grades seront remontes au niveau superieur.`}
            />

            {/* popup d'attribution de grade pour un personnage. A la fermeture, on rafraichit
                l'organigramme affiche au cas ou le perso concerne y soit visible */}
            <Modal isOpen={!!characterForGradeAssign} onClose={() => { setCharacterForGradeAssign(null); fetchGrades() }} size={45}>
                {characterForGradeAssign && (
                    <ModalAssignGrade
                        character={characterForGradeAssign}
                        book={props.book}
                        onClose={() => { setCharacterForGradeAssign(null); fetchGrades() }}
                    />
                )}
            </Modal>

            {/* popup separee pour creer une organisation, n'affecte jamais la mise en page des selects */}
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
                                Creer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* selection chapitre (gauche) + organisation (droite), boutons texte+icone a droite.
                en mode edit, le chapitre n'a plus d'effet (pas de perso affiche) donc on le masque */}
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

                {/* boutons d'action, toujours a droite des selects, avec libelle texte explicite */}
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
                    <p>Cree ta premiere organisation pour voir son organigramme.</p>
                </div>
            ) : (
                <div className='flex-1 flex gap-4 min-h-0'>

                    {/* colonne gauche : personnages a afficher, masquee en mode edit (pas de
                        selection de perso pendant l'edition des grades) */}
                    {mode === 'view' && (
                        <div className='w-64 flex-shrink-0 flex flex-col gap-2.5 overflow-y-auto hide-scrollbar pr-1'>
                            <div className='flex items-center justify-between'>
                                <label className='text-sm text-primary-500 font-medium'>Personnages a afficher</label>
                                {selectedOrgId && (
                                    <button
                                        onClick={toggleAllOrgMembers}
                                        title="Selectionner/deselectionner tous les membres de cette organisation"
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
                                            title='Attribuer un grade'
                                            className={`flex-shrink-0 p-2 mr-1 rounded-lg transition-colors ${isSelected ? 'hover:bg-primary-300' : 'hover:bg-primary-300 hover:text-white'}`}
                                        >
                                            <Network size={16} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* colonne organigramme : centree horizontalement, scrollable dans les deux
                        sens si le contenu depasse. Prend toute la largeur en mode edit (pas de
                        colonne perso a cote) */}
                    <div className='flex-1 flex flex-col gap-3 min-w-0'>
                        {mode === 'edit' && (
                            <div className='flex justify-end'>
                                <button onClick={openAddRoot} className='flex items-center gap-2 px-3 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg text-sm font-bold'>
                                    <BadgePlus size={16} /> Grade au sommet
                                </button>
                            </div>
                        )}

                        <div className='flex-1 relative min-h-0'>
                            {/* controles de zoom, flottants en haut a droite. Places dans ce
                                conteneur EXTERIEUR a la zone scrollable (et non a l'interieur),
                                pour rester fixes a l'ecran meme quand on scrolle dans l'arbre */}
                            {tree.length > 0 && (
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
                                {tree.length === 0 ? (
                                    <div className='h-full flex flex-col items-center justify-center gap-2 text-primary-300'>
                                        <Network size={32} />
                                        <p>{mode === 'edit' ? "Aucun grade encore. Commence par creer le grade le plus eleve (ex: Doyen)." : "Cette organisation n'a encore aucun grade defini."}</p>
                                    </div>
                                ) : (
                                    // <div className='min-w-full min-h-full flex items-start justify-center'>
                                    <div style={{ minWidth: layout.totalWidth * zoom, minHeight: '100%' }} >
                                        <div
                                            className='relative'
                                            style={{
                                                width: layout.totalWidth * zoom,
                                                height: layout.totalHeight * zoom,
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
                                                <svg width={layout.totalWidth} height={layout.totalHeight} style={{ position: 'absolute', top: 0, left: 0 }}>
                                                    {renderEdges()}
                                                    {renderNodes()}
                                                    {renderHoveredAvatarOnTop()}
                                                </svg>
                                                {renderEditOverlayButtons()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* persos sans grade attribue pour ce chapitre = au rang le plus bas, hors arbre
                            formel. Uniquement en mode vue */}
                        {mode === 'view' && lowestOccupants.length > 0 && (
                            <div className='bg-primary-100 rounded-lg px-3 py-2 flex items-center gap-3 flex-shrink-0'>
                                <span className='text-xs font-bold text-primary-600 flex-shrink-0'>Aucun grade attribue :</span>
                                <div className='flex flex-wrap gap-2'>
                                    {lowestOccupants.map(char => (
                                        <div key={char.id} className='flex items-center gap-1.5 bg-primary-50 rounded-full pr-2 py-0.5'>
                                            {char.image_url ? (
                                                <img
                                                    src={char.image_url}
                                                    alt={char.name}
                                                    onClick={() => setPreviewSrc(char.image_url)}
                                                    className='w-6 h-6 rounded-full object-cover cursor-pointer'
                                                />
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

                        {/* formulaire grade (creation / edition), mode edit uniquement */}
                        {mode === 'edit' && gradeForm && (
                            <div className='border-t-2 border-primary-100 pt-4 flex flex-col gap-3 flex-shrink-0'>
                                <p className='text-sm font-bold text-primary-600'>{gradeForm.grade ? 'Modifier le grade' : 'Nouveau grade'}</p>

                                <div>
                                    <label className='block mb-1 text-xs text-primary-500 font-medium'>Titre du grade</label>
                                    <input
                                        autoFocus
                                        type='text'
                                        value={gradeTitle}
                                        onChange={(e) => setGradeTitle(e.target.value)}
                                        placeholder='ex: Instructeur'
                                        className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400'
                                    />
                                </div>

                                <div>
                                    <label className='block mb-1 text-xs text-primary-500 font-medium'>Superieur direct</label>
                                    <select
                                        value={gradeParentId}
                                        onChange={(e) => setGradeParentId(e.target.value)}
                                        className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
                                    >
                                        <option value=''>Aucun (sommet de la hierarchie)</option>
                                        {flatGradeOptions
                                            .filter(opt => !gradeForm.grade || opt.id !== gradeForm.grade.id)
                                            .map(opt => (
                                                <option key={opt.id} value={opt.id}>
                                                    {/* {'-'.repeat(opt.depth)} {opt.title} */}
                                                    {opt.title}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {gradeError && <p className='text-red-500 text-xs'>{gradeError}</p>}

                                <div className='flex gap-2'>
                                    <button onClick={closeGradeForm} className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors text-sm'>
                                        Annuler
                                    </button>
                                    <button onClick={handleSaveGrade} className='flex-1 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold text-sm'>
                                        {gradeForm.grade ? 'Enregistrer' : 'Creer le grade'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}