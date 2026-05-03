import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import sql from '@/lib/db';
import type { Adapter } from 'next-auth/adapters';

function rowToUser(row: any) {
  return { ...row, emailVerified: row.email_verified ?? null } as any;
}

// Minimal Postgres adapter for NextAuth v5
function PostgresAdapter(): Adapter {
  return {
    async createUser(user) {
      const id = crypto.randomUUID();
      // Auto-created OAuth users are blocked until an admin pre-adds their email
      await sql`
        INSERT INTO users (id, name, email, email_verified, image, role)
        VALUES (${id}, ${user.name ?? null}, ${user.email ?? ''}, ${user.emailVerified ?? null}, ${user.image ?? null}, 'blocked')
      `;
      return { ...user, id } as any;
    },

    async getUser(id) {
      const [row] = await sql`SELECT * FROM users WHERE id = ${id}`;
      if (!row) return null;
      return rowToUser(row);
    },

    async getUserByEmail(email) {
      const [row] = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (!row) return null;
      return rowToUser(row);
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const [row] = await sql`
        SELECT u.* FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `;
      if (!row) return null;
      return rowToUser(row);
    },

    async updateUser(user) {
      await sql`
        UPDATE users
        SET name = ${user.name ?? null},
            email = ${user.email ?? ''},
            email_verified = ${(user.emailVerified as Date | null) ?? null},
            image = ${user.image ?? null}
        WHERE id = ${user.id}
      `;
      const [row] = await sql`SELECT * FROM users WHERE id = ${user.id}`;
      return rowToUser(row);
    },

    async linkAccount(account) {
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO accounts (id, user_id, provider, provider_account_id,
          access_token, refresh_token, expires_at, token_type, scope, id_token)
        VALUES (
          ${id}, ${account.userId}, ${account.provider}, ${account.providerAccountId},
          ${account.access_token ?? null}, ${account.refresh_token ?? null},
          ${account.expires_at ?? null}, ${account.token_type ?? null},
          ${account.scope ?? null}, ${account.id_token ?? null}
        )
        ON CONFLICT (provider, provider_account_id) DO UPDATE SET
          access_token  = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at    = EXCLUDED.expires_at,
          token_type    = EXCLUDED.token_type,
          scope         = EXCLUDED.scope,
          id_token      = EXCLUDED.id_token
      `;
      return account;
    },

    async createSession(session) {
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO sessions (id, session_token, user_id, expires)
        VALUES (${id}, ${session.sessionToken}, ${session.userId}, ${session.expires})
      `;
      return session;
    },

    async getSessionAndUser(sessionToken) {
      const [row] = await sql`
        SELECT s.*, u.id AS uid, u.name, u.email, u.image, u.role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken} AND s.expires > NOW()
      `;
      if (!row) return null;
      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id,
          expires: row.expires,
        },
        user: {
          id: row.uid,
          name: row.name,
          email: row.email,
          image: row.image,
          role: row.role,
          emailVerified: null,
        },
      } as any;
    },

    async updateSession(session) {
      await sql`
        UPDATE sessions SET expires = ${session.expires ?? new Date()}
        WHERE session_token = ${session.sessionToken}
      `;
      return session as any;
    },

    async deleteSession(sessionToken) {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    },

    async createVerificationToken(token) {
      await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${token.identifier}, ${token.token}, ${token.expires})
      `;
      return token;
    },

    async useVerificationToken({ identifier, token }) {
      const [row] = await sql`
        DELETE FROM verification_tokens
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING *
      `;
      if (!row) return null;
      return { identifier: row.identifier, token: row.token, expires: row.expires } as any;
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const [user] = await sql`SELECT * FROM users WHERE email = ${credentials.email as string}`;
        if (!user || !user.password) return null;
        const valid = await compare(credentials.password as string, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      const [row] = await sql`SELECT role FROM users WHERE email = ${user.email}`;
      // Block anyone not pre-added, or who was auto-created (role = 'blocked')
      if (!row || row.role === 'blocked') return '/login?error=NotWhitelisted';
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const [dbUser] = await sql`SELECT role FROM users WHERE id = ${user.id as string}`;
        token.role = dbUser?.role ?? 'dearest';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
