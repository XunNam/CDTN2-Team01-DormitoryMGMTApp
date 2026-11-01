# Management role database test

`managementFoundation.test.ts` exercises all 28 BQL Management service operations and their database invariants against the PostgreSQL schema, including atomic application approval/residence allocation, residence lifecycle transitions, receipt price snapshots/payment, and statistics. It does not claim to verify the authenticated HTTP path: Shared `AUTH-01` is not implemented yet.

The owner must prepare a disposable test database from `SQL/schema.sql`, seed one unlocked staff account with role `BQL`, and configure these variables in `backend/.env.test`:

- `TEST_DATABASE_URL`: the dedicated PostgreSQL test database.
- `MANAGEMENT_TEST_ACCOUNT_ID`: UUID of the unlocked BQL test account.

Do not use production or student data. The test discovers the account's current session version from the database and uses the shared transaction helper (which rechecks it after acquiring the business lock). The profile/building/room rows used by application/residence/receipt history are retained because the schema forbids deleting business history; other unreferenced foundation rows are removed. The registration-period status is restored, but its audit fields and created application/residence/receipt history remain. Run only on a disposable database.

From `backend/`, run:

```powershell
npm run test:integration
```

Expected result: all profile/building/room/period and application/residence/receipt/statistics checks pass, including approve-versus-reject on one application, two approvals competing for the last room place, the fee snapshot remaining unchanged after room price changes, retaining an unpaid receipt through checkout, and allowing payment after checkout. This test is `NOT_RUN_PENDING_OWNER` until run on the prepared PostgreSQL database.
