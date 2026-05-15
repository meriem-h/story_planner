import './front/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './front/App';
import { ApiProvider } from './front/context/ApiContext'
import { AuthProvider } from './front/context/AuthContext'


const root = createRoot(document.getElementById('root'))
root.render(
    <ApiProvider>
        <AuthProvider>
            <App />
        </AuthProvider>
    </ApiProvider>
)