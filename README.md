# COMP3133 Assignment 1 - Employee Management System

**Student:** Karen Amadi  
**Student ID:** 101511541  
**Course:** COMP 3133 – Full Stack Development II  

---

## 🚀 Live Demo

**Hosted URL:** https://comp3133-101511541-assignment1.onrender.com  
**GraphQL Playground:** https://comp3133-101511541-assignment1.onrender.com/graphql

---

## 📋 Project Overview

A backend Employee Management System built with Node.js, Express, GraphQL (Apollo Server), and MongoDB. The system supports user authentication with JWT and employee CRUD operations with Cloudinary image storage.

---

## 🛠 Tech Stack

- **Runtime:** Node.js v22
- **Framework:** Express.js
- **API:** GraphQL with Apollo Server 4
- **Database:** MongoDB Atlas + Mongoose
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Image Storage:** Cloudinary
- **Deployment:** Render

---

## 📁 Project Structure

```
COMP3133_101511541_Assignment1/
│
├── config/
│   ├── db.js                 # MongoDB connection
│   └── cloudinary.js         # Cloudinary configuration
│
├── graphql/
│   ├── typeDefs.js           # GraphQL schema
│   └── resolvers.js          # GraphQL resolvers
│
├── middleware/
│   └── auth.js               # JWT authentication middleware
│
├── models/
│   ├── User.js               # User Mongoose model
│   └── Employee.js           # Employee Mongoose model
│
├── utils/
│   └── upload.js             # Cloudinary REST upload endpoint
│
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── server.js                 # Entry point
├── postman_collection.json   # Postman API collection
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/nyekachi/COMP3133_101511541_Assignment1.git
cd COMP3133_101511541_Assignment1

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Start the server
npm start
```

### Environment Variables

```
MONGO_URI=mongodb+srv://assignment1:jfL4s3peMq9wrwKI@comp3133.4ptr5cv.mongodb.net/comp3133_101511541_Assigment1?appName=COMP3133
CLOUDINARY_CLOUD_NAME=dpfr2jfks
CLOUDINARY_API_KEY=517138456552274
CLOUDINARY_API_SECRET=**********
PORT=4000
JWT_SECRET=assignment1key1.0
```

---

## 🗄️ Database Schema

**Database:** `comp3133_101511541_Assigment1`

### Users Collection

| Field | Type | Constraint |
|-------|------|-----------|
| _id | ObjectID | Auto-generated |
| username | String | Required, unique |
| email | String | Required, unique |
| password | String | Encrypted (bcrypt) |
| created_at | Date | Auto |
| updated_at | Date | Auto |

### Employees Collection

| Field | Type | Constraint |
|-------|------|-----------|
| _id | ObjectID | Auto-generated |
| first_name | String | Required |
| last_name | String | Required |
| email | String | Required, unique |
| gender | String | Male/Female/Other |
| designation | String | Required |
| salary | Float | Required, >= 1000 |
| date_of_joining | Date | Required |
| department | String | Required |
| employee_photo | String | Cloudinary URL |
| created_at | Date | Auto |
| updated_at | Date | Auto |

---

## 🔗 GraphQL API

All requests: `POST https://comp3133-101511541-assignment1.onrender.com/graphql`

Protected routes require header: `Authorization: Bearer <token>`

### 1. Signup (Mutation)
```graphql
mutation {
  signup(input: {
    username: "lily"
    email: "lily@example.com"
    password: "password123"
  }) {
    _id
    username
    email
    created_at
  }
}
```

### 2. Login (Query)
```graphql
query {
  login(usernameOrEmail: "lily", password: "password123") {
    token
    user {
      _id
      username
      email
    }
  }
}
```

### 3. Get All Employees (Query) 🔒
```graphql
query {
  getAllEmployees {
    _id
    first_name
    last_name
    email
    designation
    department
    salary
  }
}
```

### 4. Add New Employee (Mutation) 🔒
```graphql
mutation {
  addEmployee(input: {
    first_name: "ken"
    last_name: "Smith"
    email: "ken@company.com"
    gender: "Male"
    designation: "Software Engineer"
    salary: 75000
    date_of_joining: "2024-01-15"
    department: "Engineering"
    employee_photo: "https://res.cloudinary.com/..."
  }) {
    _id
    first_name
    last_name
    employee_photo
  }
}
```

### 5. Search Employee by ID (Query) 🔒
```graphql
query {
  searchEmployeeById(eid: "employee_id_here") {
    _id
    first_name
    last_name
    designation
    department
  }
}
```

### 6. Update Employee (Mutation) 🔒
```graphql
mutation {
  updateEmployee(eid: "employee_id_here", input: {
    designation: "Senior Engineer"
    salary: 90000
  }) {
    _id
    designation
    salary
    updated_at
  }
}
```

### 7. Delete Employee (Mutation) 🔒
```graphql
mutation {
  deleteEmployee(eid: "employee_id_here")
}
```

### 8. Search by Designation or Department (Query) 🔒
```graphql
query {
  searchEmployeeByDesignationOrDepartment(department: "Engineering") {
    _id
    first_name
    last_name
    designation
    department
  }
}
```

---

## 📷 Cloudinary Photo Upload

```
POST https://comp3133-101511541-assignment1.onrender.com/api/upload
Content-Type: multipart/form-data
Body: photo (file)

Response: { "success": true, "url": "https://res.cloudinary.com/..." }
```

---

## 👤 Sample Test User

```
Username: lily
Email: lily@example.com
Password: password123
```

---

## 🔒 Security

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT Bearer token authentication (7-day expiry)
- Input validation on all operations
- Environment variables for all sensitive credentials

---

## 📦 Submission

- **GitHub:** https://github.com/nyekachi/COMP3133_101511541_Assignment1
- **Hosted URL:** https://comp3133-101511541-assignment1.onrender.com