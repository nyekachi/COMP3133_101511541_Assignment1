import User from '../models/User.js';
import Employee from '../models/Employee.js';
import jwt from 'jsonwebtoken';
import cloudinary from '../config/cloudinary.js';
import { GraphQLError } from 'graphql';

// Generate JWT 
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Check Auth 
const checkAuth = (context) => {
  if (!context.user) {
    throw new GraphQLError('Authentication required. Please login first.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
};

// Validate Email Format 
const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

export const resolvers = {
  // Queries
  Query: {
    /**
     * LOGIN
     * Accepts username OR email + password
     * Returns JWT token + user object
     */
    login: async (_, { usernameOrEmail, password }) => {
      // Validate inputs
      if (!usernameOrEmail || !password) {
        throw new GraphQLError('Username/email and password are required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Find user by username or email
      const user = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      });

      if (!user) {
        throw new GraphQLError('Invalid credentials. User not found.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        throw new GraphQLError('Invalid credentials. Incorrect password.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = generateToken(user._id);

      return {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      };
    },

    /**
     * GET ALL EMPLOYEES (protected)
     */
    getAllEmployees: async (_, __, context) => {
      checkAuth(context);
      try {
        const employees = await Employee.find().sort({ created_at: -1 });
        return employees;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch employees: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    /**
     * SEARCH EMPLOYEE BY ID (protected)
     */
    searchEmployeeById: async (_, { eid }, context) => {
      checkAuth(context);

      if (!eid) {
        throw new GraphQLError('Employee ID is required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const employee = await Employee.findById(eid);
      if (!employee) {
        throw new GraphQLError(`No employee found with ID: ${eid}`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      return employee;
    },

    /**
     * SEARCH EMPLOYEE BY DESIGNATION OR DEPARTMENT (protected)
     */
    searchEmployeeByDesignationOrDepartment: async (
      _,
      { designation, department },
      context
    ) => {
      checkAuth(context);

      if (!designation && !department) {
        throw new GraphQLError(
          'Provide at least one filter: designation or department.',
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      const query = { $or: [] };
      if (designation) {
        query.$or.push({ designation: { $regex: designation, $options: 'i' } });
      }
      if (department) {
        query.$or.push({ department: { $regex: department, $options: 'i' } });
      }

      const employees = await Employee.find(query).sort({ created_at: -1 });
      return employees;
    },
  },

  // Mutations 
  Mutation: {
    /**
     * SIGNUP
     * Creates new user account
     */
    signup: async (_, { input }) => {
      const { username, email, password } = input;

      // Validate inputs
      if (!username || username.trim().length < 3) {
        throw new GraphQLError('Username must be at least 3 characters.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!isValidEmail(email)) {
        throw new GraphQLError('Please provide a valid email address.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!password || password.length < 6) {
        throw new GraphQLError('Password must be at least 6 characters.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check for duplicates
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        const field = existingUser.username === username ? 'username' : 'email';
        throw new GraphQLError(
          `An account with this ${field} already exists.`,
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      const user = await User.create({ username, email, password });
      return user;
    },

    /**
     * ADD NEW EMPLOYEE (protected)
     * Supports optional Cloudinary photo URL
     */
    addEmployee: async (_, { input }, context) => {
      checkAuth(context);

      const {
        first_name,
        last_name,
        email,
        gender,
        designation,
        salary,
        date_of_joining,
        department,
        employee_photo,
      } = input;

      // Validate required fields
      if (!first_name || !last_name) {
        throw new GraphQLError('First name and last name are required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!isValidEmail(email)) {
        throw new GraphQLError('Please provide a valid employee email.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!designation || !department) {
        throw new GraphQLError('Designation and department are required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!salary || salary < 1000) {
        throw new GraphQLError('Salary must be at least 1000.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!date_of_joining) {
        throw new GraphQLError('Date of joining is required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
        throw new GraphQLError('Gender must be Male, Female, or Other.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check duplicate email
      const existing = await Employee.findOne({ email });
      if (existing) {
        throw new GraphQLError(
          'An employee with this email already exists.',
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      // Handle Cloudinary photo upload if a base64/URL is provided
      let photoUrl = employee_photo || null;
      if (
        employee_photo &&
        employee_photo.startsWith('data:image')
      ) {
        try {
          const uploadResult = await cloudinary.uploader.upload(employee_photo, {
            folder: 'employee_photos',
            resource_type: 'image',
          });
          photoUrl = uploadResult.secure_url;
        } catch (err) {
          throw new GraphQLError(`Cloudinary upload failed: ${err.message}`, {
            extensions: { code: 'UPLOAD_ERROR' },
          });
        }
      }

      const employee = await Employee.create({
        first_name,
        last_name,
        email,
        gender,
        designation,
        salary,
        date_of_joining: new Date(date_of_joining),
        department,
        employee_photo: photoUrl,
      });

      return employee;
    },

    /**
     * UPDATE EMPLOYEE BY EID (protected)
     */
    updateEmployee: async (_, { eid, input }, context) => {
      checkAuth(context);

      if (!eid) {
        throw new GraphQLError('Employee ID is required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Validate fields if provided
      if (input.email && !isValidEmail(input.email)) {
        throw new GraphQLError('Please provide a valid email.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (input.salary !== undefined && input.salary < 1000) {
        throw new GraphQLError('Salary must be at least 1000.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (input.gender && !['Male', 'Female', 'Other'].includes(input.gender)) {
        throw new GraphQLError('Gender must be Male, Female, or Other.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Handle Cloudinary photo upload for update
      if (input.employee_photo && input.employee_photo.startsWith('data:image')) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            input.employee_photo,
            { folder: 'employee_photos', resource_type: 'image' }
          );
          input.employee_photo = uploadResult.secure_url;
        } catch (err) {
          throw new GraphQLError(`Cloudinary upload failed: ${err.message}`, {
            extensions: { code: 'UPLOAD_ERROR' },
          });
        }
      }

      // Convert date if provided
      if (input.date_of_joining) {
        input.date_of_joining = new Date(input.date_of_joining);
      }

      const employee = await Employee.findByIdAndUpdate(
        eid,
        { ...input, updated_at: new Date() },
        { new: true, runValidators: true }
      );

      if (!employee) {
        throw new GraphQLError(`No employee found with ID: ${eid}`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return employee;
    },

    /**
     * DELETE EMPLOYEE BY EID (protected)
     */
    deleteEmployee: async (_, { eid }, context) => {
      checkAuth(context);

      if (!eid) {
        throw new GraphQLError('Employee ID is required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const employee = await Employee.findByIdAndDelete(eid);
      if (!employee) {
        throw new GraphQLError(`No employee found with ID: ${eid}`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return `Employee "${employee.first_name} ${employee.last_name}" deleted successfully.`;
    },
  },
};