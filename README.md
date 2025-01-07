# Rate Limiter Proxy Agent🚀

The Rate Limiting Proxy API is a backend service designed to protect APIs from abuse by enforcing rate limits on incoming requests. It acts as a proxy server, managing and controlling the traffic flow between clients and the API. By leveraging ExpressJs, Redis, Rate Limit Algo including (Token Bucket, rolling_window), PostgreSQL (Supabase), TypeScript, and JWT authentication, it ensures secure access while providing configurable rate limiting strategies. This project helps prevent API overloads and ensures consistent performance by limiting excessive requests, enabling better scalability and security for your applications.

## Technologies Used

- Rest APIs
- TypeScript
- Redis
- PostgreSQL (Supabase)
- Git
- ExpressJS


## Purpose

The Rate Limiting Proxy API project is a middleware server that enforces rate limits on API requests, ensuring protection against excessive traffic. It handles user authentication via JWT, offers scalable rate limiting, and provides real-time monitoring and logging. Built with TypeScript, ExpressJs, Redis, PostgreSQL(Supabase), and Rest API, it acts as a proxy, forwarding requests while managing traffic flow and enforcing rate limits based on configurable rules. The project aims to secure APIs and optimize backend performance.

## How to Start the Project

1. Clone the Repository `git clone https://github.com/ThakurAnkitSingh/rate_limit_agent.git`
2. Install the required dependencies from `node_modules - npm install`.
3. Configure Environment Variables `.env`
4. Start the Application with the command `npm start`.

## Project Structure

```plaintext
Rate_Limit Project/
│
├── .codegpt                 # CodeGPT configuration or related files
├── .env                     # Environment variables for configuration
├── .gitignore               # Git ignore file
├── nodemon.json             # Configuration for Nodemon
├── package-lock.json        # NPM lock file for dependency versions
├── package.json             # NPM package configuration file
├── tsconfig.json            # TypeScript configuration file
│
├── node_modules             # Node.js dependencies
│
├── src/                     # Main source code directory
│   ├── config/              # Configuration files
│   ├── controllers/         # Controller files handling requests
│   │   ├── apiController.ts
│   │   ├── authController.ts
│   │   └── proxyController.ts
│   ├── helper/              # Helper utility functions - you can check whether the project is working. Already there is necessary details you just need to uncomment the code and start the project
│   │   └── checkRateLimiter.ts
│   ├── interfaces/          # TypeScript interfaces
│   │   └── interface.ts
│   ├── middleware/          # Middleware files for request processing
│   │   └── auth.ts
│   ├── routes/              # API route files
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── proxy.ts
│   ├── services/            # Service files for business logic
│   │   ├── apiService.ts
│   │   ├── authService.ts
│   │   └── proxyService.ts
│   ├── utils/               # Utility functions like JWT and rate limiting
│   │   ├── jwt.ts
│   │   └── rateLimit.ts
│   ├── index.ts             # Main entry point of the application
│   └── testSupabase.ts      # Testing file related to Supabase
│
└── ...                      # Other project files or directories

```

## Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ThakurAnkitSingh/rate_limit_agent.git
   ```

2. **Install Dependencies:**
   ```
   npm install or npm i
   ```

3. **Configure Environment Variables:**
   - Create a `.env` file in the root directory (`.env`) and add the necessary environment variables, such as:
     ```
     SUPABASE_URL=SUPABASE_URL
     SUPABASE_ANON_KEY= SUPABASE_ANON_KEY
     REDIS_HOST=REDIS_HOST
     REDIS_PORT=REDIS_PORT
     REDIS_PASSWORD=REDIS_PASSWORD
     REDIS_USERNAME=REDIS_USERNAME
     JWT_SECRET=JWT_SECRET
     ```

5. **Check Project is Working:**
   - **Endpoint:** `/`
   - **Method:** GET
   - **Response:**
     ```
     Rate Limiting Proxy API is running!
     ```

## API Endpoints

1. **Register API Request:**
   - **Endpoint:** `/api/register`
   - **API Curl**
     ```
       curl --location 'http://localhost:5000/api/register' \
      --header 'Content-Type: application/json' \
      --data '{
        "name": "Demo2",
        "baseUrl": "https://jsonplaceholder.typicode.com/posts",
        "rateLimitStrategy": "token_bucket",
        "requestCount": 10,
        "timeWindow": 20
      }'
      ```
   - **Method:** POST
   - **Request Body:**
     ```json
     {
     "name": "Demo2",
     "baseUrl": "https://jsonplaceholder.typicode.com/posts",
     "requestCount": 10,
     "timeWindow": 20
     }
     ```
   - **Response:**
     ```json
     {
         "appId": 5
     }
     ```

2. **Generate API Key:**
   - **Endpoint:** `/api/generate-api-key`
   - **Method:** POST
   - **Curl**
     ```
     curl --location 'http://localhost:5000/api/generate-api-key' \
      --header 'Content-Type: application/json' \
      --data '{
      "appId": 5
     }'
      ```
   - **Request Body:**
     ```json
     {
         "appId": 5
     }
     ```
   - **Response:**
     ```json
     {
         "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6NSwiaWF0IjoxNzM2MjYwMzU4LCJleHAiOjE3MzYyNjM5NTh9.mBEVvUgVyj3X8owdxKCodK7PgyKLgiRv0A_P8JVrpD4",
     }
     ```

3. **Proxy API Results :**
   - **Endpoint:** `/api/proxy/5`
   - **Method:** POST
   - **Curl**
     ```
     curl --location --request POST 'http://localhost:5000/api/proxy/5' \
      --header 'Content-Type: application/json' \
      --header 'x-api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6NSwiaWF0IjoxNzM2MjYwMzU4LCJleHAiOjE3MzYyNjM5NTh9.mBEVvUgVyj3X8owdxKCodK7PgyKLgiRv0A_P8JVrpD4'
      ```
   - **Request Body:**
     ```json
     {}
     ```
   - **Response:**
     ```json
     {
      [
          {
           "userId": 1,
           "id": 1,
           "title": "nesciunt iure omnis dolorem tempora et accusantium",
           "body": "quo et expedita modi cum officia vel magni\ndoloribus qui repudiandae\nvero nisi sit\nquos veniam quod sed accusamus veritatis error"
          },
         {
           "userId": 1,
           "id": 2,
           "title": "nesciunt iure omnis dolorem tempora et accusantium",
           "body": "quo et expedita modi cum officia vel magni\ndoloribus qui repudiandae\nvero nisi sit\nquos veniam quod sed accusamus veritatis error"
          },
         {
           "userId": 2,
           "id": 3,
           "title": "nesciunt iure omnis dolorem tempora et accusantium",
           "body": "quo et expedita modi cum officia vel magni\ndoloribus qui repudiandae\nvero nisi sit\nquos veniam quod sed accusamus veritatis error"
          },
         {
           "userId": 3,
           "id": 4,
           "title": "nesciunt iure omnis dolorem tempora et accusantium",
           "body": "quo et expedita modi cum officia vel magni\ndoloribus qui repudiandae\nvero nisi sit\nquos veniam quod sed accusamus veritatis error"
          },
         {
           "userId": 4,
           "id": 5,
           "title": "nesciunt iure omnis dolorem tempora et accusantium",
           "body": "quo et expedita modi cum officia vel magni\ndoloribus qui repudiandae\nvero nisi sit\nquos veniam quod sed accusamus veritatis error"
          }
       ]
     }
     ```

     ## I hope you would like my project Rate Limiter🚀
