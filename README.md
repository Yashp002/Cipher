# Cipher Voice Assistant

A modern voice assistant application built with React and Vite.

## Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (comes with Node.js)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cipher_voice_assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the `.env.example` file to create your own `.env.local`:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your actual API keys:

```
# Convex Backend Configuration
CONVEX_DEPLOY_KEY=your_convex_deploy_key_here
CONVEX_DEPLOYMENT=your_convex_deployment_here
VITE_CONVEX_URL=your_convex_url_here

# Gemini AI API Key
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: Never commit your `.env.local` file to Git. It's already in `.gitignore` to keep your API keys safe.

### 4. Fix PowerShell Execution Policy (Windows Only)

If you're on Windows and encounter a script execution error, run this command in PowerShell:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

This allows locally created scripts to run on your machine.

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

The application will automatically open in your default browser. If it doesn't, navigate to the URL shown in the
terminal (typically `http://localhost:5173`).

## Available Scripts

- `npm run dev` - Starts both frontend and backend development servers
- `npm run dev:frontend` - Starts only the Vite frontend server
- `npm run dev:backend` - Starts only the backend server
- `npm run build` - Builds the application for production
- `npm run lint` - Runs linting and type checking

## Project Structure

```
cipher_voice_assistant/
├── src/              # Frontend React application
├── convex/           # Backend server code
├── public/           # Static assets
├── index.html        # Entry HTML file
└── vite.config.ts    # Vite configuration
```

## Troubleshooting

### Windows PowerShell Script Execution Error

If you see an error like "cannot be loaded because running scripts is disabled", follow Step 4 above.

### Port Already in Use

If the default port is already in use, you can specify a different port:

```bash
npm run dev:frontend -- --port 3000
```

### Module Not Found Errors

Make sure all dependencies are installed:

```bash
npm install
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License.
