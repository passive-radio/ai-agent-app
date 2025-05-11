declare namespace NodeJS {
  interface Global {
    __dirname: string;
    __filename: string;
  }
}

declare const __dirname: string;
declare const __filename: string;

declare module 'fs' {
  export interface Stats {}
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function readFileSync(path: string, encoding: string): string;
  export function readdirSync(path: string): string[];
  export function writeFileSync(path: string, data: string, encoding: string): void;
  export function unlinkSync(path: string): void;
}

declare module 'path' {
  export function join(...paths: string[]): string;
} 