# ERPFlow

ERPFlow is a full-stack ERP workflow application developed using React.js, Node.js, Express.js and PostgreSQL.

The system manages the complete business workflow:

Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch

## Features

- JWT-based authentication
- Role-based access control
- ADMIN and SALES_USER roles
- Customer management
- Customer enquiry management
- Multi-product enquiries
- Quotation creation and backend calculation
- Quotation status workflow
- Sales Order conversion
- Duplicate Sales Order prevention
- Inventory management
- Inventory reservation
- Transaction-based inventory operations
- Sales Order cancellation with reservation release
- Dispatch management
- Dispatch validation
- Protected REST APIs
- PostgreSQL relational database

## Technology Stack

### Frontend
- React.js
- Axios
- React Router
- CSS

### Backend
- Node.js
- Express.js
- JWT
- bcryptjs
- PostgreSQL
- pg

### Database
- PostgreSQL

## User Roles

### ADMIN
- View all records
- Manage inventory
- Confirm Sales Orders
- Cancel Sales Orders
- Process dispatches

### SALES_USER
- Create customers
- Create enquiries
- Create quotations
- Convert accepted quotations to Sales Orders
- View inventory

## Business Workflow

1. Customer is created.
2. Sales User creates an enquiry.
3. Quotation is created against the enquiry.
4. Backend calculates quotation totals.
5. Quotation is sent and accepted.
6. Accepted quotation is converted into a Sales Order.
7. Admin confirms the Sales Order.
8. Inventory is reserved.
9. Admin processes dispatch.
10. Physical and reserved inventory quantities are updated.

## Quotation Calculation

Quotation totals are calculated on the backend.

For each item:

Line Amount = Quantity × Unit Price

Discount is applied before GST.

Grand Total = Sum of GST-inclusive line amounts.

The backend validates the calculation instead of trusting the frontend total.

## Inventory Logic

Available Quantity:

Available = Physical Quantity - Reserved Quantity

During Sales Order confirmation:

- Physical quantity remains unchanged.
- Reserved quantity increases.
- Reservation cannot exceed available quantity.

During dispatch:

- Physical quantity decreases.
- Reserved quantity decreases.
- Dispatch cannot exceed reserved quantity.

## Database Entities

- users
- customers
- products
- inventory
- enquiries
- enquiry_items
- quotations
- quotation_items
- sales_orders
- sales_order_items
- dispatches
- dispatch_items

## Project Structure

ERPFlow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── scripts/
│   │   └── createUsers.js
│   ├── .env
│   └── package.json
│
└── frontend/
    └── src/

## Backend Setup

```bash
cd backend
npm install

Create a `.env` file inside the `backend` folder.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erpflow
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
JWT_SECRET=your_jwt_secret
ADMIN_PASSWORD=your_admin_seed_password
SALES_PASSWORD=your_sales_seed_password

Database Setup

Create a PostgreSQL database named:

erpflow

Run the database schema from:

backend/database/schema.sql

Run the seed data from:

backend/database/seed.sql

Create or update the application users using:

node scripts/createUsers.js
Run Backend

From the backend directory:

npm run dev

The backend runs on:

http://localhost:5000

Health check:

GET /api/health

Frontend Setup

Open another terminal:

cd frontend
npm install
npm start

The frontend runs on:

http://localhost:3000

Main API Endpoints
Authentication
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/admin-test
Customers
GET  /api/customers
POST /api/customers
Enquiries
GET  /api/enquiries
POST /api/enquiries
Quotations
GET   /api/quotations
POST  /api/quotations
PATCH /api/quotations/:id/status
POST  /api/quotations/:id/convert
Sales Orders
GET  /api/sales-orders
POST /api/sales-orders/from-quotation/:quotation_id
POST /api/sales-orders/:id/confirm
POST /api/sales-orders/:id/cancel
Inventory
GET /api/products/inventory
Dispatch
GET  /api/dispatches
POST /api/dispatches
Authentication and Authorization

The application uses JWT authentication.

After successful login, the backend returns a JWT token containing the authenticated user's ID and role.

Protected APIs require a Bearer token:

Authorization: Bearer <JWT_TOKEN>

Role-based authorization is implemented at the backend.

ADMIN-only operations cannot be performed by SALES_USER accounts.

Business Rules and Validation
Draft quotations cannot be converted into Sales Orders.
Rejected quotations cannot be converted into Sales Orders.
Only accepted quotations can create Sales Orders.
A quotation cannot create multiple Sales Orders.
Sales Order confirmation cannot reserve more inventory than available.
Inventory quantities cannot become negative.
Only ADMIN users can confirm Sales Orders.
Only ADMIN users can cancel Sales Orders.
Cancelling a confirmed Sales Order releases its inventory reservation.
Only confirmed Sales Orders can be dispatched.
Dispatch quantity cannot exceed the reserved quantity.
Duplicate dispatch for the same Sales Order is prevented.
Cancelled Sales Orders cannot be dispatched.
Inventory operations use database transactions and row locking.
Testing

The following important test scenarios were performed:

Quotation total calculation
Draft quotation cannot create Sales Order
Rejected quotation cannot create Sales Order
Duplicate Sales Order prevention
Reservation cannot exceed available inventory
Unauthorized user cannot perform ADMIN operations
Cancellation releases inventory reservation
Dispatch cannot exceed reserved quantity
Security
Passwords are hashed using bcrypt.
Authentication uses JWT.
Protected APIs require authentication.
Backend role-based authorization is implemented.
Environment variables are used for secrets.
.env is excluded from Git.
node_modules is excluded from Git.
Sensitive credentials are not stored in the source code.
Demo Login

The application contains the following users:

ADMIN
Email: admin@erpflow.com

SALES_USER
Email: sales@erpflow.com

Passwords are configured through local environment variables and are not stored in the Git repository.

ER Diagram

The database ER diagram is included separately with the project submission.

Main relationships:

Customer
   │
   └── Enquiry
          │
          └── Quotation
                 │
                 └── Sales Order
                        │
                        └── Dispatch

Product
   │
   └── Inventory

Enquiry ─── Enquiry Items ─── Product
Quotation ─ Quotation Items ─ Product
Sales Order ─ Sales Order Items ─ Product
Dispatch ─── Dispatch Items ─── Product
API Security

All protected APIs require authentication using JWT.

Authorization is checked on the backend according to the user's role.

The frontend does not control authorization by itself.

Author

Raja Ojha

MCA
MET Institute of Computer Science