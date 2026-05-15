import React, { createContext, useContext } from 'react'
const ApiContext = createContext(null)

export const ApiProvider = ({ children }) => {
    const api = (channel, data) => window.electron.invoke(channel, data)

    return (
        <ApiContext.Provider value={api}>
            {children}
        </ApiContext.Provider>
    )
}

export const useApi = () => useContext(ApiContext)