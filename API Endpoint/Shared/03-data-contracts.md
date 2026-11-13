# DTO và request schema chuẩn

Nguồn máy duy nhất của field/type/required/null/enum là [schemas.json](schemas.json), dữ liệu minh họa ở [examples.json](examples.json). Không trả nguyên row SQL. Chỉ serialize đúng key DTO; mọi key của response đều có mặt, trường chưa phát sinh dùng null. `required` của request có ý nghĩa khác: trường optional bị thiếu dùng mặc định bên dưới. [Data dictionary](../../SQL/01-data-dictionary.md) ánh xạ JSON sang SQL.

## Response

- StudentProfile: id là UUID hồ sơ, studentCode bất biến; profile có thể chưa có account. Điện thoại/email/dateOfBirth/permanentAddress nullable. Lớp/khoa tách và bắt buộc.
- Account: id là UUID account, không là profile ID. actorKind STUDENT/STAFF; STUDENT roleSV và studentId khácnull; STAFF roleBQL/ADMIN và studentIdnull. identifier=studentCode hoặc username; displayName=profile.fullName hoặc staff.display_name. Không passwordHash/sessionVersion trong response.
- Identity: giống metadata danh tính, key accountId thayid; không isLocked/timestamp. Tài khoản bị khóa không được đọc Identity.
- Building: id/code/name/createdAt/updatedAt; không thêm trạng thái tòa.
- Room: flat buildingId/buildingCode/buildingName cùng dữ liệu phòng; allocatedPlaces=count residence ALLOCATED/CHECKED_IN, availablePlaces=capacity-allocatedPlaces. Không lưu counter chỗ; số liệu của phòng INACTIVE vẫn tính đúng ở BQL, SV không xem phòng INACTIVE qua endpoint phòng.
- RegistrationPeriod: id số1 duy nhất, status OPEN/CLOSED, updatedBy staff UUID hoặcnull lúc khởi tạo, updatedAt server. Không API tạo kỳ mới.
- Application: trạng tháiPENDING/APPROVED/REJECTED; rejectionReason chỉ REJECTED; reviewedBy/reviewedAt null khi PENDING. preferredRoomId giữ nguyện vọng gốc ngay cả khi BQL xếp phòng khác; không sửa đơn cũ.
- Residence: applicationId/studentId/roomId/status cùng allocatedBy/At và các ngày/người/thời điểm nhận, trả, hủy; các key chưa phát sinhnull. Không nhúng thông tin bạn cùng phòng. approved application nối đúng một residence, roomId là phòng thực xếp.
- Receipt: residenceId, amountVnd snapshot, status UNPAID/PAID, createdBy/At, paymentDate/paidBy/paidAt nullable khi UNPAID. Không mã phiếu riêng/hạn thu/phụ phí. ID UUID dùng để in biên nhận; biên nhận UI lấy chính Receipt.
- ApprovalResult: application đãAPPROVED và residence mớiALLOCATED trong cùng response.
- ProfileCandidate: id/studentCode/fullName/hasAccount=false, chỉ hồ sơ chưa có account; không rò liên hệ.
- Statistics: totalRooms=phòng ACTIVE; availablePlaces=tổng chỗ còn phòng ACTIVE; currentResidents=tất cả residence CHECKED_IN; unpaidReceipts=tất cả receipt UNPAID kể cả đãtrả/hủy. Dữ liệu rỗng bốn giá trị0.

## Quy tắc request bổ sung JSON Schema

ProfileCreate: thiếu các field nullable tự lưu null; không tự sinh dữ liệu giả. ProfilePatch không cho studentCode; ContactPatch chỉ phone/email. BuildingPatch chỉ name. RoomCreate bắt buộc status (không mặc định ngầm), buildingId/code bất biến ở RoomPatch.

AccountCreate là oneOf phân biệt accountType. STUDENT gồm accountType,studentId,role=SV,password. STAFF gồm accountType,username,displayName,role=BQL|ADMIN,password. Cả hai server sinh id/isLocked=false/sessionVersion=1. Không gửi mật khẩu lại trong response.

Mật khẩu8..128 code points, không bắt buộc tổ hợp ký tự ngoài giới hạn này, không trim. newPassword phải khác currentPassword. Chọn Argon2id memoryCost65536KiB,timeCost3,parallelism1,hashLength64 (64 byte); library tự salt. Áp dụng cho mật khẩu mới/cập nhật; hash 32 byte đã lưu vẫn được xác minh bình thường. Không dùng dữ liệu password minh họa làm secret triển khai.

Tất cả mutation trạng thái đi qua action chuyên biệt; không PATCH status tổng quát trừ period và phòng/accountlock đã chỉ định. Không sinh viên tự hủy đơn; không đổi role/reset-password/delete.

Query schemas trong schemas.json thể hiện superset cho BQL. SV loại status khỏi RoomQuery (server luônACTIVE); ApplicationQuery SV chỉpage/pageSize/status; ResidenceQuery SV chỉpage/pageSize/status; ReceiptQuery SV chỉpage/pageSize/status; Student buildings chỉ PageQuery. BQL dùng đầy đủ schema. Không nhận filter không nêu.

Schema tiền có pattern tối đa19digits nhưng cần semantic check <=BIGINT_MAX; date phải kiểm chứng lịch+today ngoài format. Query wire là chuỗi, parser kiểm tra trước đổi thành typed values. examples.json chỉ minh họa, không là bản định nghĩa độc lập.

Mã phòng cho phép dấu chấm sau ký tự đầu tiên, ví dụ `I.01.01`, tối đa 32 ký tự. Giữ chuẩn trim/uppercase và duy nhất trong tòa. Không mở rộng quy tắc mã sinh viên hoặc mã tòa. Nguồn OWNER_CONFIRMED: yêu cầu ngày 14/11/2026.
