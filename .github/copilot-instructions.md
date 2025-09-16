# High Class - AI Agent Instructions

## Architecture Overview
- **Framework**: Next.js 15 App Router with TypeScript
- **Database**: Firebase Realtime Database (not Firestore) with real-time listeners
- **Auth**: Custom username/password system with role-based permissions
- **UI**: shadcn/ui + Tailwind CSS with bilingual (Arabic/English) support
- **Internationalization**: `[lang]` dynamic routes, middleware redirects to `/ar` by default

## Key Patterns & Conventions

### Data Flow
- Use `RealtimeDataContext` for all Firebase data access - never direct Firebase calls in components
- Branch filtering: Check `currentUser.branchId` and `view_all_branches` permission before data operations
- Real-time updates: All data mutations trigger automatic UI updates via Firebase listeners

### Authentication & Permissions
- 20+ granular permissions in `PERMISSION_STRINGS` (see `src/types/index.ts`)
- Always check `hasPermission()` before rendering features
- User sessions stored in localStorage, auto-logout on account deactivation

### Component Structure
```
src/components/{feature}/ComponentName.tsx  # Feature-based organization
src/components/ui/                          # shadcn/ui primitives only
src/components/shared/                      # Cross-feature utilities
```

### File Organization
- `src/types/index.ts`: All TypeScript interfaces and permission definitions
- `src/lib/firebase.ts`: Firebase config and initialization
- `src/context/`: AuthContext and RealtimeDataContext providers
- `src/hooks/`: Custom hooks for reusable logic

### UI Patterns
- Bilingual text: Use `lang === 'ar' ? arabic : english` pattern
- RTL support: Automatic via `dir={lang === 'ar' ? 'rtl' : 'ltr'}`
- Responsive: Mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Theming: CSS variables in `globals.css`, dark mode support

### Development Workflow
- **Start dev server**: `npm run dev` (runs on port 9002 with Turbopack)
- **Environment**: Copy `.env.local` with Firebase config variables
- **Build**: `npm run build` (ignore TypeScript/ESLint errors in production)
- **Firebase config**: All vars prefixed with `NEXT_PUBLIC_FIREBASE_`

### Real-time Data Management
- Collections: `users`, `products`, `orders`, `customers`, `branches`, `financial_transactions`
- Always filter by branch unless user has `view_all_branches` permission
- Use `transformFirebaseData()` helper for converting Firebase snapshots to typed arrays

### Permission Groups
Reference `PERMISSION_GROUPS` in `src/types/index.ts` for logical permission clusters:
- `products_group`: CRUD operations on products
- `orders_group`: Order lifecycle management
- `financials_group`: Payment and transaction tracking

### AI Integration
- Genkit flows in `src/ai/flows/` for product listing optimization
- Use `optimizeListing()` function for marketing copy suggestions

### Key Files to Reference
- `src/types/index.ts`: Complete data models and permissions
- `src/context/AuthContext.tsx`: Authentication and permission checking
- `src/context/RealtimeDataContext.tsx`: Data fetching patterns
- `src/lib/firebase.ts`: Database connection setup
- `tailwind.config.ts`: Custom theme and responsive breakpoints

### Common Gotchas
- Firebase Realtime Database paths use underscores: `financial_transactions`
- Order codes are auto-generated, never manually set
- Product stock tracking: `quantityInStock`, `quantityRented`, `quantitySold`
- Always check `isActive` flag on users before operations
- Use `safeParseDate()` for Firebase timestamp handling</content>
<parameter name="filePath">d:\OMAR-PROJECT\High-Class\high-class\.github\copilot-instructions.md