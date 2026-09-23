import { SaldoVacaciones } from '../entities/SaldoVacaciones';

export interface SaldoVacacionesRepository {
  listarPorEmpleadoId(empleadoId: string, tx?: unknown): Promise<SaldoVacaciones[]>;
  listarPorEmpleadoIds(empleadoIds: string[]): Promise<SaldoVacaciones[]>;
  listarConDiasPendientes(): Promise<SaldoVacaciones[]>;
  listarTodos(): Promise<SaldoVacaciones[]>;
  crear(saldo: SaldoVacaciones): Promise<void>;
  guardar(saldo: SaldoVacaciones, tx?: unknown): Promise<void>;
  eliminar(id: string): Promise<void>;
}

