import React from 'react'

const SingleField = ({ field, onChange, errors }) => {

    const Icon = field.icon || false
    const datas = field.data || false
    const hasError = !!errors?.[field.name]
    const errorMessage = typeof errors?.[field.name] === 'string' ? errors[field.name] : null

    return (
        <div key={field.name}>
            <div className='flex justify-between'>
                <label className="block mb-2.5 text-sm font-medium text-heading">{field.label}</label>
                {errorMessage && <p className="text-red-500 text-xs mt-1 text-right">{errorMessage}</p>}
            </div>
            <div className={`flex shadow-xs ${hasError ? 'border border-red-500 rounded-lg' : 'border-default-medium'}`}>
                {Icon && (
                    <span className="inline-flex items-center px-3 text-sm text-body bg-white border rounded-e-0 border-default-medium border-e-0 rounded-s-lg">
                        <Icon className="w-5 h-5 text-gray-400" />
                    </span>
                )}

                {(field.type == "select" && datas) ?
                    <select
                        name={field.name}
                        onChange={onChange}
                        className={` ${!Icon ? "rounded-lg" : "rounded-e-lg"} block w-full px-3 py-2.5 border text-heading text-sm focus:ring-brand focus:border-brand placeholder:text-body `}
                    >
                        {/* {datas.map((data) => (
                            <option key={data.value} value={data.value}>{data.text}</option>
                        ))} */}

                        {datas.map((data) => (
                            data.selected ? (
                                <option
                                    key={data.value}
                                    value={data.value}
                                    selected
                                >
                                    {data.text}
                                </option>
                            ) : (
                                <option
                                    key={data.value}
                                    value={data.value}
                                >
                                    {data.text}
                                </option>
                            )
                        ))}
                    </select>
                    : (field.type === "textarea") ?

                        <textarea
                            name={field.name}
                            placeholder={field.placeholder}
                            onChange={onChange}
                            className={`${!Icon ? "rounded-lg" : "rounded-e-lg"} block w-full px-3 py-2.5 border text-heading text-sm focus:ring-brand focus:border-brand placeholder:text-body`}
                            rows={5}
                        />

                        :
                        <input
                            type={field.type || 'text'}
                            name={field.name}
                            placeholder={field.placeholder}
                            onChange={onChange}
                            className={` ${!Icon ? "rounded-lg" : "rounded-e-lg"} block w-full px-3 py-2.5 border text-heading text-sm focus:ring-brand focus:border-brand placeholder:text-body `}
                        />
                }
            </div>

        </div>
    )
}

export default function FormField({ fields, onChange, errors }) {
    return (
        <>
            {fields.map((field, index) => {
                if (field.type === "twin") {
                    return (
                        <div key={index} className="flex justify-around gap-2">
                            {field.data.map((twinField) => (
                                <SingleField key={twinField.name} field={twinField} onChange={onChange} errors={errors} />
                            ))}
                        </div>
                    )
                }
                return <SingleField key={field.name} field={field} onChange={onChange} errors={errors} />
            })}
        </>
    )
}