import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './page/Home'


export default function App() {

    return (
        <HashRouter>
            <Home />
            
        </HashRouter>
    )

   
}