# ERPFlow API Documentation

## Base URL

```text
http://localhost:5000/api
Authentication
Login

POST /auth/login

Authenticates a user and returns a JWT token.

Current User

GET /auth/me

Returns the currently authenticated user's information.

Admin Test

GET /auth/admin-test

ADMIN-only protected endpoint used to verify role-based authorization.

Customers
Get Customers

GET /customers

Returns the list of customers.

Create Customer

POST /customers

Creates a new customer.

Enquiries
Get Enquiries

GET /enquiries

Returns all customer enquiries.

Create Enquiry

POST /enquiries

Creates an enquiry with customer, required date and multiple products with quantities.

Quotations
Get Quotations

GET /quotations

Returns all quotations.

Create Quotation

POST /quotations

Creates a quotation for an enquiry.

Quotation totals are calculated and validated by the backend.

Update Quotation Status

PATCH /quotations/:id/status

Updates the quotation status.

Supported workflow:

DRAFT → SENT → ACCEPTED
              └→ REJECTED
Convert Quotation

POST /quotations/:id/convert

Converts an ACCEPTED quotation into a Sales Order.

Draft and rejected quotations cannot be converted.

Duplicate Sales Orders for the same quotation are prevented.

Sales Orders
Get Sales Orders

GET /sales-orders

Returns Sales Orders and their product items.

Confirm Sales Order

POST /sales-orders/:id/confirm

ADMIN-only operation.

Confirms a pending Sales Order and reserves inventory.

Inventory reservation is performed inside a database transaction.

Cancel Sales Order

POST /sales-orders/:id/cancel

ADMIN-only operation.

Cancels a Sales Order.

If the order was confirmed, its inventory reservation is released.

Inventory
Get Inventory

GET /products/inventory

Returns product inventory information including:

Physical quantity
Reserved quantity
Available quantity

Available quantity is calculated as:

Available = Physical Quantity - Reserved Quantity
Dispatch
Get Dispatches

GET /dispatches

Returns dispatch records.

Create Dispatch

POST /dispatches

ADMIN-only operation.

Creates a dispatch for a confirmed Sales Order.

The API validates that:

The Sales Order is confirmed.
A duplicate dispatch does not already exist.
Dispatch quantity does not exceed the Sales Order quantity.
Dispatch quantity does not exceed reserved inventory.
Inventory has sufficient physical quantity.

After successful dispatch:

Physical Quantity decreases
Reserved Quantity decreases
Sales Order status becomes DISPATCHED
Authorization

Protected APIs require a JWT Bearer token.

Authorization: Bearer <JWT_TOKEN>

Role-based authorization is enforced by the backend.

ADMIN operations
Confirm Sales Order
Cancel Sales Order
Create Dispatch
SALES_USER operations
Create customers
Create enquiries
Create quotations
Convert accepted quotations
View inventory
Error Handling

The backend returns appropriate HTTP status codes for validation and authorization failures.

Examples:

400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
409 - Conflict
500 - Internal Server Error

Business validations are performed on the backend to maintain data consistency.