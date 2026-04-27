import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import db from '@/lib/db';
import type { Adapter } from 'next-auth/adapters';

// Minimal SQLite adapter for NextAuth v5
function SQLiteAdapter(): Adapter {
  return {
    async createUser(user) {
      const id = crypto.randomUUID();
      db.prepare(
        'INSERT INTO users (id, name, email, image) VALUES (?, ?, ?, ?)'
      ).run(id, user.name ?? null, user.email, user.image ?? null);
      return { ...user, id };
    },
    async getUser(id) {
      return (db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any) ?? null;
    },
    async getUserByEmail(email) {
      return (db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any) ?? null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      return (db.prepare(
        'SELECT u.* FROM users u JOIN accounts a ON u.id = a.user_id WHERE a.provider = ? AND a.provider_account_id = ?'
      ).get(provider, providerAccountId) as any) ?? null;
    },
    async updateUser(user) {
      db.prepare('UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?')
        .run(user.name ?? null, user.email, user.image ?? null, user.id);
      return user as any;
    },
    async linkAccount(account) {
      const id = crypto.randomUUID();
      db.prepare(
        'INSERT OR REPLACE INTO accounts (id, user_id, provider, provider_account_id, access_token, refresh_token, expires_at, token_type, scope, id_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, account.userId, account.provider, account.providerAccountId,
        account.access_token ?? null, account.refresh_token ?? null,
        account.expires_at ?? null, account.token_type ?? null,
        account.scope ?? null, account.id_token ?? null);
    },
    async createSession(session) {
      const id = crypto.randomUUID();
      db.prepare(
        'INSERT INTO sessions (id, session_token, user_id, expires) VALUES (?, ?, ?, ?)'
      ).run(id, session.sessionToken, session.userId, session.expires.toISOString());
      return session;
    },
    async getSessionAndUser(sessionToken) {
      const row = db.prepare(
        'SELECT s.*, u.id as uid, u.name, u.email, u.image, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = ? AND s.expires > datetime("now")'
      ).get(sessionToken) as any;
      if (!row) return null;
      return {
        session: { sessionToken: row.session_token, userId: row.user_id, expires: new Date(row.expires) },
        user: { id: row.uid, name: row.name, email: row.email, image: row.image, role: row.role, emailVerified: null },
      };
    },
    async updateSession(session) {
      db.prepare('UPDATE sessions SET expires = ? WHERE session_token = ?')
        .run(session.expires?.toISOString(), session.sessionToken);
      return session as any;
    },
    async deleteSession(sessionToken) {
      db.prepare('DELETE FROM sessions WHERE session_token = ?').run(sessionToken);
    },
    async createVerificationToken(token) {
      db.prepare(
        'INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)'
      ).run(token.identifier, token.token, token.expires.toISOString());
      return token;
    },
    async useVerificationToken({ identifier, token }) {
      const row = db.prepare(
        'SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?'
      ).get(identifier, token) as any;
      if (!row) return null;
      db.prepare('DELETE FROM verification_tokens WHERE identifier = ? AND token = ?')
        .run(identifier, token);
      return { ...row, expires: new Date(row.expires) };
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: SQLiteAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = db.prepare('SELECT * FROM users WHERE email = ?')
          .get(credentials.email) as any;
        if (!user || !user.password) return null;
        const valid = await compare(credentials.password as string, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as any).id = user.id;
        (session.user as any).role = (user as any).role;
      }
      return session;
    },
  },
});
