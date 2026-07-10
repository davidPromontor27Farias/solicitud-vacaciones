
export interface TokenActivacion{
    id: string;
    empleadoId: string;
    token: string;
    expiraAt: Date;
    usadoAt: Date | null
}

export interface TokenActivacionRepository{
    crear(token: Omit<TokenActivacion, 'id'>): Promise<TokenActivacion>;
    buscarPorToken(token: string): Promise<TokenActivacion | null>;
    marcarUsado(id: string): Promise<void>;

}

