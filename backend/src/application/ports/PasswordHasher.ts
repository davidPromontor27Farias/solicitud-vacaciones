

export interface PasswordHasher {
    hash(password: string): Promise<string>;
    comparar(password: string, hash: string): Promise<boolean>
}


