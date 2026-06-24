import React, { useState, useEffect } from 'react'
import { Copy } from 'lucide-react'
import { useApi } from '../../context/ApiContext'

// Modal de gestion des duplications d'une activité vers d'autres persos/jours.
// Toutes les activités issues d'une même duplication partagent un numéro de `groupe`.
// Cocher une case = créer une copie sur cette destination (si elle n'existe pas déjà).
// Décocher une case = supprimer la copie existante sur cette destination (y compris l'originale).
export default function ModalScheduleDuplicate({ schedule, characters, week, onClose, onCopied }) {
    const api = useApi()

    const [loading, setLoading] = useState(true)
    const [groupSchedules, setGroupSchedules] = useState([]) // toutes les lignes du groupe (existantes en BDD)
    const [selectedCharacterIds, setSelectedCharacterIds] = useState([])
    const [selectedWeekIds, setSelectedWeekIds] = useState([])
    const [saving, setSaving] = useState(false)
    const [summary, setSummary] = useState(null)

    // au montage : si l'activité a déjà un groupe, on récupère tout le groupe et on pré-coche
    useEffect(() => {
        const init = async () => {
            if (schedule.groupe) {
                const result = await api('schedule:findByGroupe', schedule.groupe)
                if (result.success) {
                    setGroupSchedules(result.data)
                    setSelectedCharacterIds([...new Set(result.data.map(s => s.character_id))])
                    setSelectedWeekIds([...new Set(result.data.map(s => s.week_id))])
                }
            } else {
                // pas encore de groupe : seule l'activité source existe, elle est pré-cochée
                setGroupSchedules([schedule])
                setSelectedCharacterIds([schedule.character_id])
                setSelectedWeekIds([schedule.week_id])
            }
            setLoading(false)
        }
        init()
    }, [])

    const toggleCharacter = (id) => {
        setSelectedCharacterIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
    }

    const toggleWeek = (id) => {
        setSelectedWeekIds(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id])
    }

    const pillClass = (active) =>
        `px-3 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-primary-400 text-white' : 'bg-primary-100 text-primary-400 hover:bg-primary-200'}`

    // trouve, parmi les lignes existantes du groupe, celle qui correspond à un perso+jour donné (ou undefined)
    const findExisting = (characterId, weekId) =>
        groupSchedules.find(s => s.character_id === characterId && s.week_id === weekId)

    const handleSave = async () => {
        setSaving(true)
        setSummary(null)

        // s'assure que l'activité a bien un groupe (le génère si c'est la 1ère duplication)
        const groupeResult = await api('schedule:ensureGroupe', schedule.id)
        const groupe = groupeResult.success ? groupeResult.data : schedule.groupe

        // toutes les combinaisons perso x jour possibles, pour savoir lesquelles cocher/décocher
        const allCombinations = []
        for (const charId of characters.map(c => c.id)) {
            for (const weekId of week.map(w => w.id)) {
                allCombinations.push({ charId, weekId })
            }
        }

        let created = 0
        let deleted = 0
        let skipped = 0

        for (const combo of allCombinations) {
            const isChecked = selectedCharacterIds.includes(combo.charId) && selectedWeekIds.includes(combo.weekId)
            const existing = findExisting(combo.charId, combo.weekId)

            if (isChecked && !existing) {
                // case cochée, pas encore de ligne -> créer
                // (plus de vérif anti-chevauchement : le chevauchement horaire est désormais
                // toujours autorisé, résolu uniquement à l'affichage via la priorité de plage chapitre)
                const createResult = await api('schedule:create', {
                    character_id: combo.charId,
                    week_id: combo.weekId,
                    heure_debut: schedule.heure_debut,
                    heure_fin: schedule.heure_fin,
                    activite: schedule.activite,
                    couleur: schedule.couleur,
                    chapter_id_debut: schedule.chapter_id_debut,
                    chapter_id_fin: schedule.chapter_id_fin,
                    groupe,
                })

                if (createResult.success) created++
                else skipped++

            } else if (!isChecked && existing) {
                // case décochée, une ligne existe -> supprimer (même si c'est l'originale)
                const deleteResult = await api('schedule:delete', existing.id)
                if (deleteResult.success) deleted++
                else skipped++
            }
            // sinon : coché+existant ou décoché+inexistant -> rien à faire
        }

        setSaving(false)
        setSummary({ created, deleted, skipped })
        onCopied?.()
    }

    return (
        <div className="p-6 flex flex-col gap-4">

            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center">
                    <Copy className="text-white" size={28} />
                </div>
                <p className="text-primary-800 font-bold text-lg">Gérer les duplications</p>
                <p className="text-sm text-primary-400">{schedule.activite} ({schedule.heure_debut?.slice(0, 5)}–{schedule.heure_fin?.slice(0, 5)})</p>
            </div>

            {loading ? (
                <p className="text-sm text-primary-300 text-center py-4">Chargement...</p>
            ) : (
                <>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-primary-600 font-medium">Personnages concernés</span>
                        <div className="flex gap-2 flex-wrap">
                            {characters.map(char => (
                                <button key={char.id} onClick={() => toggleCharacter(char.id)} className={pillClass(selectedCharacterIds.includes(char.id))}>
                                    {char.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-primary-600 font-medium">Jours concernés</span>
                        <div className="flex gap-2 flex-wrap">
                            {week.map(day => (
                                <button key={day.id} onClick={() => toggleWeek(day.id)} className={pillClass(selectedWeekIds.includes(day.id))}>
                                    {day.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-primary-300 text-center">
                        Décocher un personnage ou un jour supprime l'activité correspondante.
                    </p>
                </>
            )}

            {summary && (
                <div className={`px-4 py-3 rounded-lg text-sm text-center ${summary.skipped > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {summary.created > 0 && `${summary.created} créée${summary.created !== 1 ? 's' : ''}`}
                    {summary.created > 0 && summary.deleted > 0 && ', '}
                    {summary.deleted > 0 && `${summary.deleted} supprimée${summary.deleted !== 1 ? 's' : ''}`}
                    {summary.skipped > 0 && ` (${summary.skipped} échouée${summary.skipped !== 1 ? 's' : ''})`}
                    {summary.created === 0 && summary.deleted === 0 && summary.skipped === 0 && 'Aucun changement.'}
                </div>
            )}

            <div className="flex gap-2 mt-2">
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-500 text-sm font-medium transition-colors"
                >
                    {summary ? 'Fermer' : 'Annuler'}
                </button>
                {!summary && (
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary-400 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                    >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                )}
            </div>

        </div>
    )
}