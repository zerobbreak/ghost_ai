import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const publicRoutePatterns = [
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/__clerk(.*)",
  "/api/liveblocks-auth",
];

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim();
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim();
if (signInUrl) publicRoutePatterns.push(`${signInUrl}(.*)`);
if (signUpUrl) publicRoutePatterns.push(`${signUpUrl}(.*)`);

const isPublicRoute = createRouteMatcher(publicRoutePatterns);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
