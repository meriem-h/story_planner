import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useApi } from '../../context/ApiContext'

export default function ModalDelete({ isOpen, onClose, onSuccess, table, id, message }) {
    
    const api = useApi()  // ← avant le return !

    if (!isOpen) return null

    const handleConfirm = async () => {
        await api(`${table}:delete`, id)
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-lg p-6 shadow-xl z-10 w-[400px]">
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-16 h-16 rounded-full bg-red-100 flex items-center justify-center'>
                        <AlertTriangle className='text-red-400' size={32} />
                    </div>
                    <p className='text-center text-primary-800 font-bold'>{message || 'Êtes-vous sûr de vouloir supprimer ?'}</p>
                    <p className='text-center text-primary-400 text-sm'>Cette action est irréversible !</p>
                    <div className='flex gap-3 w-full'>
                        <button onClick={onClose} className='flex-1 py-2 border border-primary-200 rounded-lg text-primary-400 hover:bg-primary-50 transition-colors'>
                            Annuler
                        </button>
                        <button onClick={handleConfirm} className='flex-1 py-2 bg-red-400 hover:bg-red-500 transition-colors text-white rounded-lg font-bold'>
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}