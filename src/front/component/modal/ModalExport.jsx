import React, { useState } from 'react'
import { useApi } from '../../context/ApiContext'
import { Download, FileText, File, FolderArchive } from 'lucide-react'

export default function ModalExport({ book, tome, chapters, selectedChapter }) {

    const api = useApi()
    const [mode, setMode] = useState('tome')
    const [format, setFormat] = useState('docx')
    const [chapterId, setChapterId] = useState(selectedChapter?.id || '')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    const handleExport = async () => {
        setLoading(true)
        setMessage(null)

        const result = await api('export:chapters', {
            bookId: book.id,
            tomeId: tome?.id || null,
            chapterIds: mode === 'chapitre' ? [chapterId] : null,
            format,
            mode: mode === 'zip' ? 'zip' : 'single'
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

            {/* mode */}
            <div className='flex flex-col gap-2'>
                <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Que voulez-vous exporter ?</p>
                <div className='flex flex-col gap-2'>

                    {/* tome entier */}
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

                    {/* un chapitre */}
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

                    {/* zip */}
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

            {/* select chapitre si mode chapitre */}
            {mode === 'chapitre' && (
                <div className='flex flex-col gap-2'>
                    <p className='text-xs font-bold text-primary-400 uppercase tracking-wider'>Chapitre</p>
                    <select
                        value={chapterId}
                        onChange={(e) => setChapterId(e.target.value)}
                        className='w-full px-3 py-2 border border-primary-200 rounded-lg text-sm text-primary-600 outline-none bg-primary-50'
                    >
                        {chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.title}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* format */}
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
    )
}