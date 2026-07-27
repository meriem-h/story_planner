import React from 'react'
import { useTheme } from '../context/ThemeContext'

const DEFAULT_COLORS = [
    '#93c5fd', '#60a5fa', '#86efac', '#4ade80',
    '#fde68a', '#fbbf24', '#fdba74', '#fb923c',
    '#fca5a5', '#f87171', '#f9a8d4', '#f472b6',
    '#c4b5fd', '#a78bfa', '#67e8f9', '#94a3b8',
]

const SingleField = ({ field, onChange, errors, selectClass = null }) => {

    const { isDark } = useTheme()
    const Icon = field.icon || false
    const datas = field.data || false
    const hasError = !!errors?.[field.name]
    const errorMessage = typeof errors?.[field.name] === 'string' ? errors[field.name] : null

    // colorPicker : rangée de pastilles cliquables, pas un input classique donc on sort
    // du conteneur "shadow-xs border" standard pour rester sur un style propre aux pastilles
    if (field.type === 'colorPicker') {
        const colors = field.colors || DEFAULT_COLORS
        return (
            <div key={field.name}>
                <div className='flex justify-between'>
                    <label className="block mb-2.5 text-sm text-primary-600 font-medium text-heading">{field.label}</label>
                    {errorMessage && <p className="text-red-500 text-xs mt-1 text-right">{errorMessage}</p>}
                </div>
                <div className='flex gap-2 flex-wrap'>
                    {colors.map(c => (
                        <button
                            key={c}
                            type='button'
                            onClick={() => onChange({ target: { name: field.name, value: c } })}
                            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${field.value === c ? 'ring-2 ring-offset-2 ring-primary-400' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div key={field.name}>
            <div className='flex justify-between'>
                <label className="block mb-2.5 text-sm text-primary-600 font-medium text-heading">{field.label}</label>
                {errorMessage && <p className="text-red-500 text-xs mt-1 text-right">{errorMessage}</p>}
            </div>
            <div className={`flex shadow-xs ${hasError ? 'border border-red-500 rounded-lg' : 'border-default-medium'}`}>
                {Icon && (
                    <span className="inline-flex items-center px-3 text-sm text-body bg-primary-50 border rounded-e-0 border-default-medium border-e-0 rounded-s-lg">
                        <Icon className="w-5 h-5 text-gray-400" />
                    </span>
                )}

                {(field.type === 'select' && datas) ?
                    <select
                        name={field.name}
                        onChange={onChange}
                        value={field.value !== undefined ? field.value : (datas.find(d => d.selected)?.value || '')}
                        className={`${!Icon ? "rounded-lg" : "rounded-e-lg"} ${selectClass ? selectClass : ""} block w-full ${isDark ? 'text-primary-200' : 'text-primary-800'} px-3 py-2.5 border text-heading text-sm focus:ring-brand focus:border-brand placeholder:text-body`}
                    >
                        {datas.map((data) => (
                            <option key={data.value} value={data.value}>
                                {data.text}
                            </option>
                        ))}
                    </select>

                    : (field.type === 'textarea') ?
                        <textarea
                            name={field.name}
                            placeholder={field.placeholder}
                            onChange={onChange}
                            {...(field.value !== undefined && { value: field.value })}
                            className={`${!Icon ? "rounded-lg" : "rounded-e-lg"} block w-full ${isDark ? 'text-primary-200' : 'text-primary-800'} px-3 py-2.5 border text-heading text-sm focus:ring-brand focus:border-brand placeholder:text-body`}
                            rows={field.rows || 5}
                        />

                        :
                        <input
                            type={field.type || 'text'}
                            name={field.name}
                            placeholder={field.placeholder}
                            onChange={onChange}
                            {...(field.value !== undefined && { value: field.value })}
                            className={`${!Icon ? "rounded-lg" : "rounded-e-lg"} block w-full ${isDark ? 'text-primary-200' : 'text-primary-800'} px-3 py-2.5 border text-heading text-sm focus:ring-brand focus:border-brand placeholder:text-body`}
                        />
                }
            </div>
        </div>
    )
}

export default function FormField({ fields, onChange, errors, selectClass }) {
    return (
        <>
            {fields.map((field, index) => {
                if (field.type === 'twin') {
                    return (
                        <div key={index} className="flex justify-around gap-2">
                            {field.data.map((twinField) => (
                                <SingleField key={twinField.name} field={twinField} onChange={onChange} errors={errors} selectClass={selectClass} />
                            ))}
                        </div>
                    )
                }
                return <SingleField key={field.name} field={field} onChange={onChange} errors={errors} selectClass={selectClass} />
            })}
        </>
    )
}