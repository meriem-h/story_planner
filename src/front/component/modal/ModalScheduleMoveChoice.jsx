import React, { useState } from 'react'
import { Layers, CalendarClock } from 'lucide-react'
import { useApi } from '../../context/ApiContext'

// Modal de choix affichée quand l'utilisateur termine un drag sur une activité qui appartient
// à un groupe (déjà dupliquée). Elle propose 2 options :
// - "Partout" : applique le nouveau créneau à TOUTES les copies du groupe (l'activité ne sort pas du groupe)
// - "Juste ici" : crée une nouvelle exception indépendante (plage = chapitre actuel), l'originale ne change pas
// L'annulation (fermeture sans choix) ne sauvegarde rien : le rectangle doit revenir à sa position d'origine
// côté composant appelant.
export default function ModalScheduleMoveChoice({ schedule, newHeureDebut, newHeureFin, selectedChapter, onClose, onApplied }) {
    const api = useApi()
    const [saving, setSaving] = useState(false)

    const handleApplyToAll = async () => {
        setSaving(true)
        await api('schedule:moveAllInGroupe', {
            groupe: schedule.groupe,
            heureDebut: newHeureDebut,
            heureFin: newHeureFin,
        })
        setSaving(false)
        onApplied()
    }

    const handleApplyHereOnly = async () => {
        setSaving(true)
        await api('schedule:create', {
            character_id: schedule.character_id,
            week_id: schedule.week_id,
            heure_debut: newHeureDebut,
            heure_fin: newHeureFin,
            activite: schedule.activite,
            couleur: schedule.couleur,
            chapter_id_debut: selectedChapter || null,
            chapter_id_fin: selectedChapter || null,
            groupe: null, // nouvelle exception indépendante, pas liée au groupe
        })
        setSaving(false)
        onApplied()
    }

    return (
        <div className="p-6 flex flex-col gap-4">
            <p className="text-primary-800 font-bold text-lg text-center">Déplacer l'activité</p>
            <p className="text-sm text-primary-400 text-center">
                "{schedule.activite}" fait partie d'un groupe de copies. Comment veux-tu appliquer ce déplacement ?
            </p>

            <button
                onClick={handleApplyToAll}
                disabled={saving}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors text-left"
            >
                <Layers className="text-primary-400" size={20} />
                <div>
                    <p className="text-sm font-medium text-primary-700">Pour toutes les copies</p>
                    <p className="text-xs text-primary-400">Change l'horaire partout où cette activité existe</p>
                </div>
            </button>

            <button
                onClick={handleApplyHereOnly}
                disabled={saving || !selectedChapter}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors text-left disabled:opacity-50"
            >
                <CalendarClock className="text-primary-400" size={20} />
                <div>
                    <p className="text-sm font-medium text-primary-700">Juste pour ce chapitre</p>
                    <p className="text-xs text-primary-400">
                        {selectedChapter ? 'Crée une exception, le reste du groupe ne change pas' : 'Sélectionne un chapitre pour activer cette option'}
                    </p>
                </div>
            </button>

            <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-500 text-sm font-medium transition-colors"
            >
                Annuler
            </button>
        </div>
    )
}