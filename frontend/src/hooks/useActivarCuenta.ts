import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { crearPassword, registrarCorreo } from "../api/auth";
import type {FormEvent} from 'react';



export const useActivarCuentaPage = (numeroEmpleado:string) =>{

    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
    const [paso, setPaso] = useState<'correo' | 'token'>('correo');
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);

    const manejarCorreo = async(evento: FormEvent) => {
        evento.preventDefault();
        setError(null);
        setCargando(true);
        try {
            await registrarCorreo(numeroEmpleado, correo.trim());
            setMensaje('Te enviamos un correo con un código de activación. Si no te llega, pide el código a sistemas.');
            setPaso('token');
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    const manejarToken = async(evento:FormEvent) => {
        evento.preventDefault();
        setError(null);

        if (password !== passwordConfirmacion) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setCargando(true);
        try {
            await crearPassword(numeroEmpleado, token.trim(), password);
            navigate('/login', {
                state: { mensajeExito: 'Tu cuenta se creó correctamente. Inicia sesión con tu nueva contraseña.' },
            });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Error inesperado');
        } finally {
            setCargando(false);
        }
    }

    return {
        paso, error, mensaje, cargando,
        correo, setCorreo, manejarCorreo,
        token, setToken, manejarToken, 
        password, setPassword, passwordConfirmacion, 
        setPasswordConfirmacion, 

    }
}