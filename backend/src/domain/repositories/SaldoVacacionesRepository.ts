import { SaldoVacaciones } from '../entities/SaldoVacaciones';

export interface SaldoVacacionesRepository {
  listarPorEmpleadoId(empleadoId: string): Promise<SaldoVacaciones[]>;
  listarConDiasPendientes(): Promise<SaldoVacaciones[]>;
  crear(saldo: SaldoVacaciones): Promise<void>;
  guardar(saldo: SaldoVacaciones): Promise<void>;
  eliminar(id: string): Promise<void>;
}

