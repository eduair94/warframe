import { Request, Response } from "express";

export interface rFunctionExpress {
  error: string;
  success: any;
}

export interface FunctionExpress {
  (req: Request,res?: Response): Promise<rFunctionExpress>;
  
}

export interface FunctionExpressRes {
  (req: Request, res: Response): Promise<rFunctionExpress>;
}

/**
 * The verified Firebase identity the auth wrappers attach to the request.
 * Mirrors services/firebaseToken's VerifiedUser without importing it here
 * (this file is the transport-layer contract and stays dependency-free).
 */
export interface AuthedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  provider: string | null;
}

export type AuthedRequest = Request & { user: AuthedUser };

/** Handler signature for getJsonAuth / postJsonAuth. */
export interface FunctionExpressAuth {
  (req: AuthedRequest, res?: Response): Promise<any>;
}
