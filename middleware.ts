
   Creating an optimized production build ...
Failed to compile.

./middleware.ts
Error: 
  x the name `createServerClient` is defined multiple times
    ,-[/var/www/numalex/middleware.ts:9:1]
  9 | // 5. Nonce CSP pour scripts inline
 10 | // ============================================================
 11 | 
 12 | import { createServerClient } from '@supabase/ssr';
    :          ^^^^^^^^^|^^^^^^^^
    :                   `-- previous definition of `createServerClient` here
 13 |  import { createServerClient, type CookieOptions } from '@supabase/ssr'
    :           ^^^^^^^^^|^^^^^^^^
    :                    `-- `createServerClient` redefined here
 14 | 
 15 | // ─── Configuration ───
    `----


> Build failed because of webpack errors
root@srv1340337:/var/www/numalex# 
