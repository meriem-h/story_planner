import React, { useState, useEffect } from 'react'
import { useApi } from '../../context/ApiContext'
import { X, Trash2, Pen, BadgePlus, Network } from 'lucide-react'

export default function ModalAssignGrade({ character, book, onClose }) {
    const api = useApi()

    const [organizations, setOrganizations] = useState([])
    const [chapters, setChapters] = useState([])
    const [assignments, setAssignments] = useState([]) // attributions existantes de ce perso, toutes orgas confondues

    // formulaire : null = ferme (juste la liste), sinon { assignment: null|existing }
    const [form, setForm] = useState(null)
    const [formOrgId, setFormOrgId] = useState('')
    const [formGradeId, setFormGradeId] = useState('')
    const [formChapterDebut, setFormChapterDebut] = useState('')
    const [formChapterFin, setFormChapterFin] = useState('')
    const [formGrades, setFormGrades] = useState([]) // grades de l'organisation choisie dans le formulaire
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchOrganizations()
        fetchAllChapters()
        fetchAssignments()
    }, [])

    // a chaque changement d'organisation dans le formulaire, on recharge ses grades (liste plate,
    // avec indentation pour montrer la hierarchie dans le select)
    useEffect(() => {
        if (formOrgId) fetchGradesForOrg(formOrgId)
        else setFormGrades([])
    }, [formOrgId])

    const fetchOrganizations = async () => {
        const result = await api('organization:findBy', { book_id: book.id })
        if (result.success) setOrganizations(result.data)
    }

    const fetchAllChapters = async () => {
        const tomesResult = await api('tome:findBy', { book_id: book.id })
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

    const fetchAssignments = async () => {
        const result = await api('characterGrade:findByCharacter', character.id)
        if (result.success) setAssignments(result.data)
    }

    // recupere l'arbre d'une organisation et l'aplatit (meme logique que dans ModalOrganization)
    // pour afficher chaque grade indente selon sa profondeur dans le select
    const fetchGradesForOrg = async (organizationId) => {
        const result = await api('grade:getTree', organizationId)
        if (!result.success) return
        const flat = []
        const collect = (nodes, depth = 0) => {
            nodes.forEach(n => {
                flat.push({ id: n.id, title: n.title, depth })
                collect(n.children, depth + 1)
            })
        }
        collect(result.data)
        setFormGrades(flat)
    }

    const openCreate = () => {
        setForm({ assignment: null })
        setFormOrgId(organizations[0]?.id || '')
        setFormGradeId('')
        setFormChapterDebut('')
        setFormChapterFin('')
        setError(null)
    }

    const openEdit = (assignment) => {
        setForm({ assignment })
        setFormOrgId(assignment.organization_id)
        setFormGradeId(assignment.grade_id)
        setFormChapterDebut(assignment.chapter_id_debut || '')
        setFormChapterFin(assignment.chapter_id_fin || '')
        setError(null)
    }

    const closeForm = () => {
        setForm(null)
        setError(null)
    }

    const handleSave = async () => {
        if (!formOrgId) {
            setError('Choisis une organisation.')
            return
        }
        if (!formGradeId) {
            setError('Choisis un grade.')
            return
        }

        const chapterIdDebut = formChapterDebut || null
        const chapterIdFin = formChapterFin || null

        const result = form.assignment
            ? await api('characterGrade:reassign', {
                id: form.assignment.id,
                gradeId: formGradeId,
                chapterIdDebut,
                chapterIdFin,
            })
            : await api('characterGrade:assign', {
                characterId: character.id,
                gradeId: formGradeId,
                organizationId: formOrgId,
                chapterIdDebut,
                chapterIdFin,
            })

        if (result.success) {
            closeForm()
            await fetchAssignments()
        } else {
            setError(result.message)
        }
    }

    const handleDelete = async (assignment) => {
        await api('characterGrade:delete', assignment.id)
        await fetchAssignments()
    }

    // libelle lisible d'une plage de chapitres pour l'affichage dans la liste
    const rangeLabel = (assignment) => {
        if (!assignment.chapter_id_debut && !assignment.chapter_id_fin) return 'Tout le livre'
        const debut = assignment.chapter_debut_title ? `Depuis "${assignment.chapter_debut_title}"` : 'Depuis le debut'
        const fin = assignment.chapter_fin_title ? `jusqu'a "${assignment.chapter_fin_title}"` : "jusqu'a la fin"
        return `${debut} ${fin}`
    }

    return (
        <div className='flex flex-col gap-4 p-4'>
            <div className='flex items-center justify-between'>
                <p className='text-base font-bold text-primary-700'>Grades de {character.name}</p>
                <button onClick={onClose} className='text-primary-400 hover:text-primary-600'>
                    <X size={18} />
                </button>
            </div>

            {/* liste des attributions existantes */}
            <div className='flex flex-col gap-2'>
                {assignments.length === 0 && (
                    <p className='text-primary-300 text-sm text-center py-4'>Aucun grade attribue pour l'instant.</p>
                )}
                {assignments.map(a => (
                    <div key={a.id} className='flex items-center gap-3 bg-primary-50 rounded-lg px-3 py-2.5'>
                        <Network size={16} className='text-primary-400 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-bold text-primary-700'>{a.grade_title} <span className='font-normal text-primary-400'>— {a.organization_name}</span></p>
                            <p className='text-xs text-primary-400'>{rangeLabel(a)}</p>
                        </div>
                        <button onClick={() => openEdit(a)} title='Modifier' className='p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded flex-shrink-0'>
                            <Pen size={14} />
                        </button>
                        <button onClick={() => handleDelete(a)} title='Supprimer' className='p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded flex-shrink-0'>
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {!form && (
                <button
                    onClick={openCreate}
                    className='flex items-center justify-center gap-2 py-2 border border-dashed border-primary-300 rounded-lg text-primary-400 hover:bg-primary-100 transition-colors text-sm'
                >
                    <BadgePlus size={16} /> Attribuer un grade
                </button>
            )}

            {/* formulaire creation/edition d'une attribution */}
            {form && (
                <div className='border-t-2 border-primary-100 pt-4 flex flex-col gap-3'>
                    <p className='text-sm font-bold text-primary-600'>{form.assignment ? 'Modifier l\'attribution' : 'Nouvelle attribution'}</p>

                    <div>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Organisation</label>
                        <select
                            value={formOrgId}
                            onChange={(e) => { setFormOrgId(e.target.value); setFormGradeId('') }}
                            disabled={!!form.assignment} // on ne change pas l'organisation d'une attribution existante, juste son grade/sa plage
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white disabled:bg-primary-100 disabled:text-primary-400'
                        >
                            <option value=''>— Choisir —</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className='block mb-1 text-xs text-primary-500 font-medium'>Grade</label>
                        <select
                            value={formGradeId}
                            onChange={(e) => setFormGradeId(e.target.value)}
                            disabled={!formOrgId}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white disabled:bg-primary-100'
                        >
                            <option value=''>— Choisir —</option>
                            {formGrades.map(g => (
                                <option key={g.id} value={g.id}>{'—'.repeat(g.depth)} {g.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className='flex gap-3'>
                        <div className='flex-1'>
                            <label className='block mb-1 text-xs text-primary-500 font-medium'>Depuis le chapitre</label>
                            <select
                                value={formChapterDebut}
                                onChange={(e) => setFormChapterDebut(e.target.value)}
                                className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
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
                                value={formChapterFin}
                                onChange={(e) => setFormChapterFin(e.target.value)}
                                className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white'
                            >
                                <option value=''>Jusqu'a la fin</option>
                                {chapters.map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.tome_title} — {ch.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && <p className='text-red-500 text-xs'>{error}</p>}

                    <div className='flex gap-2'>
                        <button onClick={closeForm} className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 bg-primary-100 hover:bg-primary-200 transition-colors text-sm'>
                            Annuler
                        </button>
                        <button onClick={handleSave} className='flex-1 py-2 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold text-sm'>
                            {form.assignment ? 'Enregistrer' : 'Attribuer'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}