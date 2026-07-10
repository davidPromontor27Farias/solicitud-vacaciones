


export class Matricula {
    private constructor(private readonly valor: string) {}

    static crear(valorCrudo: string): Matricula{
        const valor = valorCrudo?.trim();
        if(!valor){
            throw new Error('El numero de empleado es obligatorio');
        }

        if (!/^[A-Za-z0-9-]+$/.test(valor)) {
            throw new Error('El numero de empleado tiene un formato invalido');
        }

        return new Matricula(valor);
    }

    toString(): string {return this.valor;}
    equals(otra: Matricula): boolean {return this.valor === otra.valor; }
}