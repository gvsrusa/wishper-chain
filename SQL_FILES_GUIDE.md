# SQL Files Guide for WhisperChain

This guide documents all SQL files in the project and their current relevance.

## Core Schema Files

### ✅ Active/Current Files

1. **database-schema-complete.sql**
   - Original complete schema with UUID-based users table
   - References auth.users (Supabase Auth)
   - Status: PARTIALLY OBSOLETE (auth.users reference not used with Clerk)

2. **database-migration-clerk.sql**
   - Migration script to convert from Supabase Auth to Clerk
   - Changes users.id from UUID to TEXT
   - Status: PARTIALLY APPLIED (kept UUID structure instead)

3. **upsert_user_from_clerk** (function in database)
   - Current function handling Clerk user sync
   - Works with UUID primary keys and clerk_user_id field
   - Status: ACTIVE AND WORKING

## Feature-Specific Schema Files

### Hashtags Feature
- **hashtags-schema.sql** - Complete hashtags implementation
- **hashtags-schema-part1.sql** to **hashtags-schema-part4.sql** - Split version for easier execution
- **ai-hashtags-schema.sql** - AI-generated hashtags functionality
- **update-existing-whispers-hashtags.sql** - Migration for existing whispers
- **update-existing-whispers-hashtags-fixed.sql** - Fixed version of above

### RLS (Row Level Security) Policies
- **clerk-rls-policies.sql** - RLS policies for Clerk integration
- **development-rls-policies.sql** - Permissive policies for development
- **production-rls-policies.sql** - Restrictive policies for production
- **disable-rls-for-testing.sql** - Temporarily disable RLS

## Sample Data Files

- **insert-sample-data.sql** - Original sample data with UUID users
- **insert-sample-data-safe.sql** - Safe version with conflict handling
- **simple-data-insert.sql** - Minimal test data

## Diagnostic/Debug Files

- **check-database-schema.sql** - Check current schema state
- **check-existing-tables.sql** - List all tables
- **check-likes-debug.sql** - Debug likes functionality
- **check-unpublished-whispers.sql** - Find unpublished content
- **diagnose-and-fix-users.sql** - User table diagnostics
- **fix-chain-responses-rls.sql** - Fix chain responses permissions

## Temporary/Fix Files

- **temporary-uuid-fix.sql** - Temporary fixes for UUID issues
- **align-database-with-clerk.sql** - Latest alignment script (RECOMMENDED)

## Current Database State

Your database currently has:
- ✅ Users table with UUID primary keys
- ✅ clerk_user_id column for Clerk integration
- ✅ upsert_user_from_clerk function working correctly
- ✅ All required tables (themes, whispers, etc.)
- ✅ Hashtags functionality
- ✅ Sample data

## Recommended Actions

1. **For Fresh Setup**: Use `database-schema-complete.sql` but modify to include clerk_user_id
2. **For Existing Database**: Use `align-database-with-clerk.sql` to ensure proper setup
3. **For Development**: Use `development-rls-policies.sql` for easier testing
4. **For Production**: Use `production-rls-policies.sql` with proper Clerk integration

## Files to Archive/Remove

These files are no longer needed:
- check-clerk-sync-function.sql (temporary troubleshooting)
- debug-clerk-sync.sql (temporary troubleshooting)
- fix-users-table-id.sql (attempted fix, not needed)
- restore-database-to-working-state.sql (recovery script)
- revert-db-changes.sql (rollback script)