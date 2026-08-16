import React from 'react'
import { X } from 'lucide-react'
import { Styles } from 'docx'


export default function Modal({ isOpen, onClose, title, children, size, maxSize = 80, minSize = 50, height, maxHeight = 90, minHeight, index = 20 }) {
    if (!isOpen) return null

    index = "z-" + index 

    console.log("index => ", index);


    return (
        <div className={`fixed inset-0 ${index} flex items-center justify-center`}>
            {/* fond grisé cliquable */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* modal par dessus */}
            <div
                className="relative bg-primary-50 rounded-lg border-2 border-primary-100 p-6 shadow-xl z-20"
                style={{
                    width: size ? `${size}%` : 'auto',
                    ...(maxSize && { maxWidth: `${maxSize}%` }),
                    ...(minSize && { minWidth: `${minSize}%` }),
                    height: height ? `${height}vh` : 'auto',
                    ...(maxHeight && { maxHeight: `${maxHeight}vh` }),
                    ...(minHeight && { minHeight: `${minHeight}vh` }),

                }}
            >

                <div className="flex justify-between items-center">
                    <h2>{title}</h2>
                    <button onClick={onClose}><X /></button>
                </div>
                {children}
            </div>
        </div>
    )
}
