import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "session"; 
const AUTH_ONLY_ROUTES = ["/login", "/register", "/verify-otp"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const isAuthRoute = AUTH_ONLY_ROUTES.includes(req.nextUrl.pathname);

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/verify-otp"],
};