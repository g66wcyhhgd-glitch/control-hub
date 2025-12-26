// apps/web/middleware.ts
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
    pathname.startsWith('/api')
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

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // refresh session cookies
    await supabase.auth.getUser();
  }

  // 3) Project guard (только для непубличных путей)
  if (!isPublicPath(pathname)) {
    const activeProjectId =
      request.cookies.get(ACTIVE_PROJECT_COOKIE)?.value ?? null;

    if (!activeProjectId) {
      const url = request.nextUrl.clone();
      url.pathname = '/projects';
      url.searchParams.set('need_project', '1');
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
