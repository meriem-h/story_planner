import React, { useState } from 'react'
import { useApi } from '../../context/ApiContext'
import { Download, FileText, File, FolderArchive } from 'lucide-react'

const PAGE_FORMATS = {
    a4: { label: 'A4', description: 'Manuscrit / brouillon', width: 21, height: 29.7 },
    roman: { label: '14 x 21 cm', description: 'Roman classique français', width: 14, height: 21 },
    poche: { label: '13 x 18 cm', description: 'Format poche', width: 13, height: 18 },
    custom: { label: 'Personnalisé', description: 'Entrer vos propres dimensions', width: null, height: null },
}

export default function ModalExport({ book, tome, chapters, selectedChapter }) {

    const api = useApi()
    const [mode, setMode] = useState('tome')
    const [format, setFormat] = useState('docx')
    const [chapterId, setChapterId] = useState(selectedChapter?.id || '')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [exportAdult, setExportAdult] = useState(false)
    const [pageFormat, setPageFormat] = useState('a4')
    const [customWidth, setCustomWidth] = useState('')
    const [customHeight, setCustomHeight] = useState('')

    const hasVariants = chapters.some(ch => ch.paired_chapter_id)
    const visibleChapters = chapters.filter(ch => !ch.paired_chapter_id || !ch.is_adult)

    const handleExport = async () => {
        setLoading(true)
        setMessage(null)

        const resolvedIds = visibleChapters.map(ch => {
            if (ch.paired_chapter_id && exportAdult) return ch.paired_chapter_id
            return ch.id
        })

        const formatDims = pageFormat === 'custom'
            ? { width: parseFloat(customWidth), height: parseFloat(customHeight) }
            : { width: PAGE_FORMATS[pageFormat].width, height: PAGE_FORMATS[pageFormat].height }

        if (pageFormat === 'custom' && (!formatDims.width || !formatDims.height)) {
            setMessage({ type: 'error', text: 'Veuillez entrer des dimensions valides.' })
            setLoading(false)
            return
        }

        const result = await api('export:chapters', {
            bookId: book.id,
            tomeId: tome?.id || null,
            chapterIds: mode === 'chapitre' ? [Number(chapterId)] : resolvedIds,
            format,
            mode: mode === 'zip' ? 'zip' : 'single',
            pageWidth: formatDims.width,
            pageHeight: formatDims.height,
        })

        setLoading(false)
        if (result.success) {
            setMessage({ type: 'success', text: 'Exporté avec succès !' })
        } else {
            setMessage({ type: 'error', text: result.message })
        }
    }

    return (
        <div className='p-4 flex flex-col gap-6'>

            <div className='flex flex-col items-center gap-2'>
                <div className='w-16 h-16 rounded-2xl bg-primary-300 flex items-center justify-center'>
                    <Download className='text-white' size={32} />
                </div>
                <p className='text-primary-800 font-bold text-lg'>Exporter</p>
            </div>

            <div className='overflow-y-auto hide-scrollbar max-h-[50vh]'>

                {/* mode */}
                <div className='flex flex-col gap-2 '>
                    <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Que voulez-vous exporter ?</p>
                    <div className='flex flex-col gap-2'>
                        <button
                            onClick={() => setMode('tome')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors text-left ${mode === 'tome' ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-200'}`}
                        >
                            <FileText size={16} />
                            <div>
                                <p className='font-medium'>Tout le {tome ? tome.title : 'livre'}</p>
                                <p className='text-xs opacity-70'>Tous les chapitres en un seul fichier</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setMode('chapitre')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors text-left ${mode === 'chapitre' ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-200'}`}
                        >
                            <File size={16} />
                            <div>
                                <p className='font-medium'>Un seul chapitre</p>
                                <p className='text-xs opacity-70'>Choisir le chapitre à exporter</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setMode('zip')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors text-left ${mode === 'zip' ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-200'}`}
                        >
                            <FolderArchive size={16} />
                            <div>
                                <p className='font-medium'>Tous les chapitres séparés (ZIP)</p>
                                <p className='text-xs opacity-70'>Un fichier par chapitre dans une archive</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* select chapitre */}
                {mode === 'chapitre' && (
                    <div className='flex flex-col gap-2'>
                        <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Chapitre</p>
                        <select
                            value={chapterId}
                            onChange={(e) => setChapterId(e.target.value)}
                            className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-600 outline-none bg-primary-50'
                        >
                            {visibleChapters.map(ch => (
                                <option key={ch.id} value={ch.id}>{ch.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* version adulte/familiale */}
                {hasVariants && (
                    <div className='flex flex-col gap-2'>
                        <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Version</p>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setExportAdult(false)}
                                className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${!exportAdult ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400'}`}
                            >
                                👨‍👩‍👧 Familiale
                            </button>
                            <button
                                onClick={() => setExportAdult(true)}
                                className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${exportAdult ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400'}`}
                            >
                                🔞 Adulte
                            </button>
                        </div>
                    </div>
                )}

                {/* format de page */}
                <div className='flex flex-col gap-2'>
                    <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Format de page</p>
                    <div className='flex flex-col gap-2'>
                        {Object.entries(PAGE_FORMATS).map(([key, f]) => (
                            <button
                                key={key}
                                onClick={() => setPageFormat(key)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors text-left ${pageFormat === key ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:border-primary-200'}`}
                            >
                                <div>
                                    <p className='font-medium'>{f.label}</p>
                                    <p className='text-xs opacity-70'>{f.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    {pageFormat === 'custom' && (
                        <div className='flex gap-2 mt-1'>
                            <div className='flex flex-col gap-1 flex-1'>
                                <p className='text-xs text-primary-400'>Largeur (cm)</p>
                                <input
                                    type='number'
                                    value={customWidth}
                                    onChange={(e) => setCustomWidth(e.target.value)}
                                    placeholder='ex: 15'
                                    className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-600 outline-none'
                                />
                            </div>
                            <div className='flex flex-col gap-1 flex-1'>
                                <p className='text-xs text-primary-400'>Hauteur (cm)</p>
                                <input
                                    type='number'
                                    value={customHeight}
                                    onChange={(e) => setCustomHeight(e.target.value)}
                                    placeholder='ex: 21'
                                    className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-600 outline-none'
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* format fichier */}
                <div className='flex flex-col gap-2'>
                    <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Format</p>
                    <div className='flex gap-2'>
                        <button
                            onClick={() => setFormat('docx')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-colors ${format === 'docx' ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400'}`}
                        >
                            <FileText size={14} /> Word (.docx)
                        </button>
                        <button
                            onClick={() => setFormat('pdf')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-colors ${format === 'pdf' ? 'bg-primary-100 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400'}`}
                        >
                            <File size={14} /> PDF
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <button
                    onClick={handleExport}
                    disabled={loading}
                    className='w-full py-3 bg-primary-300 hover:bg-primary-400 transition-colors text-white rounded-lg font-bold mt-2 disabled:opacity-50'
                >
                    {loading ? 'Export en cours...' : `Exporter (${format.toUpperCase()}${mode === 'zip' ? ' + ZIP' : ''})`}
                </button>
            </div>
        </div>
    )
}