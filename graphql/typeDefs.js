export const typeDefs = `#graphql

  # Scalar Types 
  scalar Upload

  # User Types 
  type User {
    _id: ID!
    username: String!
    email: String!
    created_at: String
    updated_at: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Employee Types 
  type Employee {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
    created_at: String
    updated_at: String
  }

  # Input Types 
  input SignupInput {
    username: String!
    email: String!
    password: String!
  }

  input AddEmployeeInput {
    first_name: String!
    last_name: String!
    email: String!
    gender: String
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
  }

  input UpdateEmployeeInput {
    first_name: String
    last_name: String
    email: String
    gender: String
    designation: String
    salary: Float
    date_of_joining: String
    department: String
    employee_photo: String
  }

  # Queries 
  type Query {
    # Login: accepts username OR email + password
    login(usernameOrEmail: String!, password: String!): AuthPayload!

    # Get all employees (protected)
    getAllEmployees: [Employee!]!

    # Search employee by MongoDB _id
    searchEmployeeById(eid: ID!): Employee

    # Search employees by designation OR department
    searchEmployeeByDesignationOrDepartment(
      designation: String
      department: String
    ): [Employee!]!
  }

  # Mutations 
  type Mutation {
    # User signup
    signup(input: SignupInput!): User!

    # Add new employee (with optional Cloudinary photo URL)
    addEmployee(input: AddEmployeeInput!): Employee!

    # Update employee by eid
    updateEmployee(eid: ID!, input: UpdateEmployeeInput!): Employee!

    # Delete employee by eid
    deleteEmployee(eid: ID!): String!
  }
`;