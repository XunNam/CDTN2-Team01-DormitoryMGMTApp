-- Owner action for the local DormFlow database, not a schema migration.
-- Run while connected to dormitory-db as the owner of its public objects (e.g. postgres).
-- Grants only runtime access to the existing application tables/view; no ownership,
-- role membership, schema creation, superuser or database-creation privileges change.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'dormitory-db' THEN
    RAISE EXCEPTION 'Connect to dormitory-db before running this local access script.';
  END IF;
END $$;
GRANT CONNECT ON DATABASE "dormitory-db" TO codex;
GRANT USAGE ON SCHEMA public TO codex;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.student_profiles, public.student_accounts, public.staff_accounts,
  public.buildings, public.rooms, public.registration_period, public.applications,
  public.residence_records, public.room_fee_receipts, public.sessions TO codex;
GRANT SELECT ON public.room_availability TO codex;
COMMIT;
