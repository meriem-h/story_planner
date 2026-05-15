import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, CircleUserRound, BookUser } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'




export default function Layout({ children }) {
    const [isOpen, setIsOpen] = useState(false)

    // const { user, logout } = useAuth()

    return (
        <div className="flex h-screen">

            {/* Sidebar */}
            <div className={`${isOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden  bg-orange-200`}>

                {/* <nav className="flex flex-col p-4 gap-4 w-64">



                    <Link to="/">Dashboard</Link>
                    <Link to="/Home">Home</Link>
                </nav> */}
            </div>

            {/* Contenu */}
            <div className="flex-1 flex">
                {/* Burger */}
                <div className="p-4 bg-orange-200">
                    <button onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Page */}
                <div className="flex-1 p-4">
                    {children}
                </div>
            </div>
        </div>
    )
}