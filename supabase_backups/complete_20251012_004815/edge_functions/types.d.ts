/**
 * Type declarations for Deno runtime and Supabase Edge Functions
 * This file resolves TypeScript compilation errors related to Deno modules and Response interface
 */

// Deno standard library module declarations
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export interface ServeHandlerInfo {
    remoteAddr: { hostname: string; port: number; transport: string };
  }
  
  export interface ServeOptions {
    port?: number;
    hostname?: string;
    signal?: AbortSignal;
  }
  
  export function serve(
    handler: (request: Request, info?: ServeHandlerInfo) => Response | Promise<Response>,
    options?: ServeOptions
  ): Promise<void>;
}

// Supabase JavaScript client module declarations
declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClient {
    from(table: string): any;
    auth: {
      getUser(): Promise<any>;
      signInWithPassword(credentials: any): Promise<any>;
      signOut(): Promise<any>;
      onAuthStateChange(callback: (event: string, session: any) => void): any;
    };
    storage: {
      from(bucket: string): any;
    };
    functions: {
      invoke(name: string, options?: any): Promise<any>;
    };
    realtime: any;
    rpc(name: string, params?: any): any;
  }
  
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
  }
  
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): SupabaseClient;
}

declare module "https://esm.sh/@supabase/supabase-js@2.7.1" {
  export * from "https://esm.sh/@supabase/supabase-js@2";
}

// Jose library module declarations for JWT handling
declare module "https://esm.sh/jose@5.2.3" {
  export interface JWTPayload {
    [key: string]: any;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export interface JWTHeaderParameters {
    alg?: string;
    typ?: string;
    kid?: string;
    [key: string]: any;
  }

  export class SignJWT {
    constructor(payload?: JWTPayload);
    setProtectedHeader(protectedHeader: JWTHeaderParameters): this;
    setIssuer(issuer: string): this;
    setSubject(subject: string): this;
    setAudience(audience: string | string[]): this;
    setExpirationTime(input: number | string | Date): this;
    setNotBefore(input: number | string | Date): this;
    setIssuedAt(input?: number): this;
    setJti(jwtId: string): this;
    sign(key: CryptoKey | Uint8Array): Promise<string>;
  }

  export function importPKCS8(
    pkcs8: string,
    alg: string,
    options?: {
      extractable?: boolean;
    }
  ): Promise<CryptoKey>;

  export function importSPKI(
    spki: string,
    alg: string,
    options?: {
      extractable?: boolean;
    }
  ): Promise<CryptoKey>;

  export function importJWK(
    jwk: any,
    alg?: string,
    octAsKeyObject?: boolean
  ): Promise<CryptoKey>;

  export function importX509(
    x509: string,
    alg: string,
    options?: {
      extractable?: boolean;
    }
  ): Promise<CryptoKey>;

  export class jwtVerify {
    constructor(jwt: string, key: CryptoKey | Uint8Array, options?: any);
  }

  export function jwtVerify(
    jwt: string,
    key: CryptoKey | Uint8Array,
    options?: any
  ): Promise<{ payload: JWTPayload; protectedHeader: JWTHeaderParameters }>;
}

// Additional module declaration for any version of jose from esm.sh
declare module "https://esm.sh/jose@*" {
  export * from "https://esm.sh/jose@5.2.3";
}

// Declare as a regular module to ensure proper resolution
declare module "jose" {
  export * from "https://esm.sh/jose@5.2.3";
}

// Global Deno namespace enhancement
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
      toObject(): Record<string, string>;
    }
    
    const env: Env;
    
    interface ServeHandlerInfo {
      remoteAddr: { hostname: string; port: number; transport: string };
    }
    
    interface ServeOptions {
      port?: number;
      hostname?: string;
      signal?: AbortSignal;
    }
    
    function serve(
      handler: (request: Request, info?: ServeHandlerInfo) => Response | Promise<Response>,
      options?: ServeOptions
    ): Promise<void>;
    
    // Crypto API
    const crypto: {
      randomUUID(): string;
      getRandomValues<T extends ArrayBufferView>(array: T): T;
      subtle: SubtleCrypto;
    };
    
    // File system operations
    function readTextFile(path: string): Promise<string>;
    function writeTextFile(path: string, data: string): Promise<void>;
    
    // Process operations
    interface ProcessStatus {
      success: boolean;
      code: number;
      signal?: string;
    }
    
    interface RunOptions {
      cmd: string[];
      stdout?: "inherit" | "piped" | "null";
      stderr?: "inherit" | "piped" | "null";
      stdin?: "inherit" | "piped" | "null";
      env?: Record<string, string>;
      cwd?: string;
    }
    
    function run(options: RunOptions): Process;
    
    interface Process {
      status(): Promise<ProcessStatus>;
      output(): Promise<Uint8Array>;
      stderrOutput(): Promise<Uint8Array>;
      close(): void;
    }
  }

  // Enhanced Response interface with all necessary properties
  interface Response {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly headers: Headers;
    readonly body: ReadableStream<Uint8Array> | null;
    readonly bodyUsed: boolean;
    readonly url: string;
    readonly redirected: boolean;
    readonly type: ResponseType;
    
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    json(): Promise<any>;
    text(): Promise<string>;
    clone(): Response;
  }

  // Response constructor
  interface ResponseConstructor {
    new(body?: BodyInit | null, init?: ResponseInit): Response;
    error(): Response;
    redirect(url: string, status?: number): Response;
  }
  
  declare const Response: ResponseConstructor;

  // Response type enum
  type ResponseType = "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";

  // Response init interface
  interface ResponseInit {
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  }

  // Headers interface enhancement
  interface Headers {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
    entries(): IterableIterator<[string, string]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    [Symbol.iterator](): IterableIterator<[string, string]>;
  }

  // Headers constructor
  interface HeadersConstructor {
    new(init?: HeadersInit): Headers;
  }
  
  declare const Headers: HeadersConstructor;
  
  type HeadersInit = Headers | Record<string, string> | Iterable<readonly [string, string]> | ReadonlyArray<readonly [string, string]>;

  // Request interface enhancement
  interface Request {
    readonly method: string;
    readonly url: string;
    readonly headers: Headers;
    readonly body: ReadableStream<Uint8Array> | null;
    readonly bodyUsed: boolean;
    readonly cache: RequestCache;
    readonly credentials: RequestCredentials;
    readonly destination: RequestDestination;
    readonly integrity: string;
    readonly keepalive: boolean;
    readonly mode: RequestMode;
    readonly redirect: RequestRedirect;
    readonly referrer: string;
    readonly referrerPolicy: ReferrerPolicy;
    readonly signal: AbortSignal;
    
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    json(): Promise<any>;
    text(): Promise<string>;
    clone(): Request;
  }

  // Body init type
  type BodyInit = ArrayBuffer | ArrayBufferView | Blob | FormData | ReadableStream | URLSearchParams | string;

  // URL API
  interface URL {
    hash: string;
    host: string;
    hostname: string;
    href: string;
    origin: string;
    password: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    searchParams: URLSearchParams;
    username: string;
    
    toString(): string;
    toJSON(): string;
  }

  interface URLConstructor {
    new(url: string, base?: string | URL): URL;
  }

  declare const URL: URLConstructor;

  // URLSearchParams API
  interface URLSearchParams {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    getAll(name: string): string[];
    has(name: string): boolean;
    set(name: string, value: string): void;
    sort(): void;
    toString(): string;
    forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void;
    entries(): IterableIterator<[string, string]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string>;
    [Symbol.iterator](): IterableIterator<[string, string]>;
  }

  interface URLSearchParamsConstructor {
    new(init?: string | URLSearchParams | Record<string, string> | Iterable<readonly [string, string]> | ReadonlyArray<readonly [string, string]>): URLSearchParams;
  }

  declare const URLSearchParams: URLSearchParamsConstructor;
}

export {};