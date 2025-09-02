import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createHash } from 'crypto';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const emailHash = session.user.email.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
        const emailHex = createHash('md5').update(session.user.email.toLowerCase()).digest('hex').substring(0, 12);
        const userId = `${emailHash}_${emailHex}`;
        
        session.user = {
          ...session.user,
          id: userId,
          emailVerified: true,
        };
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };