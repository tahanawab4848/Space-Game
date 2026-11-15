# MARS: THE LAST FRONTIER

An educational Mars outpost strategy game built with React, TypeScript, Vite, Tailwind CSS, Three.js, React Three Fiber, Zustand, GSAP, Recharts, dnd-kit, Lucide, and shadcn-style UI primitives.

## Run locally

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite app and the small Node mentor API. It opens the mission-control landing experience at `http://127.0.0.1:5173`; the original construction and 30-sol simulation experience is available through each mission briefing.

## Included experiences

- Animated Three.js Mars landing screen and mission-control navigation
- Mission selection and briefing flow with sample mission data
- Existing construction bay, AI Engineering Mentor, simulation, and mission debrief
- Blueprint library plus settings and guided tutorial

## Enable AI Mentor replies

Copy `.env.example` to `.env` and add your key to `OPENAI_API_KEY`. The key is read only by `server/index.js`; it is never included in frontend code or sent to the browser. `OPENAI_MODEL` can select another Responses API model. The default is `gpt-6-luna`.

The mentor receives only a compact game-state snapshot and the player's question. It does not receive account details and cannot change the base. Requests use the OpenAI Responses API with response storage disabled. If the API is unavailable, the server and browser both fall back to local educational answers.

For deployment, host the Node API server and configure the web host to reverse-proxy `/api/mentor` and `/api/mentor/status` to it. Keep `OPENAI_API_KEY` in the hosting provider's server-side environment settings.

## Production build

```bash
npm run build
npm run preview
```
