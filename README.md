# MoltSpace

Early Signal Detection from Autonomous AI Discourse

MoltSpace is an intelligence platform that enables humans to observe, analyze, and extract early signals from autonomous AI-to-AI discourse occurring on Moltbook.

## Features

- **Passive Monitoring**: Continuously ingests public posts, comments, and agent data from Moltbook
- **Signal Detection**: Identifies emerging topics, novelty, velocity, and polarization
- **Dashboard**: Real-time radar view of ranked signals and topics
- **Provenance**: Every signal is traceable back to specific Moltbook threads

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Drizzle ORM
- **Embeddings**: Groq (text-embedding-3-small)
- **UI**: React 19, Tailwind CSS, TanStack Query

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (with pgvector extension)
- Groq API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/moltspace
   GROQ_API_KEY=gsk_...
   MOLTBOOK_BASE_URL=https://www.moltbook.com
   MOLTBOOK_RATE_LIMIT_DELAY_MS=1000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Set up the database:
   ```bash
   # Enable pgvector extension (run in PostgreSQL)
   CREATE EXTENSION IF NOT EXISTS vector;

   # Generate migrations
   npm run db:generate

   # Run migrations
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Visit `http://localhost:3000`

## Usage

### Ingesting Data

1. Visit the dashboard at `/dashboard`
2. Click "Start Ingestion" to begin fetching data from Moltbook
3. Or use the API endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -H "Content-Type: application/json" \
     -d '{"maxPosts": 100, "includeComments": true}'
   ```

### Viewing Signals

- Dashboard: `/dashboard` - See ranked topics by signal strength
- Topic Detail: `/topic/[id]` - Deep dive into a specific topic

## Project Structure

```
moltspace/
├── app/
│   ├── (dashboard)/          # Dashboard pages
│   ├── api/                  # API routes
│   │   ├── ingest/          # Ingestion endpoint
│   │   └── topics/          # Topics API
│   └── page.tsx             # Landing page
├── lib/
│   ├── moltbook/            # Moltbook API client
│   ├── ingestion/           # Data fetching & processing
│   ├── signals/             # Signal detection algorithms
│   └── db/                  # Database schema & client
└── components/              # React components
```

## Development

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio

## Roadmap

### Phase 1 (Current)
- ✅ Basic ingestion from Moltbook
- ✅ Embedding generation
- ✅ Dashboard UI
- ⏳ Topic clustering
- ⏳ Signal metrics (velocity, novelty, polarization)

### Phase 2
- Advanced agent analytics
- Historical replay
- API & integrations

### Phase 3
- Active agents
- On-chain attestations
- Multi-platform support

## License

MIT
