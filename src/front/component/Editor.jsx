import React, { useState, useEffect, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { useTheme, THEMES } from '../context/ThemeContext'

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote'],
        ['clean']
    ]
}



const PAGE_HEIGHT = 2244

function getPlainText(html) {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.innerText || tmp.textContent || ''
}

function countWords(text) {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export default function Editor({ content, onChange, chapters, selectedChapter }) {
    const [value, setValue] = useState(content || '')
    const [pageCount, setPageCount] = useState(1)
    const [wordCount, setWordCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [gotoPage, setGotoPage] = useState('')
    const scrollRef = useRef(null)
    const [locked, setLocked] = useState(false)

    const { isDark } = useTheme()


    useEffect(() => {
        setValue(content || '')
    }, [content])

    useEffect(() => {
        const text = getPlainText(value)
        setWordCount(countWords(text))
        setTimeout(() => {
            const editor = document.querySelector('.ql-editor')
            if (editor) {
                setPageCount(Math.max(1, Math.ceil(editor.scrollHeight / PAGE_HEIGHT)))
            }
        }, 500)
    }, [value])

    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const handleScroll = () => {
            const scrollTop = container.scrollTop
            const page = Math.floor(scrollTop / PAGE_HEIGHT) + 1
            setCurrentPage(Math.min(page, pageCount))
        }
        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [pageCount])

    const handleChange = (newValue) => {
        setValue(newValue)
        onChange?.(newValue)
        setTimeout(() => {
            const editor = document.querySelector('.ql-editor')
            if (editor) {
                setPageCount(Math.max(1, Math.ceil(editor.scrollHeight / PAGE_HEIGHT)))
            }
        }, 100)
    }

    const goToPage = (n) => {
        const page = Math.max(1, Math.min(n, pageCount))
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: (page - 1) * PAGE_HEIGHT, behavior: 'smooth' })
        }
        setCurrentPage(page)
    }

    const totalWords = (chapters || []).reduce((acc, ch) => {
        if (ch.id === selectedChapter?.id) return acc + wordCount
        return acc + countWords(getPlainText(ch.content || ''))
    }, 0)

    const pageMarkers = []
    for (let i = 1; i < pageCount; i++) {
        pageMarkers.push(
            <div key={i}>
                {/* Gauche avec numéro */}
                <div
                    className="absolute z-10 pointer-events-none flex items-center gap-1.5"
                    style={{ top: `${i * PAGE_HEIGHT + 42}px`, left: 'calc(50% - 440px)' }}
                >
                    <div className="w-6 h-0.5 bg-primary-300 rounded" />
                    <span className="text-primary-300 text-[9px] font-bold tracking-widest select-none">
                        {i + 1}
                    </span>
                </div>
                {/* Droite sans numéro */}
                <div
                    className="absolute z-10 pointer-events-none flex items-center gap-1.5"
                    style={{ top: `${i * PAGE_HEIGHT + 42}px`, right: 'calc(50% - 440px)' }}
                >
                    <span className="text-white text-[9px] font-bold tracking-widest select-none">
                        {i + 1}
                    </span>
                    <div className="w-6 h-0.5 bg-primary-300 rounded" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <style>{`
                .ql-toolbar {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 8 !important;
                    background: ${isDark ? 'var(--primary-200)' : 'var(--primary-1)'} !important;
                    display: flex !important;
                    justify-content: center !important;
                    flex-wrap: wrap !important;
                    border: none !important;
                    border-bottom: 2px solid var(--primary-300) !important;
                }
                .ql-container {
                    border: none !important;
                    height: auto !important;
                }
                .ql-editor {
                    font-size: 18px !important;
                    line-height: 2 !important;
                    max-width: 880px !important;
                    margin: 0 auto !important;
                    margin-top: 20px !important;
                    padding: 80px !important;
                    min-height: ${PAGE_HEIGHT}px !important;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.08);
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            <div className="flex flex-1 overflow-hidden">

                {/* Éditeur */}
                <div ref={scrollRef} className="relative flex-1 overflow-y-auto hide-scrollbar">
                    {pageMarkers}
                    <ReactQuill
                        theme="snow"
                        value={value}
                        onChange={handleChange}
                        modules={modules}
                        readOnly={locked}
                    />
                </div>

                {/* Minimap */}
                <div className="flex flex-col w-[70px] bg-primary-50">
                    {/*Div du dessus — même hauteur que la toolbar */}
                    <div className={`h-[42px] w-full border-b-2 ${isDark ? 'bg-primary-200' : 'bg-primary-1'} border-primary-300 flex-shrink-0 flex items-center justify-center`}>
                        <button
                            onClick={() => setLocked(!locked)}
                            title={locked ? 'Déverrouiller' : 'Verrouiller'}
                            className={`text-lg transition-colors ${locked ? 'text-primary-400' : 'text-primary-200 hover:text-primary-300'}`}
                        >
                            {locked ? '🔒' : '🔓'}
                        </button>
                    </div>

                    {/* Boutons pages */}
                    <div className="flex flex-col items-center gap-1 py-3 flex-1  overflow-y-auto hide-scrollbar" >
                        <span className="text-[9px] text-primary-300 font-bold tracking-widest mb-1">PG</span>
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                title={`Page ${p}`}
                                className={`w-[50px] h-[67px] rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all
                                    ${p === currentPage
                                        ? 'border-2 border-primary-400 text-primary-400 bg-primary-50'
                                        : `border border-primary-200 text-primary-300 ${isDark ? 'bg-primary-200' : 'bg-primary-1'} hover:bg-primary-50`
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Barre de stats */}
            <div className={`flex justify-center items-center gap-6 px-6 py-2 border-t-2 rounded-t-full border-primary-300 ${isDark ? 'bg-primary-200' : 'bg-primary-1'} text-sm font-medium text-primary-900 select-none flex-shrink-0`}>

                {/* Navigation */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="text-primary-300 hover:text-primary-400 disabled:opacity-30 text-lg px-0.5"
                    >‹</button>
                    <span className="text-primary-500">Page {currentPage}</span>
                    <span className="text-primary-200">/ {pageCount}</span>
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= pageCount}
                        className="text-primary-300 hover:text-primary-400 disabled:opacity-30 text-lg px-0.5"
                    >›</button>
                    <input
                        type='number'
                        min={1}
                        max={pageCount}
                        value={gotoPage}
                        onChange={e => setGotoPage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { goToPage(parseInt(gotoPage)); setGotoPage('') } }}
                        placeholder='aller à…'
                        className="w-16 px-2 py-0.5 border border-primary-300 rounded-md text-xs text-primary-900 outline-none"
                    />
                </div>

                <span className="text-primary-200">|</span>

                <span className={wordCount >= 4000 ? 'text-green-500' : wordCount >= 2000 ? 'text-primary-400' : 'text-gray-400'}>
                    ✍️ {wordCount.toLocaleString()} mots
                    {wordCount >= 4000 ? ' ✅' : wordCount >= 2000 ? ' 👍' : ' (min 2000)'}
                </span>

                <span className="text-primary-200">|</span>

                <span>📄 {pageCount} page{pageCount > 1 ? 's' : ''}</span>

                <span className="text-primary-200">|</span>

                <span>📚 {totalWords.toLocaleString()} mots</span>

                <span className={totalWords >= 90000 ? 'text-green-500' : 'text-gray-400'}>
                    {totalWords >= 90000 ? '🎉 Objectif atteint !' : `📊 ${Math.round((totalWords / 90000) * 100)}% vers 90 000 mots`}
                </span>

            </div>
        </div>
    )
}