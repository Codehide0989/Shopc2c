# ShopC2C - E-Commerce Platform

A modern, full-stack e-commerce application built with React, Node.js, Express, MongoDB, and Socket.io.

## Features

- **Real-time Global Chat**: Connect with other users instantly using Socket.io.
- **Admin Dashboard**: Manage products, categories, users, and settings.
- **User Authentication**: Register and login securely.
- **Dynamic Product Catalog**: Browse products and categories fetched from MongoDB.
- **Real-time Reviews**: Post and view reviews instantly.
- **Responsive Design**: Optimized for all devices.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB (Mongoose)

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB connection string

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd shopc2c
    ```

2.  **Setup Backend**
    ```bash
    cd server
    npm install
    ```
    - Create a `.env` file in `server/` with:
      ```env
      MONGODB_URI=your_mongodb_connection_string
      PORT=5000
      ```
    - Seed the database (optional, for initial data):
      ```bash
      node seed.js
      ```
    - Start the server:
      ```bash
      npm start
      ```

3.  **Setup Frontend**
    - Open a new terminal in the root `shopc2c` directory.
    ```bash
    npm install
    ```
    - Start the development server:
      ```bash
      npm run dev
      ```

4.  **Access the App**
    - Open `http://localhost:5173` in your browser.

## Admin Access

- **Default Admin**:
    - Username: `admin`
    - Password: `admin123`
- Access the admin dashboard via the user menu after logging in.

## Project Structure

- `src/`: Frontend React application
- `server/`: Backend Node.js application
- `server/models/`: Mongoose schemas
- `src/services/db.ts`: Data adapter for API calls

## License

MIT
