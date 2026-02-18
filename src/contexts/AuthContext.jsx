import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('usuario');
            if (raw) {
                const parsed = JSON.parse(raw);
                console.log('Loading user from localStorage:', parsed);
                setUser(parsed);
            }
        } catch (e) {
            console.warn('Failed to parse stored user', e);
        }
    }, []);

    const login = async ({ usuario, password }) => {
        console.log('🔐 Iniciando login...');
        const res = await api.post('/login', { usuario, password });
        console.log('📡 Respuesta del servidor:', res.data);

        // Backend returns { success: true, usuario: {...} }
        const payload = res.data?.usuario;
        if (!payload) {
            console.error('❌ Login response inválida. res.data:', res.data);
            throw new Error('Login: respuesta inválida');
        }

        console.log('✅ Login exitoso, payload:', payload);
        const serialized = JSON.stringify(payload);
        console.log('💾 Guardando en localStorage:', serialized);
        localStorage.setItem('usuario', serialized);

        // Verify it was saved
        const verify = localStorage.getItem('usuario');
        console.log('✓ Verificación localStorage:', verify);

        setUser(payload);
        return payload;
    };

    const logout = () => {
        localStorage.removeItem('usuario');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export default AuthContext;
