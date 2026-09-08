const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY || '';
}

export function encodeVapidKey(key: string): Uint8Array {
  return Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
