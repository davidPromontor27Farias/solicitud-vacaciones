
export class RangoDias{

    private constructor(private readonly fechas: Date[]) {}
    
    static crear(fechas: Date[]): RangoDias{
        if (fechas.length === 0){
            throw new Error('Debe seleccionar al menos un dia')
        }

        const unicas = new Set(fechas.map((f) => f.toISOString().slice(0, 10)));
        if(unicas.size !== fechas.length){
            throw new Error('No se pueden repetir dias en la misma solicitud')
        }


        for(const fecha of fechas){
            if(fecha.getUTCDay() === 0){
                throw new Error(`El día ${fecha.toISOString().slice(0, 10)} es domingo y no puede seleccionarse`);
            }
        }

        const ordenadas = [...fechas].sort((a, b) => a.getTime() - b.getTime());

        return new RangoDias(ordenadas);
    }

    get valores(): Date[] {return [...this.fechas];}
    get cantidad(): number {return this.fechas.length;}
    get primerDia(): Date {return this.fechas[0];}
    get ultimoDia(): Date {return this.fechas[this.fechas.length - 1]}
}