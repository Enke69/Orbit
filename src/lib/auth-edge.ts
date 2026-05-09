// Lightweight auth for Edge middleware — only checks session, no providers needed
import NextAuth from "next-auth";

export const { auth: edgeAuth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [], // providers are handled by the main auth.ts, not the middleware
});
