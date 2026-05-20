import React, { useState, useEffect } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

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

export default function Editor({ content, onChange }) {
    const [value, setValue] = useState(content || '')
    const [pageCount, setPageCount] = useState(1)

    useEffect(() => {
        setValue(content || '')
    }, [content])

    useEffect(() => {
        setTimeout(() => {
            const editor = document.querySelector('.ql-editor')
            if (editor) {
                setPageCount(Math.max(1, Math.ceil(editor.scrollHeight / PAGE_HEIGHT)))
            }
        }, 500)
    }, [value])

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

    const pageMarkers = []
    for (let i = 1; i < pageCount; i++) {
        pageMarkers.push(
            <div
                key={i}
                style={{
                    position: 'absolute',
                    top: `${i * PAGE_HEIGHT + 42}px`,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                    padding: '12px 0',
                }}
            >
                <div style={{
                    borderTop: '2px solid #fdba74',
                    width: '800px',
                    margin: '0 auto',
                }} />
                <div style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#fdba74',
                    padding: '4px 0',
                    userSelect: 'none',
                    fontWeight: 'bold',
                }}>
                    — Page {i + 1} —
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 250px)' }}>
            <style>{`
                .ql-toolbar {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 8 !important;
                    background: white !important;
                    display: flex !important;
                    justify-content: center !important;
                    flex-wrap: wrap !important;
                    border: none !important;
                    border-bottom: 2px solid #fdba74 !important;
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
                    margin-top : 20px !important;
                    padding: 80px !important;
                    min-height: 500px !important;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.08);
                }
            `}</style>
            <div style={{ position: 'relative', flex: 1, overflowY: 'auto' }}>
                {pageMarkers}
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={handleChange}
                    modules={modules}
                />
            </div>
        </div>
    )
}