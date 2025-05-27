# UniEnroll Project

This README provides instructions on how to set up and run the UniEnroll project on any PC.

## Prerequisites

Before running this project, ensure you have the following installed on your PC:

1. **Node.js** (version 14.x or later) - [Download Node.js](https://nodejs.org/)
2. **npm** (Node Package Manager) - Comes with Node.js installation.
3. **Git** (optional, for cloning the repository) - [Download Git](https://git-scm.com/)

## Steps to Run the Project

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd unienroll
   ```
   Replace `<repository-url>` with the actual URL of the repository.

2. **Install Dependencies**
   Run the following command to install all required dependencies:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the root directory and add the necessary environment variables. Refer to the `config/db.js` file for database configuration requirements. Example:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=unienroll
   JWT_SECRET=your_jwt_secret
   ```

4. **Run the Project**
   Start the server using the following command:
   ```bash
   npm start
   ```
   The server will start running on the default port (e.g., `http://localhost:3000`).

5. **Run Tests (Optional)**
   To run the test suite, use the following command:
   ```bash
   npm test
   ```

## Project Structure

- `app.js` and `server.js`: Entry points for the application.
- `controllers/`: Contains logic for handling requests.
- `middleware/`: Middleware functions for authentication and role checks.
- `models/`: Database models for the application.
- `routes/`: API route definitions.
- `utils/`: Utility functions.
- `tests/`: Contains test files for the application.

## API Endpoints

Below is a list of all available API endpoints and sample data for testing in Postman:

### Authentication APIs

1. **Register User**
   - **Endpoint**: `POST /api/auth/register`
   - **Description**: Registers a new user.
   - **Sample Request Body**:
     ```json
     {
       "name": "John Doe",
       "email": "john.doe@example.com",
       "password": "password123"
     }
     ```

2. **Login User**
   - **Endpoint**: `POST /api/auth/login`
   - **Description**: Logs in an existing user and returns a token.
   - **Sample Request Body**:
     ```json
     {
       "email": "john.doe@example.com",
       "password": "password123"
     }
     ```


### Course APIs

1. **Get All Courses**
   - **Endpoint**: `GET /api/courses`
   - **Description**: Retrieves a list of all available courses.

2. **Create a Course** (Admin Only)  
    - **Endpoint**: `POST /api/courses`  
    - **Description**: Creates a new course. This action is restricted to admin users.  
    - **Sample Request Body**:  
      ```json
      {
            "title": "Introduction to Programming",
            "code": "CS101",
            "department": "Computer Science",
            "creditHours": 3,
            "instructor": "Dr. Jane Doe",
            "schedule": {
                 "days": ["Mon", "Wed", "Fri"],
                 "startTime": "10:00",
                 "endTime": "11:30"
            },
            "maxCapacity": 30,
            "currentEnrollment": 25
      }
      ```

3. **Enroll in a Course**
   - **Endpoint**: `POST /api/courses/enroll`
   - **Description**: Enrolls a user in a course.
   - **Sample Request Body**:
     ```json
     {
       "courseId": "12345",
       "userId": "67890"
     }
     ```

### Enrollment APIs

1. **Get All Enrollments**
   - **Endpoint**: `GET /api/enrollments`
   - **Description**: Retrieves all enrollments.

2. **Cancel Enrollment**
   - **Endpoint**: `DELETE /api/enrollments/:id`
   - **Description**: Cancels an enrollment by ID.

## Sample Data for Testing

Use the following sample data to test the APIs:

### Users
```json
[
  {
    "name": "Alice Smith",
    "email": "alice.smith@example.com",
    "password": "alicepassword"
  },
  {
    "name": "Bob Johnson",
    "email": "bob.johnson@example.com",
    "password": "bobpassword"
  }
]
```

### Courses
```json
[
  {
    "title": "Data Structures",
    "description": "Learn about various data structures.",
    "duration": "8 weeks"
  },
  {
    "title": "Web Development",
    "description": "Build modern web applications.",
    "duration": "12 weeks"
  }
]
```

### Enrollments
```json
[
  {
    "courseId": "1",
    "userId": "1"
  },
  {
    "courseId": "2",
    "userId": "2"
  }
]
```

## Additional Notes

- Ensure your database is set up and running before starting the server.
- Use tools like Postman or cURL to test the API endpoints.

For further assistance, refer to the project documentation or contact the project maintainer.