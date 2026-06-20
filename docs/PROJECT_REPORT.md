# SmartCare HMS Project Report

## Overview
SmartCare HMS is a professional MERN Stack Hospital Management System developed for a 7th semester Advanced Web Technologies project. It digitizes key hospital workflows: user management, patients, doctors, appointments, consultations, prescriptions, pharmacy inventory, billing, reports, notifications, and audit logs.

## Architecture
The system follows layered architecture:
- React frontend with protected routes and role-based navigation
- Express REST API with controllers, routes, middleware, and models
- MongoDB database with Mongoose schemas and references
- JWT authentication and role-based authorization

## Security Features
- Password hashing with bcryptjs
- JWT protected API access
- Role-based authorization middleware
- Helmet security headers
- Rate limiting
- Centralized error handling
- Audit logs for important actions

## Future Enhancements
- Socket.io real-time notifications
- Lab report module
- Online payment gateway
- Cloud deployment pipeline
- Production-grade healthcare compliance review
