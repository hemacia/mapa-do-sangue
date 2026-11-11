// Só o pedaço da API do D1 que usamos, para não depender dos tipos do Workers.
export interface D1 {
  prepare(consulta: string): {
    bind(...valores: unknown[]): {
      run(): Promise<unknown>
      first<T>(): Promise<T | null>
    }
    all<T>(): Promise<{ results: T[] }>
  }
}

export interface Contexto {
  env: { DB: D1 }
  request: Request
}
