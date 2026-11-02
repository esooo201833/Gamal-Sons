# Awlad Gamal website

## Hosting and backend

Vercel hosts only the static Vite website. Supabase provides the site-content database, public product-image storage, and the admin API through an Edge Function. No Vercel Functions or Blob access are needed.

### Supabase setup

1. Create a Supabase project and install the Supabase CLI.
2. Link this repository to the project, apply the database migration, and deploy the Edge Function:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   supabase functions deploy admin-api
   ```

   The function disables Supabase JWT verification because it authenticates the admin with its own short-lived signed session. Database and Storage access remain server-side using the Supabase service-role key.
3. Configure these Edge Function secrets in Supabase:
   - `ADMIN_USERNAME`: the admin login name.
   - `ADMIN_PASSWORD`: a unique password of at least 16 characters.
   - `ADMIN_SESSION_SECRET`: a random secret of at least 32 characters.
   - `ALLOWED_ORIGINS`: comma-separated exact origins allowed to call the function, such as the production Vercel URL and `http://localhost:5173`. Add the custom domain and any preview origins you use.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by the Supabase Edge Function runtime. Never expose the service-role key in the browser or Vercel.

   On Windows PowerShell, copy `.env.supabase.example` to `.env.supabase`, replace its example credentials, generate a session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`, then run:

   ```sh
   supabase secrets set --env-file .env.supabase
   ```

   `.env.supabase` is git-ignored. Keep it private and do not send its values in chat.
4. Set the following **Vite build-time** variables in the Vercel project for Production and any Preview branches you use, then redeploy:
   - `VITE_SUPABASE_URL`: the Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key. This public key is safe to include in the site; the database has no anonymous write policy.
5. Apply the migrations before deploying the Edge Function. Open **دخول الإدارة** at the bottom of the site. Product images go to the public `site-assets` bucket, and saved content goes to the `site_content` table.
6. To change the admin username and password later, sign in and open **إعدادات الحساب**. The update requires the current password and a new password of at least 16 characters. The new password is stored as a salted PBKDF2 hash in the private `admin_credentials` table, and other active sessions are invalidated; the initial login continues to use the `ADMIN_USERNAME` and `ADMIN_PASSWORD` secrets until the first successful account change.

The migration creates a public image bucket and a private-to-the-Edge-Function content table. Product images are public because visitors and WhatsApp need to load them. Admin sessions last eight hours and are kept in the current browser tab.

The existing Vercel Blob store exceeded its Hobby advanced-operation allowance and is currently suspended. Its saved content cannot be fetched while suspended. Existing local/default catalog content remains available; recover any admin-only edits and old image files from Blob after access returns, before treating the Supabase project as a complete data migration.

After confirming the Supabase-backed site and admin work, remove the old `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `BLOB_READ_WRITE_TOKEN` variables from Vercel. Do not remove the Blob store until any needed content and images have been recovered.

### Routes

The public site uses separate routes for `/`, `/about`, `/catalog`, `/latest`, `/reviews`, and `/contact`. Each catalog category has its own `/catalog/:categoryId` route; `vercel.json` rewrites these paths to the static Vite app.

## Development

- Copy `.env.example` to `.env.local` and add the public Supabase URL and publishable/anon key.
- Run `npm run dev` to start Vite. Add `http://localhost:5173` to the Supabase function's `ALLOWED_ORIGINS` secret to use the admin API locally.
- `npm run build` type-checks the frontend and Supabase Edge Function, then builds the static site.
