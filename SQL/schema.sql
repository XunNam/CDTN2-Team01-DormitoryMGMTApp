-- DormFlow specification 1.0.0. Fresh, disposable database only.
-- PostgreSQL 18.6 baseline. SQL/04-transactions-and-locking.md is mandatory.
-- UUID generated with built-in gen_random_uuid(); no extension required.
BEGIN;

CREATE TABLE student_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code varchar(32) NOT NULL UNIQUE CHECK (student_code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
    full_name varchar(150) NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 150 AND full_name = btrim(full_name)),
    gender varchar(6) NOT NULL CHECK (gender IN ('MALE','FEMALE')),
    class_name varchar(100) NOT NULL CHECK (length(btrim(class_name)) BETWEEN 1 AND 100 AND class_name = btrim(class_name)),
    faculty varchar(100) NOT NULL CHECK (length(btrim(faculty)) BETWEEN 1 AND 100 AND faculty = btrim(faculty)),
    phone varchar(21) CHECK (phone ~ '^\+?[0-9]{7,20}$'),
    email varchar(254) CHECK (length(email) BETWEEN 3 AND 254 AND email = btrim(email) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
    date_of_birth date,
    permanent_address varchar(500) CHECK (length(btrim(permanent_address)) BETWEEN 1 AND 500 AND permanent_address = btrim(permanent_address)),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE staff_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(50) NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,49}$'),
    display_name varchar(150) NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 150 AND display_name = btrim(display_name)),
    role varchar(5) NOT NULL CHECK (role IN ('BQL','ADMIN')),
    password_hash text NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
    is_locked boolean NOT NULL DEFAULT false,
    session_version integer NOT NULL DEFAULT 1 CHECK (session_version >= 1),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE student_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE RESTRICT,
    role varchar(2) NOT NULL DEFAULT 'SV' CHECK (role = 'SV'),
    password_hash text NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
    is_locked boolean NOT NULL DEFAULT false,
    session_version integer NOT NULL DEFAULT 1 CHECK (session_version >= 1),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE buildings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(32) NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
    name varchar(150) NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 150 AND name = btrim(name)),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
    code varchar(32) NOT NULL CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
    capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 10000),
    gender varchar(6) NOT NULL CHECK (gender IN ('MALE','FEMALE')),
    fee_vnd bigint NOT NULL CHECK (fee_vnd >= 0),
    status varchar(8) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT rooms_building_code_unique UNIQUE (building_id,code)
);

-- A singleton, not a multi-period management feature.
CREATE TABLE registration_period (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    status varchar(6) NOT NULL DEFAULT 'CLOSED' CHECK (status IN ('OPEN','CLOSED')),
    updated_by uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO registration_period(id,status) VALUES (1,'CLOSED');

CREATE TABLE applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
    preferred_room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    period_id smallint NOT NULL DEFAULT 1 REFERENCES registration_period(id) ON DELETE RESTRICT,
    status varchar(8) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    rejection_reason varchar(500),
    reviewed_by uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT applications_review_fields CHECK (
      (status='PENDING' AND rejection_reason IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL)
      OR (status='APPROVED' AND rejection_reason IS NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
      OR (status='REJECTED' AND rejection_reason IS NOT NULL AND length(btrim(rejection_reason)) BETWEEN 1 AND 500
          AND rejection_reason=btrim(rejection_reason) AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE UNIQUE INDEX applications_one_pending_per_student ON applications(student_id) WHERE status='PENDING';

CREATE TABLE residence_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid NOT NULL UNIQUE REFERENCES applications(id) ON DELETE RESTRICT,
    student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
    room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    status varchar(10) NOT NULL DEFAULT 'ALLOCATED' CHECK (status IN ('ALLOCATED','CHECKED_IN','ENDED','CANCELLED')),
    allocated_by uuid NOT NULL REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    allocated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    check_in_date date,
    checked_in_by uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    checked_in_at timestamptz,
    check_out_date date,
    checked_out_by uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    checked_out_at timestamptz,
    cancellation_reason varchar(500),
    cancelled_by uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    cancelled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT residence_lifecycle_fields CHECK (
      (status='ALLOCATED' AND check_in_date IS NULL AND checked_in_by IS NULL AND checked_in_at IS NULL
        AND check_out_date IS NULL AND checked_out_by IS NULL AND checked_out_at IS NULL
        AND cancellation_reason IS NULL AND cancelled_by IS NULL AND cancelled_at IS NULL)
      OR (status='CHECKED_IN' AND check_in_date IS NOT NULL AND checked_in_by IS NOT NULL AND checked_in_at IS NOT NULL
        AND check_out_date IS NULL AND checked_out_by IS NULL AND checked_out_at IS NULL
        AND cancellation_reason IS NULL AND cancelled_by IS NULL AND cancelled_at IS NULL)
      OR (status='ENDED' AND check_in_date IS NOT NULL AND checked_in_by IS NOT NULL AND checked_in_at IS NOT NULL
        AND check_out_date IS NOT NULL AND checked_out_by IS NOT NULL AND checked_out_at IS NOT NULL
        AND check_out_date >= check_in_date AND cancellation_reason IS NULL AND cancelled_by IS NULL AND cancelled_at IS NULL)
      OR (status='CANCELLED' AND check_in_date IS NULL AND checked_in_by IS NULL AND checked_in_at IS NULL
        AND check_out_date IS NULL AND checked_out_by IS NULL AND checked_out_at IS NULL
        AND cancellation_reason IS NOT NULL AND length(btrim(cancellation_reason)) BETWEEN 1 AND 500 AND cancellation_reason=btrim(cancellation_reason)
        AND cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL))
);
CREATE UNIQUE INDEX residence_one_open_per_student ON residence_records(student_id) WHERE status IN ('ALLOCATED','CHECKED_IN');

CREATE TABLE room_fee_receipts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    residence_id uuid NOT NULL UNIQUE REFERENCES residence_records(id) ON DELETE RESTRICT,
    amount_vnd bigint NOT NULL CHECK (amount_vnd >= 0),
    status varchar(6) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','PAID')),
    created_by uuid NOT NULL REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    payment_date date,
    paid_by uuid REFERENCES staff_accounts(id) ON DELETE RESTRICT,
    paid_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT receipt_payment_fields CHECK (
      (status='UNPAID' AND payment_date IS NULL AND paid_by IS NULL AND paid_at IS NULL)
      OR (status='PAID' AND payment_date IS NOT NULL AND paid_by IS NOT NULL AND paid_at IS NOT NULL))
);

-- Exact table shape expected by connect-pg-simple, tableName: 'sessions'.
CREATE TABLE sessions (
    sid varchar NOT NULL PRIMARY KEY,
    sess json NOT NULL,
    expire timestamp(6) NOT NULL
);
CREATE INDEX sessions_expire_index ON sessions(expire);

CREATE INDEX student_profiles_name_id_idx ON student_profiles(lower(full_name),id);
CREATE INDEX rooms_filter_idx ON rooms(status,building_id,gender,id);
CREATE INDEX applications_student_created_idx ON applications(student_id,created_at DESC,id);
CREATE INDEX applications_status_created_idx ON applications(status,created_at DESC,id);
CREATE INDEX applications_preferred_room_idx ON applications(preferred_room_id);
CREATE INDEX residence_room_status_idx ON residence_records(room_id,status);
CREATE INDEX residence_student_allocated_idx ON residence_records(student_id,allocated_at DESC,id);
CREATE INDEX receipts_status_created_idx ON room_fee_receipts(status,created_at DESC,id);

CREATE VIEW room_availability AS
SELECT r.*, b.code AS building_code, b.name AS building_name,
       count(rr.id)::integer AS allocated_places,
       (r.capacity-count(rr.id))::integer AS available_places
FROM rooms r JOIN buildings b ON b.id=r.building_id
LEFT JOIN residence_records rr ON rr.room_id=r.id AND rr.status IN ('ALLOCATED','CHECKED_IN')
GROUP BY r.id,b.id;

CREATE FUNCTION reject_history_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='HISTORY_DELETE_FORBIDDEN';
END $$;
CREATE FUNCTION require_business_lock() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('transaction_isolation')<>'read committed' OR NOT EXISTS (
      SELECT 1 FROM pg_locks WHERE locktype='advisory' AND pid=pg_backend_pid()
       AND database=(SELECT oid FROM pg_database WHERE datname=current_database())
       AND classid=724006::oid AND objid=1::oid AND objsubid=2
       AND mode='ExclusiveLock' AND granted) THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='BUSINESS_LOCK_REQUIRED';
    END IF;
    RETURN NULL;
END $$;
CREATE FUNCTION preserve_entity_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='IMMUTABLE_FIELD';
    END IF;
    NEW.updated_at=clock_timestamp();
    RETURN NEW;
END $$;
CREATE FUNCTION guard_profile() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.date_of_birth > (clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='INVALID_BIRTH_DATE';
    END IF;
    IF TG_OP='UPDATE' THEN
        IF NEW.student_code IS DISTINCT FROM OLD.student_code THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_FIELD';
        END IF;
        IF NEW.gender IS DISTINCT FROM OLD.gender AND EXISTS (
          SELECT 1 FROM residence_records rr JOIN rooms r ON r.id=rr.room_id
          WHERE rr.student_id=OLD.id AND rr.status IN ('ALLOCATED','CHECKED_IN') AND r.gender<>NEW.gender) THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='GENDER_CONFLICT';
        END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE FUNCTION guard_account() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_ROLE';
    END IF;
    IF TG_TABLE_NAME='student_accounts' THEN
        IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_FIELD';
        END IF;
    ELSE
        IF NEW.username IS DISTINCT FROM OLD.username THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_FIELD';
        END IF;
    END IF;
    IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
        IF NEW.session_version<>OLD.session_version+1 THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='SESSION_VERSION_REQUIRED';
        END IF;
    ELSIF NEW.session_version IS DISTINCT FROM OLD.session_version THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='SESSION_VERSION_REQUIRES_PASSWORD_CHANGE';
    END IF;
    RETURN NEW;
END $$;
CREATE FUNCTION guard_building() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.code IS DISTINCT FROM OLD.code THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_FIELD';
    END IF;
    RETURN NEW;
END $$;
CREATE FUNCTION guard_room() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n integer;
BEGIN
    IF NEW.code IS DISTINCT FROM OLD.code OR NEW.building_id IS DISTINCT FROM OLD.building_id THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_FIELD';
    END IF;
    SELECT count(*) INTO n FROM residence_records WHERE room_id=OLD.id AND status IN ('ALLOCATED','CHECKED_IN');
    IF NEW.capacity<n THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='CAPACITY_BELOW_ALLOCATION'; END IF;
    IF NEW.status='INACTIVE' AND n>0 THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='ROOM_OCCUPIED'; END IF;
    IF EXISTS (SELECT 1 FROM residence_records rr JOIN student_profiles s ON s.id=rr.student_id
      WHERE rr.room_id=OLD.id AND rr.status IN ('ALLOCATED','CHECKED_IN') AND s.gender<>NEW.gender) THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='GENDER_CONFLICT';
    END IF;
    RETURN NEW;
END $$;
CREATE FUNCTION require_bql(account_id uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM staff_accounts WHERE id=account_id AND role='BQL' AND NOT is_locked) THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='BQL_ACTOR_REQUIRED';
    END IF;
END $$;
CREATE FUNCTION guard_period() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status=OLD.status THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='PERIOD_STATE_UNCHANGED'; END IF;
    PERFORM require_bql(NEW.updated_by);
    RETURN NEW;
END $$;
CREATE FUNCTION guard_application() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE room_row rooms%ROWTYPE; student_gender text; n integer;
BEGIN
    IF TG_OP='INSERT' THEN
        IF NEW.status<>'PENDING' THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='INVALID_APPLICATION_STATE'; END IF;
        IF NOT EXISTS (SELECT 1 FROM registration_period WHERE id=NEW.period_id AND status='OPEN') THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='PERIOD_CLOSED';
        END IF;
        IF EXISTS (SELECT 1 FROM residence_records WHERE student_id=NEW.student_id AND status IN ('ALLOCATED','CHECKED_IN')) THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='ACTIVE_RESIDENCE_EXISTS';
        END IF;
        SELECT * INTO STRICT room_row FROM rooms WHERE id=NEW.preferred_room_id;
        SELECT gender INTO student_gender FROM student_profiles WHERE id=NEW.student_id;
        SELECT count(*) INTO n FROM residence_records WHERE room_id=room_row.id AND status IN ('ALLOCATED','CHECKED_IN');
        IF room_row.status<>'ACTIVE' THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='ROOM_INACTIVE'; END IF;
        IF student_gender<>room_row.gender THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='GENDER_MISMATCH'; END IF;
        IF n>=room_row.capacity THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='ROOM_FULL'; END IF;
    ELSE
        IF NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.preferred_room_id IS DISTINCT FROM OLD.preferred_room_id
          OR NEW.period_id IS DISTINCT FROM OLD.period_id THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_FIELD';
        END IF;
        IF OLD.status<>'PENDING' OR NEW.status NOT IN ('APPROVED','REJECTED') THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='INVALID_APPLICATION_STATE';
        END IF;
        PERFORM require_bql(NEW.reviewed_by);
        NEW.reviewed_at=clock_timestamp();
    END IF;
    RETURN NEW;
END $$;
CREATE FUNCTION guard_residence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE app applications%ROWTYPE; room_row rooms%ROWTYPE; student_gender text; n integer; today date;
BEGIN
    today=(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
    IF TG_OP='INSERT' THEN
        IF NEW.status<>'ALLOCATED' THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='INVALID_RESIDENCE_STATE'; END IF;
        SELECT * INTO STRICT app FROM applications WHERE id=NEW.application_id;
        IF app.status<>'APPROVED' OR app.student_id<>NEW.student_id OR app.reviewed_by<>NEW.allocated_by THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='APPLICATION_RESIDENCE_MISMATCH';
        END IF;
        PERFORM require_bql(NEW.allocated_by);
        SELECT * INTO STRICT room_row FROM rooms WHERE id=NEW.room_id;
        SELECT gender INTO student_gender FROM student_profiles WHERE id=NEW.student_id;
        SELECT count(*) INTO n FROM residence_records WHERE room_id=room_row.id AND status IN ('ALLOCATED','CHECKED_IN');
        IF room_row.status<>'ACTIVE' THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='ROOM_INACTIVE'; END IF;
        IF student_gender<>room_row.gender THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='GENDER_MISMATCH'; END IF;
        IF n>=room_row.capacity THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='ROOM_FULL'; END IF;
        NEW.allocated_at=clock_timestamp();
    ELSE
        IF NEW.application_id IS DISTINCT FROM OLD.application_id OR NEW.student_id IS DISTINCT FROM OLD.student_id
          OR NEW.room_id IS DISTINCT FROM OLD.room_id OR NEW.allocated_by IS DISTINCT FROM OLD.allocated_by
          OR NEW.allocated_at IS DISTINCT FROM OLD.allocated_at THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_FIELD';
        END IF;
        IF OLD.status='ALLOCATED' AND NEW.status='CHECKED_IN' THEN
            PERFORM require_bql(NEW.checked_in_by); NEW.checked_in_at=clock_timestamp();
        ELSIF OLD.status='ALLOCATED' AND NEW.status='CANCELLED' THEN
            PERFORM require_bql(NEW.cancelled_by); NEW.cancelled_at=clock_timestamp();
        ELSIF OLD.status='CHECKED_IN' AND NEW.status='ENDED' THEN
            IF NEW.check_in_date IS DISTINCT FROM OLD.check_in_date OR NEW.checked_in_by IS DISTINCT FROM OLD.checked_in_by
              OR NEW.checked_in_at IS DISTINCT FROM OLD.checked_in_at THEN
                RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_HISTORY';
            END IF;
            PERFORM require_bql(NEW.checked_out_by); NEW.checked_out_at=clock_timestamp();
        ELSE RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='INVALID_RESIDENCE_STATE';
        END IF;
    END IF;
    IF NEW.check_in_date>today OR NEW.check_out_date>today THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='FUTURE_BUSINESS_DATE';
    END IF;
    RETURN NEW;
END $$;
CREATE FUNCTION guard_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE res residence_records%ROWTYPE;
BEGIN
    IF TG_OP='INSERT' THEN
        IF NEW.status<>'UNPAID' THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='INVALID_RECEIPT_STATE'; END IF;
        PERFORM require_bql(NEW.created_by);
        SELECT * INTO STRICT res FROM residence_records WHERE id=NEW.residence_id;
        IF res.status NOT IN ('ALLOCATED','CHECKED_IN') THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='RESIDENCE_NOT_BILLABLE';
        END IF;
        -- Authoritative snapshot is current room price, never client amount.
        SELECT fee_vnd INTO NEW.amount_vnd FROM rooms WHERE id=res.room_id;
    ELSE
        IF NEW.residence_id IS DISTINCT FROM OLD.residence_id OR NEW.amount_vnd IS DISTINCT FROM OLD.amount_vnd
          OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='IMMUTABLE_RECEIPT_SNAPSHOT';
        END IF;
        IF OLD.status<>'UNPAID' OR NEW.status<>'PAID' THEN
            RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='INVALID_RECEIPT_STATE';
        END IF;
        PERFORM require_bql(NEW.paid_by); NEW.paid_at=clock_timestamp();
    END IF;
    IF NEW.payment_date>(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='FUTURE_BUSINESS_DATE';
    END IF;
    RETURN NEW;
END $$;

-- Approval + residence must commit together; API updates application then inserts residence.
CREATE FUNCTION check_application_residence_pair() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE app_id uuid; app applications%ROWTYPE; n integer;
BEGIN
    IF TG_TABLE_NAME='applications' THEN app_id=NEW.id; ELSE app_id=NEW.application_id; END IF;
    SELECT * INTO app FROM applications WHERE id=app_id;
    SELECT count(*) INTO n FROM residence_records WHERE application_id=app_id AND student_id=app.student_id;
    IF (app.status='APPROVED' AND n<>1) OR (app.status<>'APPROVED' AND n<>0) THEN
        RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='APPLICATION_RESIDENCE_MISMATCH';
    END IF;
    RETURN NULL;
END $$;

DO $$ DECLARE table_name text; BEGIN
    FOREACH table_name IN ARRAY ARRAY['student_profiles','student_accounts','staff_accounts','buildings','rooms','registration_period','applications','residence_records','room_fee_receipts'] LOOP
        EXECUTE format('CREATE TRIGGER business_lock BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH STATEMENT EXECUTE FUNCTION require_business_lock()',table_name);
        EXECUTE format('CREATE TRIGGER preserve_identity BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION preserve_entity_identity()',table_name);
    END LOOP;
    FOREACH table_name IN ARRAY ARRAY['applications','residence_records','room_fee_receipts','registration_period'] LOOP
        EXECUTE format('CREATE TRIGGER preserve_history BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION reject_history_delete()',table_name);
        EXECUTE format('CREATE TRIGGER preserve_history_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION reject_history_delete()',table_name);
    END LOOP;
END $$;
CREATE TRIGGER profile_rules BEFORE INSERT OR UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION guard_profile();
CREATE TRIGGER student_account_rules BEFORE UPDATE ON student_accounts FOR EACH ROW EXECUTE FUNCTION guard_account();
CREATE TRIGGER staff_account_rules BEFORE UPDATE ON staff_accounts FOR EACH ROW EXECUTE FUNCTION guard_account();
CREATE TRIGGER building_rules BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION guard_building();
CREATE TRIGGER room_rules BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION guard_room();
CREATE TRIGGER period_rules BEFORE UPDATE ON registration_period FOR EACH ROW EXECUTE FUNCTION guard_period();
CREATE TRIGGER application_rules BEFORE INSERT OR UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION guard_application();
CREATE TRIGGER residence_rules BEFORE INSERT OR UPDATE ON residence_records FOR EACH ROW EXECUTE FUNCTION guard_residence();
CREATE TRIGGER receipt_rules BEFORE INSERT OR UPDATE ON room_fee_receipts FOR EACH ROW EXECUTE FUNCTION guard_receipt();
CREATE CONSTRAINT TRIGGER application_pair AFTER INSERT OR UPDATE ON applications DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_application_residence_pair();
CREATE CONSTRAINT TRIGGER residence_pair AFTER INSERT OR UPDATE ON residence_records DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_application_residence_pair();

COMMIT;
