import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/translate", "/history"];

// Check for session cookie directly — avoids edge runtime issues with Prisma adapter
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    // NextAuth v5 session cookie names
    const sessionCookie =
      req.cookies.get("authjs.session-token") ??
      req.cookies.get("__Secure-authjs.session-token");

    if (!sessionCookie) {
      const signInUrl = new URL("/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
