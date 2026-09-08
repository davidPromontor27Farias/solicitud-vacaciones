

export interface TransactionManager {
    ejecutar<T>(trabajo: (tx: unknown) => Promise<T>): Promise<T>;
}

