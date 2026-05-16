import React, { useState } from 'react'
import { ChevronUp, BadgePlus } from 'lucide-react'

export default function ChapterLayout(props) {
  const [descOpen, setDescOpen] = useState(false)

  const changeChapter = async (e) => {
    const chapter = props.chapters.find(ch => ch.id == e.target.dataset.id)
    props.setSelectedChapter(chapter)
  }

  const changeBook = async (e) => {
    const book = props.books.find(b => b.id == e.target.value)
    props.setSelectedBook(book)
  }

  return (
    <div className='flex flex-col h-full'>

      {/* header livre */}
      <div className='p-4 border-b border-orange-300'>

        {/* select livre + bouton ajouter */}
        <div className='flex items-center justify-between gap-2 mb-3'>
          <div className='flex items-center gap-1 flex-1 min-w-0'>
            <select
              className='w-full bg-transparent border-none outline-none cursor-pointer font-bold text-lg appearance-none text-orange-800 truncate'
              value={props.selectedBook?.id}
              onChange={changeBook}
            >
              {props.books?.map((book) => (
                <option key={book.id} value={book.id}>{book.title}</option>
              ))}
            </select>
            <ChevronUp className='rotate-180 text-orange-400 flex-shrink-0' size={14} />
          </div>
          <button onClick={() => props.addBook(true)} className='text-orange-400 hover:text-orange-600 transition-colors flex-shrink-0'>
            <BadgePlus size={20} />
          </button>
        </div>

        {/* description accordion */}
        <div>
          <div
            className='flex justify-between items-center cursor-pointer'
            onClick={() => setDescOpen(!descOpen)}
          >
            <p className='text-xs font-bold text-orange-400 uppercase tracking-wider'>Description</p>
            <ChevronUp
              size={14}
              className={`text-orange-400 transition-transform duration-300 ${descOpen ? 'rotate-0' : 'rotate-180'}`}
            />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${descOpen ? 'max-h-40' : 'max-h-0'}`}>
            <p className='mt-2 text-sm text-orange-700 leading-relaxed'>
              {props.selectedBook?.description || 'Aucune description'}
            </p>
          </div>
        </div>
      </div>

      {/* liste chapitres */}
      <div className='flex-1 overflow-hidden flex flex-col p-4'>
        <div className='flex justify-between items-center mb-3'>
          <p className='text-xs font-bold text-orange-400 uppercase tracking-wider'>Chapitres</p>
          <button onClick={() => props.addChapter(true)} className='text-orange-400 hover:text-orange-600 transition-colors'>
            <BadgePlus size={20} />
          </button>
        </div>

        <div className='overflow-y-auto flex flex-col gap-1'>
          {props?.chapters?.map((chapter) => (
            <button
              key={chapter.id}
              data-id={chapter.id}
              onClick={changeChapter}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                props.selectedChapter?.id == chapter.id
                  ? 'bg-orange-300 text-white font-bold'
                  : 'hover:bg-orange-100 text-orange-800'
              }`}
            >
              {chapter.title}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}