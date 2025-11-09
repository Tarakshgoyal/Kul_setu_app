# Email-Based Relationship Feature Update

## Overview
Updated the family registration system to support email-based relationship inputs instead of requiring users to remember person IDs.

## Changes Made

### Backend Changes (app.py) ✅ DEPLOYED
Located in: `kul-setu-backend`
Commit: "Add email-to-ID mapping for mother, father, and spouse in register and search endpoints"

#### 1. Helper Functions Added (before line 944)
- `get_person_id_by_email(email)` - Converts email to person_id
- `get_email_by_person_id(person_id)` - Converts person_id to email
- `resolve_relationship_ids(data)` - Processes motherEmail, fatherEmail, spouseEmail from request and converts to IDs

#### 2. Register Endpoints Updated
- `/register/alive` - Added `data = resolve_relationship_ids(data)` before validation
- `/register/dead` - Added `data = resolve_relationship_ids(data)` before validation

**Now Accepts:**
- `motherEmail`, `fatherEmail`, `spouseEmail` (new)
- `motherId`, `fatherId`, `spouseId` (existing - still supported)

#### 3. Search Endpoint Updated
- `/search` - Added email lookups for mother, father, and spouse

**Now Returns:**
```json
{
  "motherId": "P0123",
  "motherEmail": "mother@example.com",
  "fatherId": "P0456",
  "fatherEmail": "father@example.com",
  "spouseId": "P0789",
  "spouseEmail": "spouse@example.com"
}
```

### Frontend Changes (register.tsx) ✅ COMMITTED
Located in: `kul-setu-appp/app/(tabs)/register.tsx`
Commit: "Add email fields for mother, father, and spouse in registration form"

#### 1. Form State Updated (lines 29-35)
Added email fields to formData:
```tsx
motherEmail: '',
fatherEmail: '',
spouseEmail: '',
```

#### 2. UI Updated (renderFamilyRelations function)
Added email input fields with:
- Email keyboard type (`keyboardType="email-address"`)
- No auto-capitalization (`autoCapitalize="none"`)
- User-friendly placeholders ("Enter mother's email")
- ID fields now marked as "(Optional)"

**New Field Order:**
1. Mother Email (primary)
2. Mother ID (optional)
3. Father Email (primary)
4. Father ID (optional)
5. Spouse Email (primary)
6. Spouse ID (optional)

#### 3. Form Submission Updated (handleSubmit function)
Modified to send email fields to backend:
```tsx
if (formData.motherEmail) memberData.motherEmail = formData.motherEmail;
if (formData.fatherEmail) memberData.fatherEmail = formData.fatherEmail;
if (formData.spouseEmail) memberData.spouseEmail = formData.spouseEmail;
```

#### 4. Form Reset Updated
Added email fields to reset logic to clear them after successful registration.

## How It Works

### Registration Flow
1. User enters relationship emails in form (e.g., "john@family.com")
2. Frontend sends both emails and IDs (if provided) to backend
3. Backend `resolve_relationship_ids()` converts emails to person IDs
4. Backend stores person IDs in database (as before)
5. Backend returns success response

### Search Flow
1. User searches for family members
2. Backend returns results with both IDs and emails
3. Frontend displays results with relationship information
4. Emails can be used for subsequent registrations

## Backward Compatibility
✅ **Fully backward compatible**
- Old code using IDs still works
- Can use emails, IDs, or both
- Database schema unchanged (still stores person IDs)

## User Benefits
- ✅ No need to remember obscure person IDs like "P0692"
- ✅ More intuitive registration process
- ✅ Reduced errors in relationship linking
- ✅ Email-based lookup is more user-friendly
- ✅ Can still use IDs if preferred (marked optional)

## Testing Checklist
- [ ] Register member with mother email only
- [ ] Register member with all relationship emails
- [ ] Register member with mix of emails and IDs
- [ ] Register member with non-existent email (should log warning, continue)
- [ ] Search returns correct emails for relationships
- [ ] Form resets properly after registration
- [ ] Old ID-based registrations still work

## Deployment Status
- ✅ Backend: Deployed to Render (auto-deploy from GitHub)
- ⏳ Frontend: Committed locally, needs to be pushed to GitHub repository

## Next Steps
1. Create GitHub repository for frontend (if not exists)
2. Push frontend changes to GitHub
3. Test end-to-end registration with emails
4. Verify search displays emails correctly
5. Update any display components showing relationships

## Technical Notes
- Backend converts emails to IDs before validation
- Database continues to store person IDs (not emails)
- Email lookup is case-sensitive
- Non-existent emails are logged as warnings, not errors
- Frontend sends both fields to backend for flexibility
