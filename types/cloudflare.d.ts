// types/cloudflare.d.ts
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
    run(): Promise<{ success: boolean }>
    first<T = Record<string, unknown>>(): Promise<T | null>
  }
}
export {}
