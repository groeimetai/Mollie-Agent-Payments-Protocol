import createMollieClient from '@mollie/api-client';

let _client: ReturnType<typeof createMollieClient> | null = null;

export function getMollieClient() {
  if (!_client) {
    _client = createMollieClient({
      apiKey: process.env.MOLLIE_API_KEY!,
    });
  }
  return _client;
}

// Keep backward compat as a getter
export const mollieClient = new Proxy({} as ReturnType<typeof createMollieClient>, {
  get(_target, prop) {
    return (getMollieClient() as Record<string | symbol, unknown>)[prop];
  },
});
