import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: string;
      status: string;
      isGlobalAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    organizationId: string;
    role: string;
    status: string;
    isGlobalAdmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    organizationId: string;
    role: string;
    status: string;
    isGlobalAdmin: boolean;
  }
}
