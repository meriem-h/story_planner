import React, { useState, useEffect } from 'react'
import { Clock, Trash2, Copy } from 'lucide-react'
import FormField from '../../FormField'
import { useApi } from '../../../context/ApiContext'

const COLOR_OPTIONS = [
    '#93c5fd', '#60a5fa', '#86efac', '#4ade80',
    '#fde68a', '#fbbf24', '#fdba74', '#fb923c',
    '#fca5a5', '#f87171', '#f9a8d4', '#f472b6',
    '#c4b5fd', '#a78bfa', '#67e8f9', '#94a3b8',
]

// Modal de création/édition d'une activité (schedule), suivant le pattern de ModalSnippet.
// Mode création : schedule = null, characterId/weekId/heureDebutDefault fournis en pré-remplissage.
// Mode édition : schedule = l'activité existante.
export default function ModalScheduleForm({ schedule, characterId, weekId, heureDebutDefault, book, onClose, onSaved, onDeleted, onCopy }) {
    const api = useApi()
    const isEdit = !!schedule

    function addOneHour(time) {
        const [h, m] = time.split(':').map(Number)
        const newH = (h + 1) % 24
        return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const [activity, setActivity] = useState(
        schedule || {
            character_id: characterId,
            week_id: weekId,
            heure_debut: heureDebutDefault || '08:00',
            heure_fin: addOneHour(heureDebutDefault || '08:00'),
            activite: '',
            couleur: '#93c5fd',
            chapter_id_debut: null,
            chapter_id_fin: null,
        }
    )

    const [tomes, setTomes] = useState([])
    const [chaptersDebut, setChaptersDebut] = useState([])
    const [chaptersFin, setChaptersFin] = useState([])
    const [tomeDebutId, setTomeDebutId] = useState('')
    const [tomeFinId, setTomeFinId] = useState('')

    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)
    const [loadingInit, setLoadingInit] = useState(isEdit && (schedule.chapter_id_debut || schedule.chapter_id_fin))

    // récupère les tomes du livre au montage
    useEffect(() => {
        fetchTomes()
    }, [])

    // en mode édition, si l'activité a déjà des bornes, on retrouve leur tome
    // pour pré-remplir correctement les selects en cascade
    useEffect(() => {
        const initBorders = async () => {
            if (schedule?.chapter_id_debut) {
                const ch = await api('chapter:findById', schedule.chapter_id_debut)
                if (ch.success && ch.data) setTomeDebutId(String(ch.data.tome_id))
            }
            if (schedule?.chapter_id_fin) {
                const ch = await api('chapter:findById', schedule.chapter_id_fin)
                if (ch.success && ch.data) setTomeFinId(String(ch.data.tome_id))
            }
            setLoadingInit(false)
        }
        if (isEdit) initBorders()
    }, [])

    // dès que le tome début change, on recharge les chapitres correspondants
    useEffect(() => {
        if (tomeDebutId) fetchChapters(tomeDebutId, setChaptersDebut)
        else setChaptersDebut([])
    }, [tomeDebutId])

    useEffect(() => {
        if (tomeFinId) fetchChapters(tomeFinId, setChaptersFin)
        else setChaptersFin([])
    }, [tomeFinId])

    const fetchTomes = async () => {
        const result = await api('tome:findBy', { book_id: book.id })
        if (result.success) setTomes(result.data)
    }

    const fetchChapters = async (tomeId, setter) => {
        const result = await api('chapter:findBy', { tome_id: tomeId })
        if (result.success) setter(result.data)
    }

    const [fields, setFields] = useState([])

    useEffect(() => {
        setFields([
            { label: 'Nom de l\'activité', name: 'activite', type: 'text', placeholder: 'ex: Travaille, Pause, Entraînement...' },
            {
                label: 'Horaires', name: 'horaires', type: 'twin', data: [
                    { label: 'Début', name: 'heure_debut', type: 'time' },
                    { label: 'Fin', name: 'heure_fin', type: 'time' },
                ]
            },
        ])
    }, [])

    const fieldsWithValues = fields.map(f => {
        if (f.type === 'twin') {
            return { ...f, data: f.data.map(sub => ({ ...sub, value: activity[sub.name] })) }
        }
        return { ...f, value: activity[f.name] }
    })

    const handleChange = (e) => {
        setActivity(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    // selects de plage : champs construits à part car ils dépendent d'un state cascade (tome -> chapitre)
    const rangeFields = [
        {
            label: 'À partir de (optionnel)', name: 'tomeDebut', type: 'twin', data: [
                {
                    label: 'Tome', name: 'tome_debut_select', type: 'select',
                    data: [{ value: '', text: '— Depuis le début du livre —' }, ...tomes.map(t => ({ value: String(t.id), text: t.title || `Tome ${t.number}` }))],
                    value: tomeDebutId,
                },
                {
                    label: 'Chapitre', name: 'chapter_id_debut', type: 'select',
                    data: [{ value: '', text: '— Premier chapitre du tome —' }, ...chaptersDebut.map(c => ({ value: String(c.id), text: c.title }))],
                    value: activity.chapter_id_debut ? String(activity.chapter_id_debut) : '',
                },
            ]
        },
        {
            label: 'Jusqu\'à (optionnel)', name: 'tomeFin', type: 'twin', data: [
                {
                    label: 'Tome', name: 'tome_fin_select', type: 'select',
                    data: [{ value: '', text: '— Jusqu\'à la fin du livre —' }, ...tomes.map(t => ({ value: String(t.id), text: t.title || `Tome ${t.number}` }))],
                    value: tomeFinId,
                },
                {
                    label: 'Chapitre', name: 'chapter_id_fin', type: 'select',
                    data: [{ value: '', text: '— Dernier chapitre du tome —' }, ...chaptersFin.map(c => ({ value: String(c.id), text: c.title }))],
                    value: activity.chapter_id_fin ? String(activity.chapter_id_fin) : '',
                },
            ]
        },
    ]

    const handleRangeChange = (e) => {
        const { name, value } = e.target
        if (name === 'tome_debut_select') {
            setTomeDebutId(value)
            setActivity(prev => ({ ...prev, chapter_id_debut: null })) // reset le chapitre si on change de tome
        } else if (name === 'tome_fin_select') {
            setTomeFinId(value)
            setActivity(prev => ({ ...prev, chapter_id_fin: null }))
        } else if (name === 'chapter_id_debut' || name === 'chapter_id_fin') {
            setActivity(prev => ({ ...prev, [name]: value || null }))
        }
    }

    const handleSave = async () => {
        const errorList = {}

        if (!activity.activite?.trim()) {
            errorList.activite = 'Le nom est requis.'
        }

        if (Object.keys(errorList).length > 0) {
            setError(errorList)
            return
        }

        setSaving(true)
        setError(null)

        const payload = {
            character_id: activity.character_id,
            week_id: activity.week_id,
            heure_debut: activity.heure_debut,
            heure_fin: activity.heure_fin,
            activite: activity.activite.trim(),
            couleur: activity.couleur,
            chapter_id_debut: activity.chapter_id_debut || null,
            chapter_id_fin: activity.chapter_id_fin || null,
        }

        const result = isEdit
            ? await api('schedule:update', { id: schedule.id, data: payload })
            : await api('schedule:create', payload)

        setSaving(false)

        if (result.success) {
            onSaved()
        } else {
            setError({ all: result.message || 'Une erreur est survenue.' })
        }
    }

    const handleDelete = async () => {
        setSaving(true)
        const result = await api('schedule:delete', schedule.id)
        setSaving(false)
        if (result.success) {
            onDeleted()
        } else {
            setError({ all: result.message || 'Erreur lors de la suppression.' })
        }
    }

    return (
        <div className='p-4 flex flex-col gap-4 h-full'>

            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <Clock className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>
                    {activity.activite || (isEdit ? 'Modifier l\'activité' : 'Nouvelle activité')}
                </p>
            </div>

            <div className='overflow-y-auto flex-1 flex flex-col gap-4'>
                <FormField fields={fieldsWithValues} onChange={handleChange} errors={error} />

                <hr className='border-primary-100' />
                <p className='text-xs text-primary-400 font-medium uppercase tracking-wider -mb-2'>
                    Période de validité (optionnel)
                </p>

                {loadingInit ? (
                    <p className='text-sm text-primary-300 text-center py-2'>Chargement...</p>
                ) : (
                    <FormField fields={rangeFields} onChange={handleRangeChange} errors={error} />
                )}

                <hr className='border-primary-100' />

                <div className='flex flex-col items-center gap-2'>
                    <label className='text-sm text-primary-600 font-medium'>Couleur</label>
                    <div className='flex gap-2 flex-wrap justify-center max-w-xs'>
                        {COLOR_OPTIONS.map(c => (
                            <button
                                key={c}
                                type='button'
                                onClick={() => setActivity(prev => ({ ...prev, couleur: c }))}
                                className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${activity.couleur === c ? 'ring-2 ring-offset-2 ring-primary-400' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className='flex flex-col gap-2 mt-auto'>
                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}
                <div className='flex gap-2'>
                    {isEdit && (
                        <button
                            onClick={handleDelete}
                            disabled={saving}
                            className='flex items-center gap-1 px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 text-sm font-medium transition-colors'
                        >
                            <Trash2 size={14} /> Supprimer
                        </button>
                    )}
                    {onCopy && (
                        <button
                            onClick={onCopy}
                            disabled={saving}
                            className='flex items-center gap-1 px-4 py-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-500 text-sm font-medium transition-colors'
                        >
                            <Copy size={14} /> Copier vers...
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className='flex-1 py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold'
                    >
                        {saving ? '...' : isEdit ? 'Modifier' : 'Créer'}
                    </button>
                </div>
            </div>

        </div>
    )
}