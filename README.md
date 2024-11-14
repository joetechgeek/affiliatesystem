Here's a suggested `README.md` content based on your provided codebase:

---

# E-Commerce Application

This is a full-featured e-commerce platform built using **Next.js**, **TypeScript**, and **Supabase**. It includes advanced features such as user authentication, shopping cart functionality, affiliate marketing, payment processing with Stripe, and an admin dashboard for managing products, orders, and users.

## Core Technologies

- **Frontend**: Next.js 15.0.1 with TypeScript
- **Backend/Database**: Supabase
- **Payment Processing**: Stripe
- **State Management**: Zustand
- **Styling**: Tailwind CSS

## Key Features

### Authentication System
- User login/signup
- Email verification
- Protected routes for authenticated users
- Auth context provider for global state

### Product Management
- Product listing and details pages
- Image handling for products
- Stock management
- Admin interface for product management

### Shopping Cart
- Persistent cart using Zustand state management
- Add/remove items and update quantities
- Price calculation and display

### Coupon System
- Coupon code validation
- Discount application on checkout
- Affiliate and referral tracking
- Commission management for affiliates

### Order Management
- Create and track orders
- Order history for users
- Admin interface for managing orders

### Admin Dashboard
- Product management
- Order management
- User management
- Analytics
- Sync products with Stripe

### Stripe Integration
- Secure payment processing
- Webhook handling for payment confirmation
- Product synchronization with Stripe

### Real-Time Features
- Real-time updates for order status and stock availability
- Responsive design with mobile-first approach
- Dark mode support

### File Upload
- Upload product images with error handling and validation

## Database Schema

The application uses Supabase as the backend database with the following key tables:

- **profiles**: Stores user profile data, including coupon codes
- **products**: Product details and stock information
- **orders**: Tracks user orders
- **order_items**: Details of individual items in orders
- **coupons**: Manages coupon codes and discounts
- **commissions**: Tracks affiliate commission data

## Notable Features

- Responsive and mobile-friendly design
- Admin authorization with protected access
- Advanced error handling and loading states
- Form validation for all user input
- Real-time updates via Supabase subscriptions

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/joetechgeek/e-commerce-app.git
cd e-commerce-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 4. Run the application

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## License

This project is licensed under the MIT License.

---

Feel free to modify the sections as needed based on the actual project setup or additional details you might want to include!