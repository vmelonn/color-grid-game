# ColorGrid Game

A 2-player, turn-based strategy web game where players compete to claim the largest territory on a 5x5 grid by strategically placing their colors.

## Objective

The goal is to have the largest connected area (or "island") of your color on the 5x5 grid when the grid is completely filled. The player with the largest island wins.

## Key Features

*   **User Authentication:** Secure Sign up and Login using JWT (JSON Web Tokens).
*   **Real-time Matchmaking:** Players can enter a waiting room to be automatically matched with an opponent.
*   **Real-time Gameplay:** Turn-based gameplay updates are communicated instantly between players using Socket.IO.
*   **Win Condition:** Game automatically determines the winner based on the largest connected area of color upon grid completion.
*   **Coin System:** Players earn coins for winning and lose coins for losing.
*   **Game History:** Users can view their past game results and details.
*   **Leaderboard:** Displays top players ranked by wins (searchable by username).
*   **User Profiles:** Users can view and update their username, password, and profile picture URL.
*   **Forfeit Option:** Players can forfeit an ongoing game.
*   **Play Again:** Option to quickly join matchmaking for a new game after one finishes.

## Tech Stack

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite (Build Tool)
    *   Socket.IO Client
    *   Axios
    *   CSS
*   **Backend:**
    *   Node.js
    *   Express.js
    *   MongoDB (with Mongoose ODM)
    *   Socket.IO
    *   JSON Web Token (JWT) for authentication
    *   bcryptjs for password hashing
    *   dotenv for environment variables

## Setup and Installation

**Prerequisites:**

*   Node.js (v16 or later recommended)
*   npm or yarn
*   MongoDB instance (local installation or a cloud service like MongoDB Atlas)

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd a3-vmelonn
    ```

2.  **Setup Backend:**
    *   Navigate to the server directory:
        ```bash
        cd server
        ```
    *   Install dependencies:
        ```bash
        npm install
        # or: yarn install
        ```
    *   Create a `.env` file in the `server` directory (you can copy `config.env` if it exists, but `.env` is standard). Add the following environment variables:
        ```dotenv
        DATABASE_URL=mongodb://localhost:27017/colorgrid # Or your MongoDB Atlas connection string
        JWT_SECRET=yoursecretjwthere # Replace with a strong, unique secret
        PORT=3001 # Optional: Server defaults to this port if not set
        ```
        *Replace placeholder values with your actual MongoDB connection string and a secure JWT secret.* 

3.  **Setup Frontend:**
    *   Navigate to the client directory:
        ```bash
        cd ../client
        ```
    *   Install dependencies:
        ```bash
        npm install
        # or: yarn install
        ```

## Running the Application

1.  **Start the Backend Server:**
    *   From the `a3-vmelonn/server` directory, run:
        ```bash
        npm run dev
        # or: yarn dev
        ```
    *   The server should start, typically on port 3001 (or the port specified in your `.env`).

2.  **Start the Frontend Development Server:**
    *   From the `a3-vmelonn/client` directory, run:
        ```bash
        npm run dev
        # or: yarn dev
        ```
    *   Vite will start the development server, usually at `http://localhost:5173`.

3.  **Open the Application:**
    *   Open your web browser and navigate to `http://localhost:5173` (or the URL provided by Vite).

Now you can sign up, log in, and play the game!
