import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { ReactSortable } from 'react-sortablejs'
import Modal from './Modal'
import ModalImage from './ModalImage'
import ModalScheduleForm from './ModalScheduleForm'
import ModalScheduleDuplicate from './ModalScheduleDuplicate'
import { BadgePlus, ChevronDown, ChevronUp, Lock, Unlock, Copy, Layers, CalendarClock } from 'lucide-react'

// définition des 3 segments de la journée et leurs bornes horaires (8h chacun)
const SEGMENTS = {
    matin: { label: 'Matin', start: 6, end: 14 },
    apresmidi: { label: 'Après-midi', start: 14, end: 22 },
    nuit: { label: 'Nuit', start: 22, end: 6 }, // traverse minuit
}

export default function ModalSchedule(props) {
    const api = useApi()
    const [week, setWeek] = useState([])
    const [character, setCharacter] = useState([])
    const [schedules, setSchedules] = useState([]) // toutes les activités des persos sélectionnés
    const [previewSrc, setPreviewSrc] = useState(null) // image avatar en cours de prévisualisation (grand format)
    // tous les chapitres de TOUS les tomes du livre (pas seulement le tome actuellement affiché
    // ailleurs dans l'app) : nécessaire pour proposer un chapitre de n'importe quel tome dans l'onglet Chapitres
    const [chapters, setChapters] = useState([])

    // cadenas global : bloque toute création/modification tant qu'il est actif (pour TOUS les persos/jours)
    const [isLocked, setIsLocked] = useState(() => {
        const saved = localStorage.getItem(`schedule-locked-${props.book?.id}`)
        return saved !== null ? JSON.parse(saved) : false
    })

    // formulaire de création/édition d'une activité : null = fermé, sinon contient le contexte
    // { schedule: null, characterId, weekId, heureDebutDefault } pour une création
    // { schedule: {...} } pour une édition
    const [formContext, setFormContext] = useState(null)

    // modal de copie d'une activité vers d'autres persos/jours : null = fermée, sinon = l'activité source
    const [copyContext, setCopyContext] = useState(null)

    // onglet actif : 'chapter' | 'day' | 'character'
    const [activeTab, setActiveTab] = useState('chapter')

    // chapitre sélectionné (un seul à la fois, pas multiple comme jours/persos)
    const [selectedChapter, setSelectedChapter] = useState(() => {
        const saved = localStorage.getItem(`schedule-chapter-${props.book?.id}`)
        return saved ? JSON.parse(saved) : null
    })

    // tome choisi dans le select de l'onglet Chapitres (filtre quels chapitres sont proposés en pills)
    const [selectedTomeForChapter, setSelectedTomeForChapter] = useState(() => {
        const saved = localStorage.getItem(`schedule-tomeForChapter-${props.book?.id}`)
        return saved ? JSON.parse(saved) : null
    })

    // jour sélectionné (un seul à la fois, comme le chapitre)
    const [selectedDay, setSelectedDay] = useState(() => {
        const saved = localStorage.getItem(`schedule-day-${props.book?.id}`)
        return saved ? JSON.parse(saved) : null
    })

    // persos sélectionnés (pills)
    const [selectedCharacters, setSelectedCharacters] = useState(() => {
        const saved = localStorage.getItem(`schedule-characters-${props.book?.id}`)
        return saved ? JSON.parse(saved) : []
    })

    // état de pliage : { [weekId]: { matin: bool, apresmidi: bool, nuit: bool } }
    // true = ouvert (détaillé), false = plié (compact). Partagé par TOUS les persos pour ce jour.
    const [openSegments, setOpenSegments] = useState(() => {
        const saved = localStorage.getItem(`schedule-segments-${props.book?.id}`)
        return saved ? JSON.parse(saved) : {}
    })

    useEffect(() => {
        fetchWeek()
        fetchCharacter()
        fetchAllChapters()
    }, [])

    // une fois les jours chargés : si aucune sélection sauvegardée, on prend Lundi (order=1) par défaut
    useEffect(() => {
        const saved = localStorage.getItem(`schedule-day-${props.book?.id}`)
        if (!saved && week.length > 0) {
            const monday = week.find(w => w.order === 1) || week.sort((a, b) => a.order - b.order)[0]
            setSelectedDay(monday.id)
        }
    }, [week])

    // une fois les chapitres chargés : si rien n'est sauvegardé, on sélectionne automatiquement
    // le premier tome puis le premier chapitre de ce tome
    useEffect(() => {
        if (chapters.length === 0) return

        const savedTome = localStorage.getItem(`schedule-tomeForChapter-${props.book?.id}`)
        const savedChapter = localStorage.getItem(`schedule-chapter-${props.book?.id}`)

        if (!savedTome) {
            const firstTomeNumber = chapters[0].tome_number
            setSelectedTomeForChapter(firstTomeNumber)

            if (!savedChapter) {
                const firstChapterOfTome = chapters.find(ch => ch.tome_number === firstTomeNumber)
                if (firstChapterOfTome) setSelectedChapter(firstChapterOfTome.id)
            }
        }
    }, [chapters])

    // pareil pour les persos
    useEffect(() => {
        const saved = localStorage.getItem(`schedule-characters-${props.book?.id}`)
        if (!saved && character.length > 0) setSelectedCharacters(character.map(c => c.id))
    }, [character])

    // persistance à chaque changement de sélection
    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`schedule-chapter-${props.book.id}`, JSON.stringify(selectedChapter))
    }, [selectedChapter])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`schedule-tomeForChapter-${props.book.id}`, JSON.stringify(selectedTomeForChapter))
    }, [selectedTomeForChapter])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`schedule-day-${props.book.id}`, JSON.stringify(selectedDay))
    }, [selectedDay])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`schedule-characters-${props.book.id}`, JSON.stringify(selectedCharacters))
    }, [selectedCharacters])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`schedule-segments-${props.book.id}`, JSON.stringify(openSegments))
    }, [openSegments])

    useEffect(() => {
        if (props.book?.id) localStorage.setItem(`schedule-locked-${props.book.id}`, JSON.stringify(isLocked))
    }, [isLocked])

    // dès qu'on a des persos sélectionnés (et un jour), on récupère leurs activités,
    // filtrées par chapitre si un chapitre est sélectionné
    useEffect(() => {
        if (selectedCharacters.length > 0 && selectedDay) fetchSchedules()
        else setSchedules([])
    }, [selectedCharacters, selectedDay, selectedChapter])

    const fetchSchedules = async () => {
        if (selectedChapter) {
            // un chapitre est sélectionné : on ne récupère QUE les activités dont la plage le couvre
            const result = await api('schedule:findByCharactersAndWeekForChapter', {
                characterIds: selectedCharacters,
                weekId: selectedDay,
                chapterId: selectedChapter,
            })
            setSchedules(result.success ? result.data : [])
        } else {
            // pas de chapitre sélectionné : on affiche tout, sans filtre (comportement précédent)
            const results = await Promise.all(
                selectedCharacters.map(charId => api('schedule:findByCharacterAndWeek', { characterId: charId, weekId: selectedDay }))
            )
            const merged = results.filter(r => r.success).flatMap(r => r.data)
            setSchedules(merged)
        }
    }

    const fetchWeek = async () => {
        const result = await api('weekBook:findDaysForBook', props.book.id)
        if (result.success) setWeek(result.data)
    }

    const fetchCharacter = async () => {
        const result = await api('characters:findBy', { book_id: props.book.id })
        if (result.success) setCharacter(result.data)
    }

    // récupère tous les tomes du livre, puis tous les chapitres de chaque tome,
    // pour avoir la liste complète (pas juste celle du tome affiché ailleurs dans l'app)
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

    const selectChapter = (id) => {
        setSelectedChapter(prev => prev === id ? null : id)
    }

    const selectDay = (id) => {
        setSelectedDay(id)
    }

    const toggleCharacter = (id) => {
        setSelectedCharacters(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    // ouvre le formulaire en mode création : clic sur une case vide
    const openCreateForm = (characterId, weekId, heureDebutDefault) => {
        if (isLocked) return
        setFormContext({ schedule: null, characterId, weekId, heureDebutDefault })
    }

    // ouvre le formulaire en mode édition : clic sur un rectangle existant
    const openEditForm = (schedule) => {
        if (isLocked) return
        setFormContext({ schedule, characterId: schedule.character_id, weekId: schedule.week_id })
    }

    const closeForm = () => setFormContext(null)

    const handleFormSaved = () => {
        setFormContext(null)
        fetchSchedules()
    }

    const handleFormDeleted = () => {
        setFormContext(null)
        fetchSchedules()
    }

    // ouvre la modal de copie : depuis le bouton dans le formulaire d'édition, ou l'icône sur le rectangle
    const openCopyModal = (schedule) => {
        if (isLocked) return
        setCopyContext(schedule)
    }

    const closeCopyModal = () => setCopyContext(null)

    const handleCopied = () => {
        fetchSchedules() // rafraîchit la grille pour montrer les nouvelles copies (la modal reste ouverte pour le résumé)
    }

    // appelé depuis DayBlock après un drag. 'direct' = pas de groupe, applique le resize tout de suite.
    // Les choix 'all'/'here' sont eux-mêmes appliqués par le popover dans DayBlock (qui a déjà tout
    // ce qu'il faut : schedule, nouvelles heures, chapitre sélectionné) ; ici on ne fait que rafraîchir.
    const handleDragMove = async (schedule, newHeureDebut, newHeureFin, choice) => {
        if (isLocked) return

        if (choice === 'direct') {
            await api('schedule:resize', { id: schedule.id, heureDebut: newHeureDebut, heureFin: newHeureFin })
        }
        fetchSchedules()
    }

    // bascule l'état ouvert/fermé d'un segment pour un jour donné (partagé entre tous les persos)
    const toggleSegment = (weekId, segmentKey) => {
        setOpenSegments(prev => {
            const dayState = prev[weekId] || { matin: true, apresmidi: true, nuit: false }
            return {
                ...prev,
                [weekId]: { ...dayState, [segmentKey]: !dayState[segmentKey] }
            }
        })
    }

    // état d'un segment pour un jour donné, avec valeurs par défaut si jamais touché
    // (matin/après-midi ouverts par défaut, nuit fermée par défaut)
    const isSegmentOpen = (weekId, segmentKey) => {
        const dayState = openSegments[weekId]
        if (!dayState || dayState[segmentKey] === undefined) {
            return segmentKey !== 'nuit' // true pour matin/apresmidi, false pour nuit
        }
        return dayState[segmentKey]
    }

    const pillClass = (active) =>
        `px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-400 hover:bg-primary-200'}`

    const tabClass = (tab) =>
        `px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500' : 'text-primary-400 hover:text-primary-600'}`

    const selectedDayObj = week.find(day => day.id === selectedDay) || null

    const visibleCharacters = selectedCharacters
        .map(id => character.find(c => c.id === id))
        .filter(Boolean)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

    return (
        <div className="flex flex-col gap-4 p-4" style={{ height: '70vh' }}>

            <ModalImage
                src={previewSrc}
                isOpen={!!previewSrc}
                onClose={() => setPreviewSrc(null)}
            />

            <Modal isOpen={!!formContext} onClose={closeForm} size={40}>
                {formContext && (
                    <ModalScheduleForm
                        schedule={formContext.schedule}
                        characterId={formContext.characterId}
                        weekId={formContext.weekId}
                        heureDebutDefault={formContext.heureDebutDefault}
                        book={props.book}
                        onClose={closeForm}
                        onSaved={handleFormSaved}
                        onDeleted={handleFormDeleted}
                        onCopy={formContext.schedule ? () => openCopyModal(formContext.schedule) : null}
                    />
                )}
            </Modal>

            <Modal isOpen={!!copyContext} onClose={closeCopyModal} size={40}>
                {copyContext && (
                    <ModalScheduleDuplicate
                        schedule={copyContext}
                        characters={character}
                        week={week}
                        onClose={closeCopyModal}
                        onCopied={handleCopied}
                    />
                )}
            </Modal>

            {/* Onglets + cadenas */}
            <div className="flex items-center justify-between border-b border-primary-100">
                <div className="flex gap-1">
                    <button onClick={() => setActiveTab('chapter')} className={tabClass('chapter')}>
                        Chapitres
                    </button>
                    <button onClick={() => setActiveTab('day')} className={tabClass('day')}>
                        Jours
                    </button>
                    <button onClick={() => setActiveTab('character')} className={tabClass('character')}>
                        Personnages
                    </button>
                </div>
                <button
                    onClick={() => setIsLocked(prev => !prev)}
                    title={isLocked ? 'Déverrouiller le planning' : 'Verrouiller le planning'}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-1 ${
                        isLocked ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-primary-100 text-primary-400 hover:bg-primary-200'
                    }`}
                >
                    {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    {isLocked ? 'Verrouillé' : 'Déverrouillé'}
                </button>
            </div>

            {/* Contenu de l'onglet actif : une seule liste visible à la fois,
                mais les 3 sélections (chapitre/jours/persos) restent actives en filtre */}
            <div className="flex gap-2 flex-wrap min-h-[40px]">
                {activeTab === 'chapter' && (() => {
                    // liste unique des tomes présents dans `chapters` (dédupliqués), triés par numéro
                    const tomesInChapters = []
                    chapters.forEach(ch => {
                        if (!tomesInChapters.some(t => t.tome_number === ch.tome_number)) {
                            tomesInChapters.push({ tome_number: ch.tome_number, tome_title: ch.tome_title })
                        }
                    })

                    const filteredChapters = chapters.filter(ch => ch.tome_number === selectedTomeForChapter)

                    return (
                        <div className="flex flex-col gap-2 w-full">
                            <select
                                value={selectedTomeForChapter ?? ''}
                                onChange={(e) => setSelectedTomeForChapter(e.target.value ? Number(e.target.value) : null)}
                                className="px-3 py-1.5 rounded-lg border border-primary-200 text-sm text-primary-600 bg-primary-50 w-fit"
                            >
                                <option value="">— Choisir un tome —</option>
                                {tomesInChapters.map(t => (
                                    <option key={t.tome_number} value={t.tome_number}>
                                        {t.tome_title || `Tome ${t.tome_number}`}
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-2 flex-wrap">
                                {filteredChapters.map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => selectChapter(ch.id)}
                                        className={pillClass(selectedChapter === ch.id)}
                                    >
                                        {ch.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                })()}

                {activeTab === 'day' && week
                    .sort((a, b) => a.order - b.order)
                    .map(day => (
                        <button
                            key={day.id}
                            onClick={() => selectDay(day.id)}
                            className={pillClass(selectedDay === day.id)}
                        >
                            {day.name}
                        </button>
                    ))}

                {activeTab === 'character' && character.map(char => (
                    <button
                        key={char.id}
                        onClick={() => toggleCharacter(char.id)}
                        className={pillClass(selectedCharacters.includes(char.id))}
                    >
                        {char.name}
                    </button>
                ))}
            </div>

            {/* Grille planning : UN SEUL jour à la fois (le jour sélectionné), en pleine largeur,
                avec ses 3 boutons de pliage (partagés pour tous les persos), puis 1 ligne par perso */}
            <div className="flex-1 overflow-auto hide-scrollbar border-t border-primary-100 pt-4">
                {visibleCharacters.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                        Sélectionne au moins un personnage (onglet Personnages) pour afficher le planning.
                    </p>
                ) : !selectedDayObj ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                        Sélectionne un jour (onglet Jours) pour afficher le planning.
                    </p>
                ) : (
                    <DayBlock
                        day={selectedDayObj}
                        characters={visibleCharacters}
                        schedules={schedules.filter(s => s.week_id === selectedDayObj.id)}
                        openMatin={isSegmentOpen(selectedDayObj.id, 'matin')}
                        openApresmidi={isSegmentOpen(selectedDayObj.id, 'apresmidi')}
                        openNuit={isSegmentOpen(selectedDayObj.id, 'nuit')}
                        onToggleSegment={(seg) => toggleSegment(selectedDayObj.id, seg)}
                        onPreviewImage={setPreviewSrc}
                        onCreateActivity={openCreateForm}
                        onEditActivity={openEditForm}
                        onCopyActivity={openCopyModal}
                        onDragMove={handleDragMove}
                        selectedChapter={selectedChapter}
                        isLocked={isLocked}
                    />
                )}
            </div>

        </div>
    )
}

// Un bloc = un jour entier, avec ses 3 boutons de pliage (Matin/Après-midi/Nuit)
// et une ligne par personnage, toutes alignées sur la même grille horaire.
function DayBlock({ day, characters, schedules, openMatin, openApresmidi, openNuit, onToggleSegment, onPreviewImage, onCreateActivity, onEditActivity, onCopyActivity, onDragMove, selectedChapter, isLocked }) {
    const api = useApi()
    const HOUR_WIDTH = 64 // px, largeur d'une case heure détaillée

    // état du drag en cours : { scheduleId, startX, originalLeftCol, deltaCol, durationCols }
    // deltaCol = décalage en nombre de colonnes (toujours un entier, snap sur l'heure pleine)
    const [dragState, setDragState] = useState(null)

    // ref (pas de state) : mémorise qu'un vrai drag vient de se produire, pour ignorer le clic
    // qui suit immédiatement le mouseup (le clic se déclenche après que dragState soit remis à null,
    // un state ne survivrait pas assez longtemps pour être lu au bon moment dans onClick)
    const justDraggedRef = React.useRef(false)

    // popover de choix (partout / juste ce chapitre), affiché après un drag sur une activité groupée
    // { schedule, newHeureDebut, newHeureFin } ou null si fermé
    const [moveChoicePopover, setMoveChoicePopover] = useState(null)

    const closeMoveChoicePopover = () => setMoveChoicePopover(null)

    const handleApplyToAll = async () => {
        const { schedule, newHeureDebut, newHeureFin } = moveChoicePopover
        await api('schedule:moveAllInGroupe', { groupe: schedule.groupe, heureDebut: newHeureDebut, heureFin: newHeureFin })
        setMoveChoicePopover(null)
        onDragMove(schedule, newHeureDebut, newHeureFin, 'all')
    }

    const handleApplyHereOnly = async () => {
        const { schedule, newHeureDebut, newHeureFin } = moveChoicePopover
        await api('schedule:create', {
            character_id: schedule.character_id,
            week_id: schedule.week_id,
            heure_debut: newHeureDebut,
            heure_fin: newHeureFin,
            activite: schedule.activite,
            couleur: schedule.couleur,
            chapter_id_debut: selectedChapter || null,
            chapter_id_fin: selectedChapter || null,
            groupe: null,
        })
        setMoveChoicePopover(null)
        onDragMove(schedule, newHeureDebut, newHeureFin, 'here')
    }

    // construit la liste des "colonnes" affichées sur l'axe, dans l'ordre matin -> après-midi -> nuit
    // chaque colonne est soit une heure précise (détail), soit un segment entier compacté (plié)
    const buildColumns = () => {
        const cols = []

        // Matin (6h-14h)
        if (openMatin) {
            for (let h = SEGMENTS.matin.start; h < SEGMENTS.matin.end; h++) cols.push({ type: 'hour', hour: h })
        } else {
            cols.push({ type: 'segment', key: 'matin', label: 'Matin' })
        }

        // Après-midi (14h-22h)
        if (openApresmidi) {
            for (let h = SEGMENTS.apresmidi.start; h < SEGMENTS.apresmidi.end; h++) cols.push({ type: 'hour', hour: h })
        } else {
            cols.push({ type: 'segment', key: 'apresmidi', label: 'Après-midi' })
        }

        // Nuit (22h-6h, traverse minuit)
        if (openNuit) {
            for (let h = 22; h < 24; h++) cols.push({ type: 'hour', hour: h, night: true })
            for (let h = 0; h < 6; h++) cols.push({ type: 'hour', hour: h, night: true })
        } else {
            cols.push({ type: 'segment', key: 'nuit', label: 'Nuit', night: true })
        }

        return cols
    }

    const columns = buildColumns()

    // position (index de colonne, en heures décimales équivalentes) d'une heure donnée sur l'axe construit
    // retourne l'offset en "unités de colonne" (peut être fractionnaire si on tombe au milieu d'une heure)
    const hourToColOffset = (decimalHour) => {
        let offset = 0
        for (const col of columns) {
            if (col.type === 'hour') {
                if (decimalHour >= col.hour && decimalHour < col.hour + 1) {
                    return offset + (decimalHour - col.hour)
                }
                offset += 1
            } else {
                // colonne segment compactée : on doit savoir si decimalHour tombe dans ce segment
                const seg = SEGMENTS[col.key]
                const inSegment = seg.key === 'nuit'
                    ? (decimalHour >= 22 || decimalHour < 6)
                    : (decimalHour >= seg.start && decimalHour < seg.end)
                if (inSegment) {
                    return offset // on place au début du bloc compacté, peu importe l'heure exacte dedans
                }
                offset += 1
            }
        }
        return offset
    }

    const getRectStyle = (schedule) => {
        const [hStart, mStart] = schedule.heure_debut.split(':').map(Number)
        const [hEnd, mEnd] = schedule.heure_fin.split(':').map(Number)

        const startDecimal = hStart + mStart / 60
        let endDecimal = hEnd + mEnd / 60
        if (endDecimal === 0) endDecimal = 24 // minuit pile = fin de journée

        const left = hourToColOffset(startDecimal) * HOUR_WIDTH

        // si la fin tombe dans la nuit ET que la nuit est repliée, le rectangle doit s'arrêter
        // à la fin de la case Nuit compactée (donc +1 case depuis son offset), pas après la grille
        const endInNight = (endDecimal === 24) || endDecimal >= 22 || endDecimal < 6
        let right
        if (!openNuit && endInNight) {
            right = (hourToColOffset(endDecimal === 24 ? 23.99 : endDecimal) + 1) * HOUR_WIDTH
        } else {
            right = hourToColOffset(endDecimal === 24 ? 23.999 : endDecimal) * HOUR_WIDTH + (endDecimal === 24 ? HOUR_WIDTH : 0)
        }

        // clamp pour ne jamais dépasser la largeur totale de la grille (sécurité supplémentaire)
        const maxRight = columns.length * HOUR_WIDTH
        right = Math.min(right, maxRight)

        const width = Math.max(right - left, 4)

        return { left, width }
    }

    // inverse de hourToColOffset : retrouve l'heure pleine (entier 0-23) correspondant à un index
    // de colonne donné. Ne fonctionne que sur les colonnes de type 'hour' (segments dépliés) :
    // le drag n'est permis que si le segment concerné est ouvert, pour rester précis au pixel.
    const colIndexToHour = (colIndex) => {
        const col = columns[colIndex]
        if (!col || col.type !== 'hour') return null
        return col.hour
    }

    // démarre le drag horizontal d'un rectangle. On ne stocke que l'état local (rien en BDD encore) :
    // le déplacement réel n'est appliqué qu'au relâchement (handleDragEnd).
    const handleDragStart = (e, schedule) => {
        if (isLocked) return
        e.stopPropagation()
        e.preventDefault()

        const { left } = getRectStyle(schedule)
        const startColIndex = Math.round(left / HOUR_WIDTH)

        // le drag n'est permis que si la colonne de départ est une heure détaillée (segment ouvert)
        if (colIndexToHour(startColIndex) === null) return

        const [hStart, mStart] = schedule.heure_debut.split(':').map(Number)
        const [hEnd, mEnd] = schedule.heure_fin.split(':').map(Number)
        const durationHours = (hEnd + mEnd / 60) - (hStart + mStart / 60)

        setDragState({
            schedule,
            startX: e.clientX,
            originalColIndex: startColIndex,
            deltaCol: 0,
            durationHours,
        })
    }

    useEffect(() => {
        if (!dragState) return

        const handleMouseMove = (e) => {
            const pixelDelta = e.clientX - dragState.startX
            const colDelta = Math.round(pixelDelta / HOUR_WIDTH) // snap sur l'heure pleine
            setDragState(prev => prev && { ...prev, deltaCol: colDelta })
        }

        const handleMouseUp = () => {
            const newColIndex = dragState.originalColIndex + dragState.deltaCol
            const newStartHour = colIndexToHour(newColIndex)

            // si on relâche sur une colonne invalide (segment plié, ou hors grille) ou sans déplacement
            // réel, on annule simplement : pas de vrai drag, le clic suivant pourra ouvrir l'édition normalement
            if (newStartHour === null || dragState.deltaCol === 0) {
                setDragState(null)
                return
            }

            // vrai drag : on marque le ref pour que le onClick qui suit immédiatement soit ignoré.
            // Le ref sera remis à false par le onClick lui-même après lecture (pas ici en setTimeout(0),
            // qui s'exécuterait avant que le click n'ait eu lieu puisque mouseup -> click est synchrone).
            justDraggedRef.current = true

            const newHeureDebut = `${String(newStartHour).padStart(2, '0')}:00`
            let endHourDecimal = newStartHour + dragState.durationHours
            let newHeureFin
            if (endHourDecimal >= 24) {
                newHeureFin = '00:00'
            } else {
                const endH = Math.floor(endHourDecimal)
                const endM = Math.round((endHourDecimal - endH) * 60)
                newHeureFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
            }

            if (!dragState.schedule.groupe) {
                // pas de groupe : aucune ambiguïté, on applique direct
                onDragMove(dragState.schedule, newHeureDebut, newHeureFin, 'direct')
            } else {
                // groupe présent : ouvre le popover de choix, positionné sous le rectangle déplacé
                setMoveChoicePopover({ schedule: dragState.schedule, newHeureDebut, newHeureFin })
            }
            setDragState(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragState])

    // débordement : une activité "dépasse" visuellement si son début ou sa fin tombe
    // dans la zone Nuit (22h-6h) ALORS QUE cette zone est actuellement repliée
    const getOverflow = (schedule) => {
        if (openNuit) return { overflowsLeft: false, overflowsRight: false } // nuit dépliée = jamais de débordement

        const [hStart, mStart] = schedule.heure_debut.split(':').map(Number)
        const [hEnd, mEnd] = schedule.heure_fin.split(':').map(Number)

        const startDecimal = hStart + mStart / 60
        let endDecimal = hEnd + mEnd / 60
        if (endDecimal === 0) endDecimal = 24

        const isInNight = (d) => d >= 22 || d < 6

        // déborde à gauche : le début est dans la nuit (donc cette portion est "avalée" par la case Nuit à gauche)
        const overflowsLeft = isInNight(startDecimal) && startDecimal !== 22
        // déborde à droite : la fin est dans la nuit (cette portion est "avalée" par la case Nuit à droite)
        const overflowsRight = isInNight(endDecimal === 24 ? 23.99 : endDecimal) && endDecimal !== 6

        return { overflowsLeft, overflowsRight }
    }

    // heure réelle correspondant à une colonne donnée (inverse de hourToColOffset),
    // utilisée pour savoir quelle heure créer au clic sur une case vide
    const colToHour = (col) => {
        if (col.type === 'hour') {
            return `${String(col.hour).padStart(2, '0')}:00`
        }
        // segment compacté : on prend le début du segment correspondant
        return `${String(SEGMENTS[col.key].start).padStart(2, '0')}:00`
    }

    const segmentBtnClass = (active) =>
        `flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
            active ? 'bg-primary-200 text-primary-700' : 'bg-primary-50 text-primary-400 hover:bg-primary-100'
        }`

    return (
        <div className="flex flex-col gap-2">
            {/* En-tête du jour + boutons de pliage des 3 segments (partagés pour tous les persos ci-dessous) */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary-700 w-20">{day.name}</span>
                <button onClick={() => onToggleSegment('matin')} className={segmentBtnClass(openMatin)}>
                    Matin {openMatin ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                <button onClick={() => onToggleSegment('apresmidi')} className={segmentBtnClass(openApresmidi)}>
                    Après-midi {openApresmidi ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                <button onClick={() => onToggleSegment('nuit')} className={segmentBtnClass(openNuit)}>
                    🌙 Nuit {openNuit ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
            </div>

            {/* Une ligne par personnage, toutes alignées sur la même grille de colonnes, fond alterné (zebra) */}
            <div className="flex flex-col w-fit">
                {characters.map((char, index) => (
                    <div
                        key={char.id}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg w-fit ${index % 2 === 0 ? 'bg-white' : 'bg-primary-50'}`}
                    >
                        <div className="flex items-center gap-2 w-24 shrink-0">
                            <CharacterAvatar character={char} onPreview={onPreviewImage} />
                            <span className="text-sm text-primary-600 font-medium truncate">{char.name}</span>
                        </div>
                        <div
                            className="relative rounded-lg shrink-0"
                            style={{ width: `${columns.length * HOUR_WIDTH}px`, height: '72px', minWidth: `${columns.length * HOUR_WIDTH}px` }}
                        >
                            {/* fond : cases (heure détaillée ou segment compacté). Transparent par défaut
                                pour laisser voir le zebra de la ligne. La nuit garde un fond sombre,
                                mais légèrement teinté différemment selon la parité pour que le zebra reste visible.
                                Clic sur une case vide = créer une activité (sauf si verrouillé). */}
                            <div className="absolute inset-0 flex">
                                {columns.map((col, i) => {
                                    const isNight = col.night
                                    const nightBg = index % 2 === 0 ? 'bg-slate-700' : 'bg-slate-800'
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => !isLocked && onCreateActivity(char.id, day.id, colToHour(col))}
                                            className={`shrink-0 flex flex-col items-center pt-2 rounded-md transition-colors ${
                                                isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                                            } ${
                                                isNight ? `${nightBg} hover:bg-slate-600` : 'hover:bg-primary-100'
                                            }`}
                                            style={{ width: `${HOUR_WIDTH}px` }}
                                        >
                                            <span className={`text-xs ${isNight ? 'text-slate-300' : 'text-primary-400'}`}>
                                                {col.type === 'hour' ? `${col.hour}h` : col.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* rectangles d'activité de ce perso, pour ce jour. Clic = éditer (sauf si verrouillé).
                                Décalés sous le label heure (top-7) pour ne pas le masquer.
                                Petit rond sur le bord si l'activité déborde dans une zone Nuit repliée. */}
                            {schedules
                                .filter(s => s.character_id === char.id)
                                .map(s => {
                                    const { left: baseLeft, width } = getRectStyle(s)
                                    const { overflowsLeft, overflowsRight } = getOverflow(s)

                                    // si ce rectangle précis est en cours de drag, on décale visuellement
                                    // sa position selon deltaCol (aperçu, rien n'est encore sauvegardé)
                                    const isDragging = dragState?.schedule.id === s.id
                                    const left = isDragging ? baseLeft + dragState.deltaCol * HOUR_WIDTH : baseLeft

                                    return (
                                        <div
                                            key={s.id}
                                            id={`schedule-rect-${s.id}`}
                                            title={`${s.activite} (${s.heure_debut}–${s.heure_fin})`}
                                            onMouseDown={(e) => handleDragStart(e, s)}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                // évite d'ouvrir l'édition si on vient de terminer un vrai drag
                                                if (justDraggedRef.current) {
                                                    justDraggedRef.current = false
                                                    return
                                                }
                                                !isLocked && onEditActivity(s)
                                            }}
                                            className={`group absolute top-7 bottom-2 rounded-md flex items-center px-2 overflow-hidden shadow-sm ${
                                                isLocked ? 'cursor-not-allowed' : 'cursor-grab'
                                            } ${isDragging ? 'opacity-70 ring-2 ring-white shadow-lg z-10' : ''}`}
                                            style={{ left: `${left}px`, width: `${width}px`, backgroundColor: s.couleur || '#93c5fd' }}
                                        >
                                            {overflowsLeft && (
                                                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2" style={{ borderColor: s.couleur || '#93c5fd' }} />
                                            )}
                                            <span className="text-xs text-white truncate font-medium">{s.activite}</span>
                                            {overflowsRight && (
                                                <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border-2" style={{ borderColor: s.couleur || '#93c5fd' }} />
                                            )}
                                            {!isLocked && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onCopyActivity(s) }}
                                                    title="Copier cette activité"
                                                    className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/20 hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Copy size={10} className="text-white" />
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Popover de choix après drag d'une activité groupée, même pattern que les popovers Timeline */}
            {moveChoicePopover && (
                <>
                    <div className="fixed inset-0 z-10" onClick={closeMoveChoicePopover} />
                    <div
                        className="fixed z-20 bg-primary-50 border border-primary-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[200px]"
                        style={{
                            top: document.getElementById(`schedule-rect-${moveChoicePopover.schedule.id}`)?.getBoundingClientRect().bottom + 8,
                            left: document.getElementById(`schedule-rect-${moveChoicePopover.schedule.id}`)?.getBoundingClientRect().left,
                        }}
                    >
                        <button
                            onClick={handleApplyToAll}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-100 text-xs text-primary-600 whitespace-nowrap"
                        >
                            <Layers size={14} /> Pour toutes les copies
                        </button>
                        <button
                            onClick={handleApplyHereOnly}
                            disabled={!selectedChapter}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-primary-100 text-xs text-primary-600 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <CalendarClock size={14} /> Juste ce chapitre
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

// Avatar d'un perso : photo si image_url existe (cliquable pour preview en grand), sinon cercle avec l'initiale
function CharacterAvatar({ character, onPreview }) {
    if (character.image_url) {
        return (
            <img
                src={character.image_url}
                alt={character.name}
                onClick={(e) => { e.stopPropagation(); onPreview?.(character.image_url) }}
                className="w-7 h-7 rounded-full object-cover shrink-0 cursor-pointer"
            />
        )
    }

    const initial = character.name?.charAt(0).toUpperCase() || '?'

    return (
        <div className="w-7 h-7 rounded-full bg-primary-300 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {initial}
        </div>
    )
}