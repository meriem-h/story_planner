import React from 'react'
import { X } from 'lucide-react'


export default function Modal({ isOpen, onClose, title, children, size, maxSize = 80, minSize = 50 }) {
    if (!isOpen) return null
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* fond grisé cliquable */}
            <div 
                className="absolute inset-0 bg-black/50" 
                onClick={onClose}
            />
            
            {/* modal par dessus */}
            {/* <div className={`relative bg-white rounded-lg p-6 shadow-xl z-10 ${size ? `w-[${size}%]` : `min-w-[${minSize}%] max-w-[${maxSize}%]`}`}> */}
            <div className={`relative bg-white rounded-lg p-6 shadow-xl z-10 ${size ? `w-[${size}%]` : `w-2/3`}`}>
            
                <div className="flex justify-between items-center">
                    <h2>{title}</h2>
                    <button onClick={onClose}><X /></button>
                </div>
                {children}
            </div>
        </div>
    )
}
