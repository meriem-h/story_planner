import React, { useState, useEffect } from 'react'
import { Lightbulb, Pin, GitBranch, GitFork, Star } from 'lucide-react'
import FormField from '../FormField'
import { useApi } from '../../context/ApiContext'

const TYPE_LABELS = {
    dialogue: 'Dialogue',
    scene: 'Scène',
    description: 'Description',
    flashback: 'Flashback',
    idee: 'Idée',
    citation: 'Citation',
    note_auteur: 'Note auteur',
    transition: 'Transition',
    autre: 'Autre',
}

const TABS = [
    { key: 'infos', label: 'Infos' },
    { key: 'contenu', label: 'Contenu' },
    { key: 'versions', label: 'Versions' },
]

export default function ModalSnippet({ onSuccess, book, tome, selectedSnippet, allSnippets, chapters }) {

    const api = useApi()
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('infos')
    const [showTimeline, setShowTimeline] = useState(false)
    const [timelineChapterId, setTimelineChapterId] = useState(null)
    const [newVersionLabel, setNewVersionLabel] = useState('')
    const [snippet, setSnippet] = useState(
        selectedSnippet || {
            book_id: book.id,
            tome_id: tome?.id || null,
            type: 'autre',
            pinned: 0,
            used: 'disponible'
        }
    )

    const [fieldSnippet, setFieldSnippet] = useState([
        {
            label: 'Type',
            name: 'type',
            type: 'select',
            data: Object.entries(TYPE_LABELS).map(([value, text]) => ({
                value,
                text,
                selected: value === 'autre'
            }))
        },
        { label: 'Titre', name: 'title', type: 'text', placeholder: 'Titre optionnel' },
    ])

    const versions = allSnippets.filter(s =>
        s.version_group !== null && s.version_group === snippet.version_group
    )
    const hasVersions = versions.length > 1

    useEffect(() => {
        setFieldSnippet(prev => prev.map(f => ({
            ...f,
            value: selectedSnippet?.[f.name],
            ...(f.type === 'select' && {
                data: f.data.map(d => ({ ...d, selected: d.value === selectedSnippet?.[f.name] }))
            })
        })))

        if (!selectedSnippet?.id) {
            setSnippet({
                book_id: book.id,
                tome_id: tome?.id || null,
                type: 'autre',
                pinned: 0,
                used: 'disponible',
                title: selectedSnippet?.title || ''
            })
            setShowTimeline(false)
            setTimelineChapterId(null)
            setActiveTab('infos')
            return
        }
        setSnippet(selectedSnippet)
        checkTimelineItem(selectedSnippet.id)
    }, [selectedSnippet])

    const checkTimelineItem = async (snippetId) => {
        const result = await api('timeline:findBy', { snippet_id: snippetId })
        if (result.success && result.data.length > 0) {
            setShowTimeline(true)
            setTimelineChapterId(result.data[0].chapter_id)
        }
    }

    const handleChange = (e) => {
        setSnippet(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setFieldSnippet(prev => prev.map(f => {
            if (f.name === e.target.name && f.type === 'select') {
                return { ...f, data: f.data.map(d => ({ ...d, selected: d.value === e.target.value })) }
            }
            return f.name === e.target.name ? { ...f, value: e.target.value } : f
        }))
    }

    const handleVersionSwitch = (selectedId) => {
        const version = allSnippets.find(s => s.id === Number(selectedId))
        if (!version) return
        setSnippet(version)
        setFieldSnippet(prev => prev.map(f => ({
            ...f,
            value: version[f.name],
            ...(f.type === 'select' && {
                data: f.data.map(d => ({ ...d, selected: d.value === version[f.name] }))
            })
        })))
    }

    const handleCreateVersion = async () => {
        const result = await api('snippet:createVersion', { snippetId: selectedSnippet.id, label: newVersionLabel.trim() || null })

        if (!result.success) return
        setNewVersionLabel('')
        onSuccess(result)
    }

    const handleSetDefault = async () => {
        await api('snippet:setDefault', { id: snippet.id, version_group: snippet.version_group })
        onSuccess({})
    }

    const handleClick = async (e) => {
        e.preventDefault()
        setError(null)
        const errorListe = {}

        if (!snippet.content) {
            setActiveTab('contenu')
            errorListe.all = 'Le contenu est obligatoire'
            setError(errorListe)
            return
        }

        const { position, ...snippetData } = snippet

        const result = selectedSnippet?.id
            ? await api('snippet:update', { id: snippet.id, data: snippetData })
            : await api('snippet:create', snippet)

        if (!result.success) {
            errorListe.all = result.message
            setError(errorListe)
            return
        }

        const snippetId = selectedSnippet ? snippet.id : result.id
        const existing = await api('timeline:findBy', { snippet_id: snippetId })
        const hasTimelineItem = existing.success && existing.data.length > 0

        if (showTimeline) {
            if (hasTimelineItem) {
                await api('timeline:update', {
                    id: existing.data[0].id,
                    data: { chapter_id: timelineChapterId ?? null }
                })
            } else {
                await api('timeline:create', {
                    tome_id: tome?.id || null,
                    chapter_id: timelineChapterId ?? null,
                    snippet_id: snippetId,
                    title: snippet.title || snippet.type,
                    status: false,
                })
            }
        } else {
            if (hasTimelineItem) {
                await api('timeline:delete', existing.data[0].id)
            }
        }

        onSuccess(result)
    }

    return (
        <div className='p-4 flex flex-col gap-4 h-full'>

            {/* header */}
            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <Lightbulb className='text-white' size={32} />
                </div>
                <div className='flex items-center gap-2'>
                    <p className='text-primary-800 font-bold text-lg'>
                        {snippet.title || 'Nouveau snippet'}
                    </p>
                    {hasVersions && (
                        <select
                            value={snippet.id}
                            onChange={(e) => handleVersionSwitch(e.target.value)}
                            className='border border-primary-200 rounded-lg px-2 py-0.5 text-xs text-primary-600 outline-none bg-primary-50 cursor-pointer'
                        >
                            {versions.map(v => (
                                <option key={v.id} value={v.id}>
                                    v{v.version_label}{v.is_default ? ' ⭐' : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                {tome && <p className='text-xs text-primary-400'>{tome.title}</p>}
            </div>

            {/* onglets */}
            <div className='flex gap-1 border-b border-primary-100'>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        type='button'
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-2 text-sm font-medium transition-colors rounded-t-lg
                            ${activeTab === tab.key
                                ? 'text-primary-600 border-b-2 border-primary-400 bg-primary-50'
                                : 'text-primary-300 hover:text-primary-500'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* contenu avec scroll */}
            <div className='overflow-y-auto flex-1 max-h-[45vh]'>

                {activeTab === 'infos' && (
                    <div className='flex flex-col gap-4'>
                        <FormField fields={fieldSnippet} onChange={handleChange} errors={error} />

                        {/* pinned */}
                        <button
                            type='button'
                            onClick={() => setSnippet(prev => ({ ...prev, pinned: prev.pinned ? 0 : 1 }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${snippet.pinned ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-200'}`}
                        >
                            <Pin size={14} className={snippet.pinned ? 'fill-orange-400' : ''} />
                            Épingler
                        </button>

                        {/* used */}
                        <div className='flex gap-2'>
                            <button type='button' onClick={() => setSnippet(prev => ({ ...prev, used: 'disponible' }))} className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${snippet.used === 'disponible' ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400'}`}>
                                Disponible
                            </button>
                            <button type='button' onClick={() => setSnippet(prev => ({ ...prev, used: 'utilise' }))} className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${snippet.used === 'utilise' ? 'bg-green-100 border-green-300 text-green-600' : 'border-gray-200 text-gray-400'}`}>
                                ✅ Utilisé
                            </button>
                            <button type='button' onClick={() => setSnippet(prev => ({ ...prev, used: 'abandonne' }))} className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${snippet.used === 'abandonne' ? 'bg-red-100 border-red-300 text-red-600' : 'border-gray-200 text-gray-400'}`}>
                                ❌ Abandonné
                            </button>
                        </div>

                        {/* timeline toggle */}
                        <div className='flex flex-col gap-2'>
                            <button
                                type='button'
                                onClick={() => setShowTimeline(prev => !prev)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${showTimeline ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-200'}`}
                            >
                                <GitBranch size={14} />
                                Afficher dans la timeline
                            </button>
                            {showTimeline && chapters?.length > 0 && (
                                <select
                                    value={timelineChapterId ?? ''}
                                    onChange={(e) => setTimelineChapterId(e.target.value || null)}
                                    className='border border-primary-200 rounded-lg px-3 py-2 text-sm text-primary-600 outline-none'
                                >
                                    <option value=''>— Chapitre (optionnel) —</option>
                                    {chapters.map(ch => (
                                        <option key={ch.id} value={ch.id}>{ch.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'contenu' && (
                    <textarea
                        name='content'
                        placeholder='Contenu du snippet...'
                        value={snippet.content || ''}
                        onChange={handleChange}
                        rows={25}
                        className='w-full h-full px-3 py-2.5 border rounded-lg text-sm text-primary-800 placeholder:text-primary-300 focus:ring-primary-300 focus:border-primary-300 outline-none resize-none'
                    />
                )}

                {activeTab === 'versions' && (
                    <div className='flex flex-col gap-4'>

                        {/* infos version actuelle */}
                        <div className='flex flex-col gap-2'>
                            <label className='text-xs text-primary-400 font-medium'>Label de version</label>
                            <input
                                type='text'
                                name='version_label'
                                value={snippet.version_label || ''}
                                onChange={handleChange}
                                placeholder='ex: 1, 2, Bis, 1.2...'
                                className='border border-primary-200 rounded-lg px-3 py-2 text-sm text-primary-600 outline-none focus:border-primary-300'
                            />
                        </div>

                        {/* bouton défaut */}
                        {snippet.version_group && (
                            <button
                                type='button'
                                onClick={handleSetDefault}
                                disabled={snippet.is_default == 1}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${snippet.is_default == 1
                                    ? 'bg-yellow-50 border-yellow-300 text-yellow-600 cursor-default'
                                    : 'border-gray-200 text-gray-400 hover:border-yellow-300 hover:text-yellow-500'
                                    }`}
                            >
                                <Star size={14} className={snippet.is_default == 1 ? 'fill-yellow-400' : ''} />
                                {snippet.is_default == 1 ? 'Version par défaut' : 'Définir comme version par défaut'}
                            </button>
                        )}

                        {/* créer nouvelle version */}
                        {selectedSnippet?.id && (
                            <div className='flex items-center gap-2 mt-2'>
                                <input
                                    type='text'
                                    placeholder='Label (ex: 2, Bis...)'
                                    value={newVersionLabel}
                                    onChange={(e) => setNewVersionLabel(e.target.value)}
                                    className='flex-1 border border-primary-200 rounded-lg px-3 py-2 text-sm text-primary-600 outline-none focus:border-primary-300'
                                />
                                <button
                                    type='button'
                                    onClick={handleCreateVersion}
                                    className='flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-600 text-sm transition-colors whitespace-nowrap'
                                >
                                    <GitFork size={14} />
                                    Nouvelle version
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* erreur + bouton toujours visibles */}
            <div className='flex flex-col gap-2 mt-auto'>
                {error?.all && (
                    <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error.all}
                    </div>
                )}
                <button
                    onClick={handleClick}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold'
                >
                    {selectedSnippet?.id ? 'Modifier' : 'Créer'}
                </button>
            </div>

        </div>
    )
}