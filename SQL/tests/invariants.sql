-- Run only on a fresh disposable database AFTER schema.sql; all fixtures rollback.
-- Prefix-only fake hash is NOT a working password and never used for login.
BEGIN ISOLATION LEVEL READ COMMITTED;
-- Deliberately missing protocol: statement trigger must reject any business write.
DO $$ BEGIN
  BEGIN
    INSERT INTO buildings(code,name) VALUES ('NOLOCK','Must not be inserted');
    RAISE EXCEPTION 'Expected missing lock rejected';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT pg_advisory_xact_lock(724006,1);

INSERT INTO staff_accounts(id,username,display_name,role,password_hash) VALUES
('10000000-0000-4000-8000-000000000001','test.admin','Test Admin','ADMIN','$argon2id$fixture-not-for-login'),
('10000000-0000-4000-8000-000000000002','test.bql','Test BQL','BQL','$argon2id$fixture-not-for-login');
INSERT INTO student_profiles(id,student_code,full_name,gender,class_name,faculty) VALUES
('20000000-0000-4000-8000-000000000001','TEST001','Test Student One','MALE','TEST','TEST'),
('20000000-0000-4000-8000-000000000002','TEST002','Test Student Two','MALE','TEST','TEST'),
('20000000-0000-4000-8000-000000000003','TEST003','Test Student Three','MALE','TEST','TEST');
INSERT INTO student_accounts(student_id,password_hash) VALUES
('20000000-0000-4000-8000-000000000001','$argon2id$fixture-not-for-login');
INSERT INTO buildings(id,code,name) VALUES ('30000000-0000-4000-8000-000000000001','TEST','Test building');
INSERT INTO rooms(id,building_id,code,capacity,gender,fee_vnd) VALUES
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','T101',1,'MALE',1000000);
UPDATE registration_period SET status='OPEN',updated_by='10000000-0000-4000-8000-000000000002' WHERE id=1;
INSERT INTO applications(id,student_id,preferred_room_id) VALUES
('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001'),
('50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001'),
('50000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001');

DO $$ BEGIN
  IF (SELECT available_places FROM room_availability WHERE code='T101')<>1 THEN RAISE EXCEPTION 'Sending application must not reserve'; END IF;
  BEGIN
    INSERT INTO student_profiles(student_code,full_name,gender,class_name,faculty) VALUES ('TEST001','Duplicate','MALE','TEST','TEST');
    RAISE EXCEPTION 'Expected duplicate student code';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO student_accounts(student_id,password_hash) VALUES ('20000000-0000-4000-8000-000000000001','$argon2id$duplicate');
    RAISE EXCEPTION 'Expected duplicate student account';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO applications(student_id,preferred_room_id) VALUES ('20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001');
    RAISE EXCEPTION 'Expected duplicate pending application';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    UPDATE staff_accounts SET role='BQL' WHERE username='test.admin';
    RAISE EXCEPTION 'Expected immutable role';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE student_accounts SET password_hash='$argon2id$new-hash' WHERE student_id='20000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Expected session version required';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

UPDATE applications SET status='APPROVED',reviewed_by='10000000-0000-4000-8000-000000000002'
 WHERE id='50000000-0000-4000-8000-000000000001';
INSERT INTO residence_records(id,application_id,student_id,room_id,allocated_by) VALUES
('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',
 '40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

DO $$ BEGIN
  IF (SELECT available_places FROM room_availability WHERE code='T101')<>0 THEN RAISE EXCEPTION 'Allocation must reserve one place'; END IF;
  BEGIN
    UPDATE applications SET status='APPROVED',reviewed_by='10000000-0000-4000-8000-000000000002' WHERE id='50000000-0000-4000-8000-000000000002';
    INSERT INTO residence_records(application_id,student_id,room_id,allocated_by) VALUES
      ('50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
    RAISE EXCEPTION 'Expected room full';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF (SELECT status FROM applications WHERE id='50000000-0000-4000-8000-000000000002')<>'PENDING' THEN RAISE EXCEPTION 'Failed approval must rollback'; END IF;
  BEGIN
    UPDATE rooms SET status='INACTIVE' WHERE code='T101';
    RAISE EXCEPTION 'Expected occupied room guard';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE student_profiles SET gender='FEMALE' WHERE student_code='TEST001';
    RAISE EXCEPTION 'Expected active residence gender guard';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

UPDATE rooms SET fee_vnd=2000000 WHERE code='T101';
INSERT INTO room_fee_receipts(id,residence_id,created_by) VALUES
('70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
UPDATE rooms SET fee_vnd=3000000 WHERE code='T101';
DO $$ BEGIN
  IF (SELECT amount_vnd FROM room_fee_receipts WHERE id='70000000-0000-4000-8000-000000000001')<>2000000 THEN RAISE EXCEPTION 'Price snapshot wrong'; END IF;
  BEGIN
    INSERT INTO room_fee_receipts(residence_id,created_by) VALUES ('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
    RAISE EXCEPTION 'Expected duplicate receipt';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    UPDATE room_fee_receipts SET amount_vnd=4 WHERE id='70000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Expected immutable snapshot';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

UPDATE residence_records SET status='CHECKED_IN',check_in_date=(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
 checked_in_by='10000000-0000-4000-8000-000000000002' WHERE id='60000000-0000-4000-8000-000000000001';
DO $$ BEGIN
  IF (SELECT available_places FROM room_availability WHERE code='T101')<>0 THEN RAISE EXCEPTION 'Check-in must not reserve twice'; END IF;
END $$;
UPDATE residence_records SET status='ENDED',check_out_date=(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
 checked_out_by='10000000-0000-4000-8000-000000000002' WHERE id='60000000-0000-4000-8000-000000000001';
DO $$ BEGIN
  IF (SELECT available_places FROM room_availability WHERE code='T101')<>1 THEN RAISE EXCEPTION 'Checkout must release once'; END IF;
  IF (SELECT status FROM room_fee_receipts WHERE id='70000000-0000-4000-8000-000000000001')<>'UNPAID' THEN RAISE EXCEPTION 'Debt must survive checkout'; END IF;
  BEGIN
    UPDATE residence_records SET status='ENDED' WHERE id='60000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Expected repeated checkout rejected';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    DELETE FROM room_fee_receipts WHERE id='70000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Expected history deletion rejected';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE room_fee_receipts SET status='PAID',payment_date=(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
 paid_by='10000000-0000-4000-8000-000000000002' WHERE id='70000000-0000-4000-8000-000000000001';
DO $$ BEGIN
  BEGIN
    UPDATE room_fee_receipts SET status='PAID' WHERE id='70000000-0000-4000-8000-000000000001';
    RAISE EXCEPTION 'Expected repeated payment rejected';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

-- Free price is valid and does not imply PAID. Reuse second waiting application.
UPDATE rooms SET fee_vnd=0 WHERE code='T101';
UPDATE applications SET status='APPROVED',reviewed_by='10000000-0000-4000-8000-000000000002' WHERE id='50000000-0000-4000-8000-000000000002';
INSERT INTO residence_records(id,application_id,student_id,room_id,allocated_by) VALUES
('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',
 '40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
INSERT INTO room_fee_receipts(id,residence_id,created_by) VALUES
('70000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002');
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM room_fee_receipts WHERE id='70000000-0000-4000-8000-000000000002' AND amount_vnd=0 AND status='UNPAID') THEN
    RAISE EXCEPTION 'Zero price must remain unpaid';
  END IF;
  BEGIN
    UPDATE residence_records SET status='CHECKED_IN',check_in_date=((clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date+1),
      checked_in_by='10000000-0000-4000-8000-000000000002' WHERE id='60000000-0000-4000-8000-000000000002';
    RAISE EXCEPTION 'Expected future business date rejected';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE residence_records SET status='CANCELLED',cancellation_reason='Test no-show',cancelled_by='10000000-0000-4000-8000-000000000002'
 WHERE id='60000000-0000-4000-8000-000000000002';
DO $$ BEGIN
  IF (SELECT available_places FROM room_availability WHERE code='T101')<>1 THEN RAISE EXCEPTION 'Cancellation must release one place'; END IF;
  IF NOT EXISTS (SELECT 1 FROM room_fee_receipts WHERE id='70000000-0000-4000-8000-000000000002' AND status='UNPAID') THEN RAISE EXCEPTION 'Cancellation lost debt'; END IF;
END $$;
SET CONSTRAINTS ALL IMMEDIATE;
DO $$ BEGIN
  -- Immediate mode ensures an approved application cannot be committed alone.
  BEGIN
    UPDATE applications SET status='APPROVED',reviewed_by='10000000-0000-4000-8000-000000000002' WHERE id='50000000-0000-4000-8000-000000000003';
    RAISE EXCEPTION 'Expected deferred pair guard';
  EXCEPTION WHEN check_violation THEN NULL; END;
  RAISE NOTICE 'All schema integrity assertions passed; fixtures will rollback.';
END $$;
ROLLBACK;
