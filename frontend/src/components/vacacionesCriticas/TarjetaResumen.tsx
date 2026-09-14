import { GLASS } from '../../utils/estilos';

export interface TarjetaResumenProps {
    icono: React.ReactNode;
    etiqueta: string;
    valor: number;
    texto: string;
}

export const TarjetaResumen = ({ icono, etiqueta, valor, texto }: TarjetaResumenProps) => {
    return (
        <div className={`${GLASS} p-8 rounded-2xl flex flex-col justify-center min-h-[160px]`}>
            <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">{etiqueta}</span>
                {icono}
            </div>
            <p className={`text-4xl font-bold mt-3 ${texto}`}>{valor}</p>
        </div>
    );
};