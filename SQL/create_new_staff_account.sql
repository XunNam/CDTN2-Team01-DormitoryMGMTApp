BEGIN ISOLATION LEVEL READ COMMITTED;

SELECT pg_advisory_xact_lock(724006, 1);

INSERT INTO public.staff_accounts
    (username, display_name, role, password_hash)
VALUES
    (
        'username',
        'displayed_name',
        'role [ADMIN, BQL]',
        'ARGON2ID HASH'
    )
RETURNING id, username, display_name, role, is_locked;

COMMIT;