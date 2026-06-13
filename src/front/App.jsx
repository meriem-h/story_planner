import React from 'react'
import { HashRouter } from 'react-router-dom'
import Home from './page/Home'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
    return (
        <HashRouter>
            <ThemeProvider>
                <Home />
            </ThemeProvider>
        </HashRouter>
    )
}