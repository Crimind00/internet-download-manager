# Internet Download Manager Clone

A modern, web-based Internet Download Manager (IDM) clone built with React and Express.js, featuring real-time download progress tracking, queue management, and a clean user interface.

## Features

- **Download Queue Management** - Add, pause, resume, and cancel downloads
- **Real-time Progress Tracking** - Live updates via WebSocket connections
- **File Type Categorization** - Automatic categorization (videos, images, documents, archives)
- **Status Filtering** - Filter downloads by status (active, paused, completed, failed)
- **Speed Monitoring** - Live download speed meter with average and peak speeds
- **Modern UI** - Clean, responsive interface built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Wouter (routing)
- **Backend**: Express.js, TypeScript, WebSocket (ws)
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd internet-download-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5000`

## Usage

1. **Add a Download**: Paste a URL in the sidebar input field and click "Add Download"
2. **Monitor Progress**: Watch real-time download progress in the main area
3. **Control Downloads**: Use pause/resume/cancel buttons on individual downloads
4. **Filter Downloads**: Use the sidebar categories to filter by status or file type
5. **View Speed**: Check the live speed meter for current download speeds

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Page components
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # In-memory storage
│   └── vite.ts            # Vite integration
├── shared/                # Shared types and schemas
└── package.json
```

## API Endpoints

- `GET /api/downloads` - Get all downloads
- `POST /api/downloads` - Create new download
- `PATCH /api/downloads/:id` - Update download status
- `DELETE /api/downloads/:id` - Delete download
- `POST /api/downloads/:id/retry` - Retry failed download

## WebSocket Events

- `download_created` - New download added
- `download_updated` - Download status changed
- `download_progress` - Download progress update
- `download_completed` - Download finished
- `download_failed` - Download failed
- `download_deleted` - Download removed

## Development

The application uses in-memory storage for simplicity. In a production environment, you would want to:

- Implement persistent storage (database)
- Add user authentication
- Implement actual file downloading to local filesystem
- Add download scheduling and bandwidth management
- Include virus scanning and file verification

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with modern web technologies
- UI components from shadcn/ui
- Icons from Lucide React
- Inspired by Internet Download Manager (IDM)