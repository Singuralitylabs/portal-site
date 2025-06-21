-- Add bio column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(500);
