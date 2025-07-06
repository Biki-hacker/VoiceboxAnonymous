# VoiceBox Anonymous Frontend

This is the frontend web application for VoiceBox Anonymous, providing a secure and user-friendly interface for anonymous communication and collaboration within organizations.

## Features
- Modern, responsive UI
- Secure authentication and session management
- Real-time updates and notifications
- Media uploads and rich content support
- Theming and accessibility options

## Tech Stack
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/)
- [Supabase](https://supabase.com/)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

### Running the Development Server

```sh
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Building for Production

```sh
npm run build
# or
yarn build
```

### Linting & Formatting

```sh
npm run lint
# or
yarn lint
```

## Environment Variables

Create a `.env` file in the `frontend` directory. Example variables:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000
```

> **Note:** Never commit sensitive credentials to version control.

## Scripts
- `dev` – Start the development server
- `build` – Build the app for production
- `preview` – Preview the production build
- `lint` – Run ESLint

© Souvik Dhara
