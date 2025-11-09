# Kul Setu Connect - React Native App

This is the React Native version of the Kul Setu Connect web application, converted from React web to React Native using Expo.

## Features Converted

### Core Screens
- **Home Screen**: Hero section with family tree features and spiritual quotes
- **Register Screen**: Family member registration with detailed forms
- **Search Screen**: Search family members by traits, names, and characteristics
- **Family Tree Screen**: Visual representation of family generations
- **Rituals Screen**: Manage family ceremonies, birthdays, and traditions
- **Authentication Screen**: Login and registration functionality

### Key Components
- Navigation using Expo Router with tab-based navigation
- Linear gradients for spiritual-themed UI
- Form handling with React Hook Form
- Local storage using AsyncStorage
- Mock data for family members and rituals

### Dependencies Added
- `@tanstack/react-query` - Data fetching and state management
- `expo-linear-gradient` - Gradient backgrounds
- `@react-native-async-storage/async-storage` - Local storage
- `react-hook-form` - Form management
- `zod` - Schema validation
- `date-fns` - Date utilities
- `clsx` - Utility for conditional classes

## Differences from Web Version

### UI/UX Changes
- Replaced web-specific components with React Native equivalents
- Used Ionicons instead of Lucide React icons
- Implemented touch-friendly navigation with tab bar
- Adapted layouts for mobile screens
- Used native styling instead of Tailwind CSS

### Technical Changes
- Replaced React Router with Expo Router
- Used AsyncStorage instead of localStorage
- Implemented native scrolling and touch interactions
- Used React Native's StyleSheet for styling
- Replaced HTML elements with React Native components

### Features Simplified
- Removed complex web-specific UI components (shadcn/ui)
- Simplified form validation
- Basic authentication flow
- Mock API calls instead of actual backend integration

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on device/simulator:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

## Project Structure

```
app/
├── (tabs)/           # Tab-based navigation screens
│   ├── index.tsx     # Home screen
│   ├── register.tsx  # Family registration
│   ├── search.tsx    # Family search
│   ├── tree.tsx      # Family tree
│   └── rituals.tsx   # Rituals management
├── auth.tsx          # Authentication screen
└── _layout.tsx       # Root layout

lib/
├── utils.ts          # Utility functions and colors
├── auth.ts           # Authentication helpers
└── familyData.ts     # Mock family data and types
```

## Color Scheme

The app maintains the spiritual theme with warm colors:
- Primary: #FF8C00 (Orange)
- Secondary: #FFE4B5 (Moccasin)
- Sacred: #FFD700 (Gold)
- Background: #FFFEF7 (Ivory)

## Future Enhancements

- Real backend API integration
- Image upload and management
- Push notifications for rituals
- Offline data synchronization
- Advanced family tree visualization
- Social sharing features
- Multi-language support