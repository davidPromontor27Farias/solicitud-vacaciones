import { GLASS } from '../../utils/estilos';
import type { DepartamentoResumen } from './utils';

export const TarjetaTopDepartamento = ({ icono, etiqueta, resumen, texto }: {
    icono: React.ReactNode;
    etiqueta: string;
    resumen: DepartamentoResumen | undefined;
    texto: string;
}) => {
    return (
        <div className={`${GLASS} p-8 rounded-2xl flex flex-col justify-center min-h-[160px]`}>
            <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{etiqueta}</span>
                {icono}
            </div>
            {resumen ? (
                <>
                    <p className="text-2xl font-bold text-white mt-3 truncate" title={resumen.departamento}>{resumen.departamento}</p>
                    <p className={`text-sm font-medium mt-1 ${texto}`}>
                        {resumen.totalDias} {resumen.totalDias === 1 ? 'día' : 'días'} · {resumen.empleados} {resumen.empleados === 1 ? 'empleado' : 'empleados'}
                    </p>
                </>
            ) : (
                <p className="text-sm text-white/50 mt-3">Sin registros</p>
            )}
        </div>
    );
};