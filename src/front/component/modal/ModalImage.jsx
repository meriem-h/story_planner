import React from 'react'
import Modal from './Modal'

export default function ModalImage({ src, alt, isOpen, onClose }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} height={100} >
            <div className="flex items-center justify-center p-4">
                <img
                    src={src}
                    alt={alt || ''}
                    className="max-h-[80vh] object-contain rounded-lg"
                />
            </div>
        </Modal>
    )
}