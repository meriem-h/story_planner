import React from 'react'

export default function ModalViewCharacter({ character }) {
    if (!character) return null

    return (
        <div className='flex flex-col gap-6 overflow-y-auto max-h-[70vh]'>

            {/* avatar + nom + description */}
            <div className='flex gap-4'>
                <div className='w-32 h-32 rounded-xl bg-orange-300 flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0'>
                    {character.image_url
                        ? <img src={character.image_url} alt={character.name} className='w-full h-full object-cover' />
                        : character.name[0]
                    }
                </div>
                <div className='flex flex-col gap-2 flex-1 min-w-0'>
                    <div>

                    <h2 className='text-2xl font-bold text-orange-800'>{character.name}</h2>
                    {character.age && (
                        <span className='text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium'>
                            {character.age} ans
                        </span>
                    )}
                    </div>
                    {character.description && (
                        <p className='text-sm text-orange-500 italic line-clamp-3'>{character.description}</p>
                    )}
                </div>
            </div>

            <hr className='border-orange-100' />

            {/* infos */}
            <div className='flex flex-col gap-4 min-h-[150px]'>
                {character.personality && (
                    <div>
                        <p className='text-xs font-bold text-orange-400 uppercase tracking-wider mb-1'>Personnalité</p>
                        <p className='text-orange-800'>{character.personality}</p>
                    </div>
                )}
                {character.notes && (
                    <div>
                        <p className='text-xs font-bold text-orange-400 uppercase tracking-wider mb-1'>Notes</p>
                        <p className='text-orange-800'>{character.notes}</p>
                    </div>
                )}
                {!character.personality && !character.notes && (
                    <p className='text-center text-orange-300 italic pt-8'>Aucune information supplémentaire</p>
                )}
            </div>

        </div>
    )
}