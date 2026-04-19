import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that require a signed-in user. Keep this aligned with `config.matcher`.
 * (Landing `/`, `/sign-in`, `/sign-up` must NOT hit middleware — Clerk’s session
 * handshake on those URLs can chain 307s and grow `redirect_url` forever.)
 */
const isProtectedRoute = createRouteMatcher([
  "/projects(.*)",
  "/project(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(
  (auth, req) => {
    if (isProtectedRoute(req)) {
      auth().protect();
    }
  },
  (req) => ({
    signInUrl: new URL("/sign-in", req.nextUrl.origin).href,
    signUpUrl: new URL("/sign-up", req.nextUrl.origin).href,
  }),
);

export const config = {
  matcher: ["/projects/:path*", "/project/:path*", "/api/:path*"],
};
