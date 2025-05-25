# Cafe POS System

A modern Point of Sale (POS) system built with React, TypeScript, and Firebase, designed for cafes and restaurants.

## Project Overview

This is a full-featured POS system that includes:
- Point of Sale interface for order management
- Kitchen Display System (KDS) for order preparation
- Bar Display System for beverage service
- Admin panel for menu and inventory management
- Real-time order tracking and status updates
- Receipt printing functionality
- Multi-user role support

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: React Context API
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure

```
cafe-pos-system/
├── components/         # Reusable UI components
├── contexts/          # React Context providers
├── pages/            # Main application pages
│   ├── pos/          # Point of Sale interface
│   ├── kds/          # Kitchen Display System
│   ├── bar/          # Bar Display System
│   └── admin/        # Admin panel
├── services/         # Firebase and other service integrations
├── types/            # TypeScript type definitions
└── utils/            # Utility functions and helpers
```

## Key Features

### Point of Sale (POS)
- Real-time order management
- Table and pax tracking
- Payment processing (Cash, Card, GCash)
- Order holding and resuming
- Receipt generation and printing
- Recent transactions view
- Menu item modifiers support

### Kitchen Display System (KDS)
- Real-time order updates
- Item status tracking (Pending, Preparing, Ready)
- Category-based order filtering
- Sound notifications for new orders
- Print KDS slips
- Multi-user role support

### Bar Display System
- Beverage order tracking
- Item status management
- Delivery confirmation
- Real-time updates

### Admin Features
- Menu management
- Category management
- Inventory tracking
- User management
- Order history
- Sales reporting

## Recent Changes and Improvements

### Order Status Management
- Enhanced order status tracking with detailed states:
  - PENDING
  - PREPARING
  - PARTIALLY_READY
  - READY_FOR_DELIVERY
  - DELIVERY_IN_PROGRESS
  - COMPLETED
  - CANCELLED
  - ON_HOLD

### Item Status Management
- Improved item status tracking:
  - PENDING
  - PREPARING
  - READY
  - CANCELLED
  - AWAITING_DELIVERY
  - DELIVERED_TO_CUSTOMER

### Error Handling
- Added robust error handling for Firestore operations
- Implemented order refresh mechanism for stale data
- Added logging for better debugging

### UI/UX Improvements
- Added loading states for order submission
- Implemented auto-close success modal
- Enhanced receipt printing functionality
- Improved error messages and user feedback

## Firebase Integration

### Collections
- orders
- menuItems
- categories
- ingredients
- recipes
- users
- settings

### Security Rules
- Role-based access control
- Data validation
- Real-time updates

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FIREBASE_MEASUREMENT_ID=
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Development Notes

### State Management
- Uses React Context for global state management
- Separate contexts for Orders, Menu, Inventory, and Settings
- Optimized re-renders with useCallback and useMemo

### Performance Optimizations
- Implemented pagination for large data sets
- Optimized Firestore queries
- Added caching for frequently accessed data

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful fallbacks for failed operations

## Known Issues and Limitations

1. Tailwind CSS CDN warning in production
2. React Router deprecation warnings
3. Order synchronization edge cases between local state and Firestore

## Future Improvements

1. Implement offline support
2. Add more payment methods
3. Enhance reporting features
4. Add customer loyalty program
5. Implement table management system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
