-- OWNER_CONFIRMED 2026-11-14: allow dotted room codes; existing rows preserved.
-- Apply only to the verified 1.0.0 baseline. ACCESS EXCLUSIVE lock held until commit.
BEGIN;
ALTER TABLE rooms DROP CONSTRAINT rooms_code_check;
ALTER TABLE rooms ADD CONSTRAINT rooms_code_check CHECK (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,31}$');
COMMIT;
