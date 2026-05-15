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
    [{ 'align': [] }],          // ← centrer, justifier etc
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['blockquote'],
    ['clean']
  ]
}

export default function Editor() {
  const [value, setValue] = useState('')

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={setValue}
      modules={modules}
      style={{ height: 'calc(90vh - 150px)' }}
    />
  )
}