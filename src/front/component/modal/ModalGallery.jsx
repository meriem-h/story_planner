import React, { useState, useEffect } from 'react'
import { Trash2, Pen, Copy, Check, Plus, Images } from 'lucide-react'
import { ReactSortable } from 'react-sortablejs'
import { useApi } from '../../context/ApiContext'
import ModalDelete from './ModalDelete'
import ModalImage from './ModalImage'

export default function ModalGallery({ book }) {

    const api = useApi()
    const [assets, setAssets] = useState([])
    const [firstAssets, setFirstAssets] = useState([])
    const [selected, setSelected] = useState(null)
    const [newUrl, setNewUrl] = useState('')
    const [newLabel, setNewLabel] = useState('')
    const [copied, setCopied] = useState(false)
    const [editId, setEditId] = useState(null)
    const [editLabel, setEditLabel] = useState('')
    const [editUrl, setEditUrl] = useState('')
    const [assetToDelete, setAssetToDelete] = useState(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [previewSrc, setPreviewSrc] = useState(null)

    useEffect(() => {
        fetchAssets()
    }, [])

    const fetchAssets = async () => {
        const result = await api('asset:findBy', { book_id: book.id })
        const data = result.data || []
        setAssets(data)
        if (data.length > 0 && !selected) {
            setSelected(data[0])
            setFirstAssets(data[0])
        }
    }

    const handleAdd = async () => {
        if (!newUrl.trim()) return
        await api('asset:create', { book_id: book.id, url: newUrl, label: newLabel })
        setNewUrl('')
        setNewLabel('')
        fetchAssets()
    }

    const handleDelete = async () => {
        await api('asset:delete', assetToDelete)
        if (selected?.id === assetToDelete) setSelected(null)
        setIsConfirmOpen(false)
        setSelected(firstAssets)

        fetchAssets()
    }

    const handleEdit = (asset) => {
        setEditId(asset.id)
        setEditLabel(asset.label || '')
        setEditUrl(asset.url)
    }

    const handleEditSave = async () => {
        await api('asset:update', { id: editId, data: { url: editUrl, label: editLabel } })
        setEditId(null)
        fetchAssets()
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(selected.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleReorder = async (newList) => {
        setAssets(newList)
        await api('asset:reorder', newList.map(a => ({ id: a.id })))
    }

    return (
        <div className='flex flex-col gap-4 p-4' style={{ width: '55vw', height: '70vh' }}>

            <ModalDelete
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onSuccess={handleDelete}
                table="asset"
                id={assetToDelete}
            />

            <ModalImage
                src={previewSrc}
                isOpen={!!previewSrc}
                onClose={() => setPreviewSrc(null)}
            />

            {/* champ ajout */}
            <div className='flex gap-2 flex-shrink-0'>
                <input
                    type='text'
                    placeholder='Label (optionnel)'
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className='w-32 px-3 py-2 border rounded-lg text-sm text-primary-800 placeholder:text-primary-300 outline-none focus:border-primary-300'
                />
                <input
                    type='text'
                    placeholder="URL de l'image..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    className='flex-1 px-3 py-2 border rounded-lg text-sm text-primary-800 placeholder:text-primary-300 outline-none focus:border-primary-300'
                />
                <button
                    onClick={handleAdd}
                    className='flex items-center gap-1 px-3 py-2 bg-primary-300 hover:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0'
                >
                    <Plus size={14} />
                    Ajouter
                </button>
            </div>

            {assets.length === 0 ? (
                <div className='flex flex-col items-center justify-center flex-1 gap-2'>
                    <Images size={32} className='text-primary-200' />
                    <p className='text-primary-300 text-sm'>Aucune image pour ce livre</p>
                </div>
            ) : (
                <div className='flex flex-col gap-3 flex-1 min-h-0'>

                    {selected && (
                        <div className='flex-1 flex flex-col gap-2 min-h-0'>

                            {/* image */}
                            <div className='flex-1 rounded-xl overflow-hidden bg-primary-50 min-h-0'>
                                <img
                                    src={selected.url}
                                    alt={selected.label || ''}
                                    className='w-full h-full object-contain'
                                    onClick={() => setPreviewSrc(selected.url)}
                                />
                            </div>

                            {/* url copiable */}
                            <div
                                onClick={handleCopy}
                                className='flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-primary-100 transition-colors min-w-0'
                                title='Cliquer pour copier'
                            >
                                <p className='text-xs text-primary-400 truncate flex-1 min-w-0'>{selected.url}</p>
                                {copied
                                    ? <Check size={14} className='text-green-400 flex-shrink-0' />
                                    : <Copy size={14} className='text-primary-300 flex-shrink-0' />
                                }
                            </div>

                            {/* edit inline */}
                            {editId === selected.id ? (
                                <div className='flex flex-col gap-2 flex-shrink-0'>
                                    <input
                                        type='text'
                                        placeholder='Label'
                                        value={editLabel}
                                        onChange={(e) => setEditLabel(e.target.value)}
                                        className='px-3 py-2 border rounded-lg text-sm text-primary-800 outline-none focus:border-primary-300'
                                    />
                                    <input
                                        type='text'
                                        placeholder='URL'
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                        className='px-3 py-2 border rounded-lg text-sm text-primary-800 outline-none focus:border-primary-300'
                                    />
                                    <div className='flex gap-2'>
                                        <button onClick={handleEditSave} className='flex-1 py-2 bg-primary-300 hover:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors'>
                                            Sauvegarder
                                        </button>
                                        <button onClick={() => setEditId(null)} className='px-3 py-2 border border-primary-200 text-primary-400 rounded-lg text-sm transition-colors hover:bg-primary-50'>
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className='flex gap-2 flex-shrink-0'>
                                    <button
                                        onClick={() => handleEdit(selected)}
                                        className='flex-1 flex items-center justify-center gap-1 py-2 border border-primary-200 text-primary-400 hover:bg-primary-50 rounded-lg text-sm transition-colors'
                                    >
                                        <Pen size={13} /> Modifier
                                    </button>
                                    <button
                                        onClick={() => { setAssetToDelete(selected.id); setIsConfirmOpen(true) }}
                                        className='flex-1 flex items-center justify-center gap-1 py-2 border border-red-200 text-red-400 hover:bg-red-50 rounded-lg text-sm transition-colors'
                                    >
                                        <Trash2 size={13} /> Supprimer
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* strip horizontale avec drag & drop */}
                    <ReactSortable
                        list={assets}
                        setList={handleReorder}
                        animation={200}
                        ghostClass='opacity-30'
                        direction='horizontal'
                        className='flex gap-2 overflow-x-auto hide-scrollbar flex-shrink-0 pb-1'
                    >
                        {assets.map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => setSelected(asset)}
                                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0
                                    ${selected?.id === asset.id ? 'border-primary-400' : 'border-transparent hover:border-primary-200'}`}
                            >
                                <img
                                    src={asset.url}
                                    alt={asset.label || ''}
                                    className='w-20 h-20 object-cover'
                                    onError={(e) => { e.target.src = ''; e.target.style.background = '#fed7aa' }}
                                />
                                {asset.label && (
                                    <p className='text-xs text-primary-600 px-1 py-0.5 truncate bg-primary-50 max-w-20'>
                                        {asset.label}
                                    </p>
                                )}
                            </div>
                        ))}
                    </ReactSortable>

                </div>
            )}
        </div>
    )
}