import { headers } from 'next/headers';

export function getCurrentSubdomain(): string | null {
  const headersList = headers();
  return headersList.get('x-store-subdomain');
}

export function generateStoreSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 20) + '-' + Math.random().toString(36).substring(2, 6);
}