import React from 'react'
import Modal from './Modal'

export default function ModalImage({ src, alt, isOpen, onClose }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size={75}>
            <div className="flex items-center justify-center p-4 h-full">
                <img
                    src={src}
                    alt={alt || ''}
                    className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
            </div>
        </Modal>
    )
}