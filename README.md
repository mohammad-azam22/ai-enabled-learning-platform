# AI Enabled Learning Platform

## Introduction

Welcome to the **AI Enabled Learning Platform** — a web application designed to provide an interactive, AI-powered learning experience.  

This platform allows instructors to create and manage courses, and enables students to browse, enroll, and learn through a rich user interface. It also leverages AI-driven tools (such as recommendation, content personalization, automated assessments, etc.) to enhance the learning experience and improve engagement.  

Whether you are an educator who wants to build structured learning content or a learner who prefers an adaptive, tech-driven learning environment — this platform aims to make online education intuitive, efficient, and intelligent.

## Features

- Instructor dashboard: create, update, and manage courses.  
- Student dashboard: browse courses, enroll, track progress.  
- Course pages with course reviews, study materials, and progress tracking.  
- AI-powered features like content recommendation, automatic test grading and adaptive course difficulty level.

!["Student Login Page"](/images/001.png)

!["Student Dashboard Page"](/images/002.jpeg)

!["Learn Page"](/images/003.jpeg)

!["Course Page"](/images/004.jpeg)

!["Instructor Dashboard Page"](/images/005.jpeg)

!["Edit Course Page"](/images/006.jpeg)

## Installation

To get a local copy up and running, follow these steps:

1. **Clone the repository**  
   ```bash
   git clone https://github.com/mohammad-azam22/ai-enabled-learning-platform.git
   cd ai-enabled-learning-platform
   ```

2. **Install dependencies**<br>
Ensure you have Node.js installed. Then run:

   ```bash
   npm install
   ```

3. **Configure environment (if applicable)**<br>
Create a .env file with your configuration variables.
   ```env
   BACKEND_PORT = 3000
   MONGODB_DB_NAME = "cognito_learn"
   MONGODB_URI = "mongodb://127.0.0.1:27017/"
   EXPRESS_SESSION_KEY = "YourSessionKey"
   ```

4. **Run the server**
   ```bash
   npm start
   ```

By default, the server might start at http://localhost:3000. Open this in your browser to use the platform.

## Usage

Once installed and running:

- Visit the home page in your browser.

- Register or login as an Instructor / Student.

- Instructors can create courses, add lessons or content.

- Students can view available courses, enroll, and access course content.

- Extend or customize AI-powered features as per your needs (e.g. integrate recommendation models, analytics, assessments, etc.).

```
Note: This is a foundational version — additional functionality (e.g. AI modules, user roles, payments, analytics) can be built on top of this base.
```

## Contributing

Thank you for considering contributing to this project! Here is how you can help:

1. Fork the repository.

2. Create a new branch for your feature or bugfix.

3. Make your changes, and ensure code style and quality are maintained.

4. Commit your changes with a clear message.

5. Submit a pull request describing your changes and why they are needed.

```
Please make sure your contributions follow best practices and include relevant tests / validations where applicable.

If you are planning a larger or more complex change — please open an issue first to discuss it.
```

## License

This project is licensed under the MIT License — see the LICENSE file for details.


