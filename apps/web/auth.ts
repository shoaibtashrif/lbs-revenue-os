import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials)

        if (!parsed.success) return null

        // In production: query Postgres, verify bcrypt hash
        // const { prisma } = await import('@lbs/db')
        // const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
        // if (!user) return null
        // const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        // if (!valid) return null
        // return { id: user.id, name: user.name, email: user.email, role: user.role }

        // Dev mock — REMOVE before production
        if (
          parsed.data.email === 'admin@lbsdist.com' &&
          parsed.data.password === 'changeme-in-production'
        ) {
          return {
            id: 'mock-admin',
            name: 'Ross Haley',
            email: 'admin@lbsdist.com',
            role: 'FULL',
          } as { id: string; name: string; email: string; role: string }
        }

        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/desk/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-me-in-production',
}

export default NextAuth(authOptions)
