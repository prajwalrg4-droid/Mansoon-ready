# Monsoon Ready

A responsive Gemini-powered household monsoon preparedness planner, ready for Vercel.

## Run locally

1. Install the [Vercel CLI](https://vercel.com/docs/cli), then run `vercel dev` in this folder.
2. Set `GEMINI_API_KEY` in `.env.local`:

   ```
   GEMINI_API_KEY=your_google_ai_studio_key
   ```

3. Open the local URL shown by Vercel.

## Deploy

1. Push this folder to a new GitHub repository.
2. Import the repository in Vercel.
3. Add `GEMINI_API_KEY` under **Project Settings → Environment Variables**.
4. Deploy. Vercel detects the static frontend and the `api/generate.js` serverless function automatically.

The API key is used only on the server. It is never shipped to the browser.
