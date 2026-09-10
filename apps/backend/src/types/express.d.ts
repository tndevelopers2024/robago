// src/types/express.d.ts
import type { UserRole } from "@robago/shared";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                phoneNumber: string;
                role: UserRole;
            };
        }
    }
}

export {};
