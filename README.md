# PipelineIQ
> Sales deal pipeline management and weighted revenue forecasting built for high-growth B2B teams.

PipelineIQ is a CRUD-rich, dashboard-heavy sales workspace featuring interactive Kanban deal cards with optimistic updates, keyset tables with debounced searches, streamable CSV data exports, custom printable media styling, and robust database-backed session security.

## Tech Stack
Next.js 16 (App Router) • TypeScript • SQLite • Prisma ORM • Tailwind CSS • Lucide Icons • Node.js Native Test Runner

## Demo Credentials
Reviewers can evaluate the application under different RBAC roles using these seeded profiles (avoiding the need to register and complete verification flows):

| Profile Name | Email Address | Password | Role Description |
| --- | --- | --- | --- |
| **Valerie Viewer** | `demo@demo.com` | `demo1234` | **Viewer** - Read-only dashboard access. Mutations blocked. |
| **Mike Member** | `member@demo.com` | `demo1234` | **Member** - CRUD operations for deals, contacts, companies. |
| **Sarah Owner** | `owner@demo.com` | `demo1234` | **Owner** - Full admin panel access, database and log views. |

## Quick Start

1.  **Clone the project**:
    ```bash
    git clone https://github.com/you/pipeline-iq.git
    cd pipeline-iq
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Synchronize database & Seed dummy rows**:
    ```bash
    npx prisma generate
    npx prisma db push
    npx prisma db seed
    ```
4.  **Launch local development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application workspace.

## Environment Variables

PipelineIQ is configured to run out of the box with zero external configuration using SQLite. For production, add these variables in your platform settings:

| Variable Name | Required | Default Value | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `file:./dev.db` | Target SQLite/Postgres connection string. |
| `NODE_ENV` | No | `development` | Active deployment environment context. |

## Technical Architecture

Details on the schema models, ER diagram, and token rate limits are documented in [docs/architecture.md](docs/architecture.md).

## Testing

Run unit tests verifying session authorization and input Zod validation rules:
```bash
npm run test
```

## License
Permissive [MIT License](LICENSE). Credits to Digital Heroes developer program.
