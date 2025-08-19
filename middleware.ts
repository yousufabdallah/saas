import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/server';

export function middleware(req: NextRequest) {
  // Handle authentication
  const { supabase, response } = createMiddlewareClient(req);
  
  const host = req.headers.get('host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  
  // Extract subdomain: myshop.your-domain.com => subdomain = 'myshop'
  const parts = host.split('.');
  const subdomain = isLocal ? '' : (parts.length > 2 ? parts[0] : '');

  // Store subdomain in custom header for server components to read
  if (subdomain && subdomain !== 'www') {
    response.headers.set('x-store-subdomain', subdomain);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}