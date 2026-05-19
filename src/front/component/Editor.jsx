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

const PAGE_HEIGHT = 1122

export default function Editor({ content, onChange }) {
    const [value, setValue] = useState(content || '')
    const [pageCount, setPageCount] = useState(1)

    useEffect(() => {
        setValue(content || '')
    }, [content])

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
                }}
            >
                <div style={{ borderTop: '2px dashed #fca5a5', width: '100%' }} />
                <div style={{
                    textAlign: 'right',
                    fontSize: '11px',
                    color: '#fca5a5',
                    padding: '2px 8px',
                    userSelect: 'none'
                }}>
                    Page {i + 1}
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'relative' }}>
            <style>{`
                .ql-editor { 
                    font-size: 18px !important; 
                    line-height: 2 !important;
                    max-width: 800px !important;
                    margin: 0 auto !important;
                    padding: 40px !important;
                }
            `}</style>
            {pageMarkers}
            <ReactQuill
                theme="snow"
                value={value}
                onChange={handleChange}
                modules={modules}
                style={{ height: 'calc(100vh - 250px)' }}
            />
        </div>
    )
}