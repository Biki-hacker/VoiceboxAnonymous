# VoiceBox Anonymous Backend

This is the backend API for VoiceBox Anonymous, responsible for authentication, data management, and integration with third-party services.

## Features
- RESTful API endpoints
- JWT-based authentication and authorization
- Secure password handling
- Email notifications
- Organization and user management
- Integration with Supabase

## Tech Stack
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Supabase](https://supabase.com/)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [nodemailer](https://nodemailer.com/)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Navigate to the backend directory:
   ```sh
   cd backend
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

The API will be available at [http://localhost:5000](http://localhost:5000) by default.

### Building for Production

```sh
npm run build
# or
yarn build
```

## Environment Variables

Create a `.env` file in the `backend` directory. Example variables:

```
PORT=5000
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-jwt-secret
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

> **Note:** Never commit sensitive credentials to version control.

## Scripts
- `dev` – Start the development server with hot reload
- `start` – Start the server
- `lint` – Run ESLint

## Contributing

1. Fork the repository and create a new branch for your feature or bugfix.
2. Follow the existing code style and conventions.
3. Write clear commit messages and update documentation as needed.
4. Submit a pull request for review.

## License

This project is licensed under the MIT License. 