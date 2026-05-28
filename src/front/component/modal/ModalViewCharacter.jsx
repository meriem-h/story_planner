import React from 'react'
import { Wand2, User, Sparkles, Star, Users, Ghost, Moon, Swords, GraduationCap, Skull } from 'lucide-react'



const ROLE_ICON = {
    principal: { icon: <Star size={14} fill='currentColor' />, color: "bg-green-100 text-green-500" },
    secondaire: { icon: <Moon size={14} fill='currentColor' />, color: "bg-yellow-100 text-yellow-500" },
    tertiaire: { icon: <Users size={14} fill='currentColor' />, color: "bg-blue-100 text-blue-500" },
    pnj: { icon: <Ghost size={14} className='text-gray-500' />, color: "bg-gray-100 text-gray-500" },

}

const ROLE_LABEL = {
    principal: 'Principal',
    secondaire: 'Secondaire',
    tertiaire: 'Tertiaire',
    pnj: 'PNJ',
}

const TYPE_ICON = {
    wand: { icon: <Wand2 size={12} />, color: "bg-purple-100 text-purple-500" },
    user: { icon: <User size={12} />, color: "bg-orange-100 text-orange-500" },
    sparkles: { icon: <Swords size={12} />, color: "bg-red-100 text-red-500" }
}

const PRECISION_ICON = {
    mort: { icon: <Skull size={14} className='text-red-400' />, color: "bg-red-100 text-red-500" },
    professeur: { icon: <GraduationCap size={14} className='text-green-400' fill='currentColor' />, color: "bg-green-100 text-green-500" },
}


export default function ModalViewCharacter({ character }) {
    if (!character) return null

    return (
        <div className='flex flex-col gap-6 overflow-y-auto max-h-[70vh]'>

            {/* avatar + nom + badges */}
            <div className='flex gap-4'>
                <div className='w-32 h-32 rounded-xl bg-orange-300 flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0'>
                    {character.image_url
                        ? <img src={character.image_url} alt={character.name} className='w-full h-full object-cover' />
                        : character.name[0]
                    }
                </div>
                <div className='flex flex-col gap-2 flex-1 min-w-0'>
                    <h2 className='text-2xl font-bold text-orange-800'>{character.name}</h2>

                    {/* badges role + type + age */}
                    <div className='flex flex-wrap gap-2'>
                        {character.age && (
                            <span className={`text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium`}>
                                {character.age} ans
                            </span>
                        )}
                        {character.role && (
                            <span className={`flex items-center gap-1 text-xs ${ROLE_ICON[character.role].color} px-3 py-1 rounded-full font-medium`}>
                                {ROLE_ICON[character.role].icon}
                                {ROLE_LABEL[character.role]}
                            </span>
                        )}
                        {character.ct_label && (
                            <span className={`flex items-center gap-1 text-xs ${TYPE_ICON[character.ct_icon].color}  px-3 py-1 rounded-full font-medium`}>
                                {character.ct_icon && TYPE_ICON[character.ct_icon].icon}
                                {character.ct_label}
                            </span>
                        )}
                        {character.precision && (
                            // <span className='text-xs bg-orange-50 text-orange-400 px-3 py-1 rounded-full italic'>

                            //     
                            //     {character.precision}
                            // </span>

                            <span className={`flex items-center gap-1 text-xs ${PRECISION_ICON[character.precision]?.color || 'bg-orange-50 text-orange-400'}  px-3 py-1 rounded-full font-medium`}>
                                {PRECISION_ICON[character.precision]?.icon}
                                {character.precision}
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