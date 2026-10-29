# Awlad Gamal website

## Deploy on Vercel

The site uses Vercel Functions for its admin API and Vercel Blob for shared content and product images. A static Vite preview does not provide persistent editing.

1. In the Vercel project `gamal`, create a **public Blob store** and connect it to all deployment environments. Product photos and the public site content are intentionally readable by visitors.
2. Add these environment variables in **Project Settings → Environment Variables** for Production, Preview, and Development:
   - `ADMIN_USERNAME`: the admin login name.
   - `ADMIN_PASSWORD`: a unique password with at least 16 characters. Do not reuse a password or put it in source control.
   - `ADMIN_SESSION_SECRET`: a random secret with at least 32 characters. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
   - `BLOB_READ_WRITE_TOKEN`: added automatically when the Blob store is connected to this project.
3. Redeploy after creating the store and setting the variables.
4. Open **دخول الإدارة** at the bottom of the site. Edits are saved to Blob and shared with all visitors.

The login API rejects passwords shorter than 16 characters. Admin sessions use an HttpOnly, SameSite cookie and expire after eight hours. Do not send admin passwords or storage tokens in chat or commit them to the repository.

## Development

- `npm run dev` starts the Vite frontend with the built-in catalog defaults.
- `npm run build` type-checks the frontend and Vercel API functions, then builds the site.
- Use `vercel dev` with the project's environment variables to test the admin API locally.
