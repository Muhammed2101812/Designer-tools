# User Profile Management

This page allows users to view and update their profile information.

## Features

### Profile Information
- **Avatar Upload**: Users can upload a profile picture (PNG, JPG, WEBP, max 2MB)
- **Email Display**: Shows user's email (read-only)
- **Full Name**: Editable text field for user's full name
- **Auto-save**: Updates `updated_at` timestamp on profile changes

### Account Details
- **Plan Type**: Displays current subscription plan (free, premium, pro)
- **Member Since**: Shows account creation date
- **Last Updated**: Shows when profile was last modified

### Usage Statistics (Free Plan Only)
- **Daily Operations**: Shows current usage vs. limit (X/10 operations)
- **Visual Progress Bar**: Displays usage percentage
- **Upgrade Prompt**: Shows upgrade button when limit is reached
- **Reset Info**: Indicates daily reset at midnight UTC

## Implementation Details

### File Validation
```typescript
- Allowed types: PNG, JPG, WEBP
- Maximum size: 2MB
- Validation happens before upload
```

### Avatar Storage
- Stored in Supabase Storage bucket: `avatars`
- File naming: `{user_id}-{timestamp}.{ext}`
- Public read access for all avatars
- Users can only upload/update/delete their own avatars

### Error Handling
- Toast notifications for all errors
- Specific error messages for validation failures
- Graceful handling of upload failures
- Loading states during save/upload operations

## Database Operations

### Profile Update
```sql
UPDATE profiles
SET 
  full_name = $1,
  avatar_url = $2,
  updated_at = NOW()
WHERE id = $3
```

### Usage Stats Query
```sql
SELECT api_tools_count
FROM daily_limits
WHERE user_id = $1 AND date = CURRENT_DATE
```

## Requirements Satisfied

- ✅ 4.1: Display user information (email, full name, avatar, plan, creation date)
- ✅ 4.2: Implement profile update form with validation
- ✅ 4.3: Add avatar upload with file type and size validation
- ✅ 4.4: Display current usage statistics for free plan users
- ✅ 4.5: Update updated_at timestamp on profile changes
- ✅ Handle profile update errors with toast notifications

## Setup Instructions

1. **Run the storage migration**:
   ```bash
   # Apply the migration to create the avatars bucket
   supabase db push
   ```

2. **Verify storage bucket**:
   - Go to Supabase Dashboard → Storage
   - Confirm `avatars` bucket exists
   - Verify bucket is set to public

3. **Test the feature**:
   - Navigate to `/profile`
   - Upload an avatar
   - Update full name
   - Verify changes are saved
   - Check usage statistics (free plan only)

## Future Enhancements

- Email change functionality (requires re-verification)
- Password change form
- Two-factor authentication setup
- Account deletion option
- Export user data
