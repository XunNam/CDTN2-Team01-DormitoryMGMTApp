# Danh mục API revision 1.0.0

**SPECIFIED_NOT_IMPLEMENTED.** Danh mục HTTP dùng chung cho ba role. Đọc [AGENTS](AGENTS.md), [Shared](Shared/00-conventions.md), [DTO](Shared/03-data-contracts.md), [schema PostgreSQL](../SQL/schema.sql) và [hướng dẫn nhận việc](../Coordination/README.md).

51 operation: 5 Shared, 13 SV, 28 BQL, 5 ADMIN. Shared không là role thứ tư. Role người làm không đồng nghĩa role tài khoản thử nghiệm.

| operationId | Method | URL | Role | Contract | Code |
|---|---|---|---|---|---|
| `getCsrfToken` | GET | `/api/v1/auth/csrf` | SHARED | [Chi tiết](<Shared/01-authentication.md>) | `backend/src/shared/auth` |
| `login` | POST | `/api/v1/auth/login` | SHARED | [Chi tiết](<Shared/01-authentication.md>) | `backend/src/shared/auth` |
| `logout` | POST | `/api/v1/auth/logout` | SHARED | [Chi tiết](<Shared/01-authentication.md>) | `backend/src/shared/auth` |
| `changePassword` | POST | `/api/v1/auth/change-password` | SHARED | [Chi tiết](<Shared/01-authentication.md>) | `backend/src/shared/auth` |
| `getCurrentIdentity` | GET | `/api/v1/auth/me` | SHARED | [Chi tiết](<Shared/01-authentication.md>) | `backend/src/shared/auth` |
| `studentGetProfile` | GET | `/api/v1/student/profile` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentUpdateContact` | PATCH | `/api/v1/student/profile` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentListBuildings` | GET | `/api/v1/student/buildings` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentListRooms` | GET | `/api/v1/student/rooms` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentGetRoom` | GET | `/api/v1/student/rooms/{roomId}` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentGetPeriod` | GET | `/api/v1/student/registration-period` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentCreateApplication` | POST | `/api/v1/student/applications` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentListApplications` | GET | `/api/v1/student/applications` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentGetApplication` | GET | `/api/v1/student/applications/{applicationId}` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentListResidences` | GET | `/api/v1/student/residences` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentGetResidence` | GET | `/api/v1/student/residences/{residenceId}` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentListReceipts` | GET | `/api/v1/student/receipts` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `studentGetReceipt` | GET | `/api/v1/student/receipts/{receiptId}` | SV | [Chi tiết](<Student/API-Contract.md>) | `backend/src/roles/student` |
| `managementListProfiles` | GET | `/api/v1/management/student-profiles` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementCreateProfile` | POST | `/api/v1/management/student-profiles` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetProfile` | GET | `/api/v1/management/student-profiles/{studentId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementUpdateProfile` | PATCH | `/api/v1/management/student-profiles/{studentId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementListBuildings` | GET | `/api/v1/management/buildings` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementCreateBuilding` | POST | `/api/v1/management/buildings` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetBuilding` | GET | `/api/v1/management/buildings/{buildingId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementUpdateBuilding` | PATCH | `/api/v1/management/buildings/{buildingId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementListRooms` | GET | `/api/v1/management/rooms` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementCreateRoom` | POST | `/api/v1/management/rooms` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetRoom` | GET | `/api/v1/management/rooms/{roomId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementUpdateRoom` | PATCH | `/api/v1/management/rooms/{roomId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetPeriod` | GET | `/api/v1/management/registration-period` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementUpdatePeriod` | PATCH | `/api/v1/management/registration-period` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementListApplications` | GET | `/api/v1/management/applications` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetApplication` | GET | `/api/v1/management/applications/{applicationId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementApproveApplication` | POST | `/api/v1/management/applications/{applicationId}/approve` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementRejectApplication` | POST | `/api/v1/management/applications/{applicationId}/reject` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementListResidences` | GET | `/api/v1/management/residences` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetResidence` | GET | `/api/v1/management/residences/{residenceId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementCheckIn` | POST | `/api/v1/management/residences/{residenceId}/check-in` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementCancelAllocation` | POST | `/api/v1/management/residences/{residenceId}/cancel` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementCheckOut` | POST | `/api/v1/management/residences/{residenceId}/check-out` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementListReceipts` | GET | `/api/v1/management/receipts` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementCreateReceipt` | POST | `/api/v1/management/receipts` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetReceipt` | GET | `/api/v1/management/receipts/{receiptId}` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementPayReceipt` | POST | `/api/v1/management/receipts/{receiptId}/pay` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `managementGetStatistics` | GET | `/api/v1/management/statistics` | BQL | [Chi tiết](<Dormitory Management/API-Contract.md>) | `backend/src/roles/management` |
| `adminListAccounts` | GET | `/api/v1/admin/accounts` | ADMIN | [Chi tiết](<System Admin/API-Contract.md>) | `backend/src/roles/admin` |
| `adminGetAccount` | GET | `/api/v1/admin/accounts/{actorKind}/{accountId}` | ADMIN | [Chi tiết](<System Admin/API-Contract.md>) | `backend/src/roles/admin` |
| `adminCreateAccount` | POST | `/api/v1/admin/accounts` | ADMIN | [Chi tiết](<System Admin/API-Contract.md>) | `backend/src/roles/admin` |
| `adminSetAccountLock` | PATCH | `/api/v1/admin/accounts/{actorKind}/{accountId}/lock` | ADMIN | [Chi tiết](<System Admin/API-Contract.md>) | `backend/src/roles/admin` |
| `adminListProfileCandidates` | GET | `/api/v1/admin/student-profiles/candidates` | ADMIN | [Chi tiết](<System Admin/API-Contract.md>) | `backend/src/roles/admin` |

## Nguồn và đầu ra dẫn xuất

Markdown mô tả hành vi và Shared/schemas.json định nghĩa dữ liệu. [OpenAPI JSON](openapi.json) và [request mẫu](requests.http) sinh bằng `python tools/build_contract_artifacts.py`; không sửa riêng bản dẫn xuất. Chạy `python tools/check_specification.py` để phát hiện lệch. Chưa coi việc có contract/OpenAPI là API đã hoạt động.
