import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieToSet = {
  name: string;
  value: string;
  options?: any;
};

const ACTIVE_PROJECT_COOKIE = 'ch_active_project_id';

function isPublicPath(pathname: string) {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/invites') || // TZ#2: allow accept invite without active project
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') || // existing logic (health, auth callback, etc.)
    pathname.startsWith('/api/webhooks') // TZ#3: webhook endpoint must be public
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1) Basic Next response
  let response = NextResponse.next({ request });

  // 2) Supabase session refresh (если ENV есть)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  const cookiesToSet: CookieToSet[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(newCookies: CookieToSet[]) {
          // сохраняем cookies, чтобы можно было применить и на redirect response
          cookiesToSet.push(...newCookies);

          // и применяем на текущий response
          response = NextResponse.next({ request });
          for (const { name, value, options } of newCookies) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // refresh session / get user
    const { data } = await supabase.auth.getUser();
    const user = data?.user ?? null;

    // 3) Allow public paths
    if (isPublicPath(pathname)) {
      return response;
    }

    // 4) Require auth
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);

      const redirectResponse = NextResponse.redirect(url);
      for (const { name, value, options } of cookiesToSet) {
        redirectResponse.cookies.set(name, value, options);
      }
      return redirectResponse;
    }

    // 5) Require active project cookie
    const activeProjectId = request.cookies.get(ACTIVE_PROJECT_COOKIE)?.value;

    if (!activeProjectId) {
      const url = request.nextUrl.clone();
      url.pathname = '/projects';

      const redirectResponse = NextResponse.redirect(url);
      for (const { name, value, options } of cookiesToSet) {
        redirectResponse.cookies.set(name, value, options);
      }
      return redirectResponse;
    }

    return response;
  }

  // Если ENV Supabase нет — пропускаем без auth-gating (как было в фундаменте)
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
