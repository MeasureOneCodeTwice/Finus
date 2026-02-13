import cors from 'cors';

const defaultMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const defaultOrigin = 'http://localhost:8080';
export function buildCorsConfig(opts: { origin?: string, methods?: string[] } | undefined) {
    return cors({
    origin: opts?.origin ?? defaultOrigin,
    methods: opts?.methods ?? defaultMethods,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
 });
}
