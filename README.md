# Preview Viewer

A React + Vite application for triggering preview builds of GitHub repositories.

## Features

- Select repositories from your GitHub organization
- Choose branches for preview builds
- Trigger preview deployments
- View build status and preview URLs

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GITHUB_ORG=your-org-name
VITE_API_BASE_URL=https://preview-backend.ienetworks.co
```

Create a `.env` file in the `server/` directory:

```env
GITHUB_ORG=your-org-name
GITHUB_TOKEN=your-github-token
PORT=4000
```

**Note:** Copy the example files (`env.example` and `server/env.example`) and rename them to `.env`, then update the values with your actual GitHub organization and token.

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 3. Start the Application

```bash
# Option 1: Start both frontend and backend together
npm run dev:full

# Option 2: Start them separately
# Terminal 1 - Backend server (in server directory)
cd server
npm run dev

# Terminal 2 - Frontend (in root directory)
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `https://preview-backend.ienetworks.co`.

## Development

- Frontend: React + Vite with Tailwind CSS
- Backend: Express.js with GitHub API integration
- API proxy configured for development

## API Endpoints

- `GET /api/github/repos` - Fetch repositories from GitHub organization
- `GET /api/github/branches?repo=<repo>&org=<org>` - Fetch branches for a repository
- `POST /api/trigger-build` - Trigger a preview build
- `GET /api/build-status/:buildId` - Check build status
