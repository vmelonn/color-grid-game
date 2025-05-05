# ColorGrid Client

A React-based client for the ColorGrid game, a 2-player turn-based color conquest game.

## Features

- User authentication (login/signup)
- Real-time game updates using WebSocket
- Game history and statistics
- Leaderboard
- Profile management

## Tech Stack

- React 18
- TypeScript
- React Router v6
- Socket.IO Client
- Axios
- Vite

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── contexts/      # React context providers
  ├── pages/         # Page components
  ├── utils/         # Utility functions
  ├── types.ts       # TypeScript type definitions
  ├── App.tsx        # Main application component
  └── main.tsx       # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_URL=http://localhost:8000
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

MIT
