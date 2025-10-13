/**
 * Jose library type declarations for JWT handling in Deno/Supabase Edge Functions
 */

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

  export function jwtVerify(
    jwt: string,
    key: CryptoKey | Uint8Array,
    options?: any
  ): Promise<{ payload: JWTPayload; protectedHeader: JWTHeaderParameters }>;
}