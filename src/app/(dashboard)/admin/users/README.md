# User Management System

This directory contains the comprehensive User Management system for TheOyinbooke Foundation Management Platform.

## Features Implemented

### 1. User Listing & Search (`/admin/users`)
- **Complete user directory** with search and filtering
- **Real-time search** by name, email, or phone
- **Advanced filters** by role and status
- **Responsive design** for mobile and desktop
- **Pagination-ready** architecture

### 2. User Details & Editing
- **View user profiles** with complete information
- **Edit user details** including name, email, phone, notes
- **Role management** with permission previews
- **Status toggling** (activate/deactivate)
- **Audit trail** tracking for all changes

### 3. Role-Based Access Control
- **Super Admin**: Full system access including other admin management
- **Admin**: Foundation-level user management and full features
- **Reviewer**: Application review and beneficiary management
- **Beneficiary**: Student portal access
- **Guardian**: Parent/guardian portal access

### 4. Activity Monitoring
- **Audit logs** for all user actions
- **Risk level tracking** (critical, high, medium, low)
- **User activity timeline** with detailed descriptions
- **Security event monitoring**

### 5. User Invitation System
- **Email invitations** for new users
- **Role assignment** during invitation
- **Custom messages** in invitations
- **Invitation tracking** and management

## Security Features

### Access Control
- **Authentication required** for all operations
- **Role-based permissions** enforced at API level
- **Foundation-scoped access** (users can only manage within their foundation)
- **Self-protection** (users cannot deactivate themselves)
- **Super admin protection** (only super admins can manage other super admins)

### Audit Logging
- **Complete audit trail** for all user management actions
- **Risk level assessment** for security monitoring
- **User action tracking** with timestamps
- **Foundation-scoped logging**

## API Endpoints (Convex Functions)

### Admin Functions (`convex/admin.ts`)
- `getAllUsers()` - Get all users (admin only)
- `getUserById(userId)` - Get detailed user information
- `getUserAuditLogs(userId, limit?)` - Get user activity logs
- `updateUserRole(userId, newRole)` - Change user role
- `deactivateUser(userId, reason?)` - Deactivate user account
- `createUser(userData)` - Create new user manually

### User Functions (`convex/users.ts`)
- `updateProfile(userId, updates)` - Update user profile
- `toggleActiveStatus(userId)` - Toggle user active/inactive status
- `createInvitation(invitationData)` - Send user invitation
- `getByFoundation(foundationId, filters)` - Get foundation users
- `getStatistics(foundationId)` - Get user statistics

## Components

### Main Page
- `src/app/(dashboard)/admin/users/page.tsx` - Main user management interface

### Dialog Components
- `src/components/users/edit-user-dialog.tsx` - User editing modal
- `src/components/users/user-details-dialog.tsx` - User profile viewer
- `src/components/users/invite-user-dialog.tsx` - User invitation form

## Mobile Optimization

- **Touch-friendly interface** with 44px minimum touch targets
- **Responsive layouts** that adapt to mobile screens
- **Swipe gestures** for mobile interactions
- **Fast loading** optimized for Nigerian network conditions

## Nigerian Context Integration

- **Phone number validation** for Nigerian formats (+234, 070x, 080x patterns)
- **Naira currency support** in financial displays
- **Local timezone handling** (Africa/Lagos)
- **Cultural considerations** in naming and communication

## Usage Examples

### Access User Management
1. Navigate to `/admin/users` (visible in sidebar for admins)
2. Use search and filters to find specific users
3. Click "View" to see detailed user information
4. Use dropdown menu for actions (Edit, Deactivate, etc.)

### Invite New User
1. Click "Invite User" button
2. Fill in user details and select role
3. Add optional personal message
4. Send invitation

### Edit User Profile
1. Find user in the list
2. Click "Edit" from dropdown menu
3. Update information and role as needed
4. Save changes (automatically creates audit log)

### Monitor User Activity
1. Click "View" on any user
2. Go to "Activity" tab
3. Review audit logs and risk levels
4. Monitor for security events

## Next Steps for Enhancement

1. **Bulk Operations**: Select multiple users for bulk actions
2. **Advanced Filtering**: More granular filters and saved searches
3. **Export Functionality**: CSV/Excel export of user data
4. **User Analytics**: Usage statistics and engagement metrics
5. **Email Templates**: Customizable invitation email templates
6. **Two-Factor Authentication**: Enhanced security for admin accounts

## File Structure

```
src/app/(dashboard)/admin/users/
├── page.tsx                     # Main user management interface
└── README.md                   # This documentation

src/components/users/
├── edit-user-dialog.tsx        # User editing modal
├── user-details-dialog.tsx     # User profile viewer
└── invite-user-dialog.tsx      # User invitation form

convex/
├── admin.ts                    # Admin-level user management functions
└── users.ts                    # User profile and management functions
```

This User Management system provides a complete foundation for managing users across the TheOyinbooke Foundation platform with security, auditability, and Nigerian context integration built-in.