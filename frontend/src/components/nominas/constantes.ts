import type { EstatusSolicitud } from '../../api/admin';

export const ESTATUS_TABS: { id: EstatusSolicitud; label: string }[] = [
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'rechazada', label: 'Rechazadas' },
    { id: 'revocada', label: 'Revocadas' },
];



