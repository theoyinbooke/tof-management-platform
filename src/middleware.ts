import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/accept-invitation(.*)",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  
  // Explicitly allow accept-invitation routes
  if (pathname.startsWith('/accept-invitation')) {
    console.log(`[MIDDLEWARE] Allowing accept-invitation route: ${pathname}`);
    return;
  }
  
  // Debug logging
  console.log(`[MIDDLEWARE] ${pathname} - isPublic: ${isPublicRoute(req)}`);
  
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    console.log(`[MIDDLEWARE] Protecting route: ${pathname}`);
    await auth.protect();
  } else {
    console.log(`[MIDDLEWARE] Public route allowed: ${pathname}`);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};