"""Regenerate a reviewable column inventory; no database connection."""
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
sql=(root/'schema.sql').read_text(encoding='utf-8')
def camel(value):
    a,*b=value.split('_');return a+''.join(v.title() for v in b)
purpose={
'student_profiles':'Hồ sơ sinh viên do BQL tạo trước; SV chỉ đọc riêng và sửa phone/email.',
'student_accounts':'Kho đăng nhập SV; studentId duy nhất, role cố định SV. Admin cấp/khóa, chủ thể đổi mật khẩu.',
'staff_accounts':'Kho đăng nhập BQL/Admin; username bất biến, không kế thừa quyền nghiệp vụ.',
'buildings':'Danh mục tòa nhà; BQL tạo/sửa tên, code bất biến.',
'rooms':'Phòng thuộc tòa; BQL quản lý, SV chỉ đọc phòng ACTIVE. Chỗ còn lại lấy từ view.',
'registration_period':'Singleton numeric id=1; BQL mở/đóng, không tạo nhiều kỳ.',
'applications':'SV gửi đơn PENDING cho mình; BQL duyệt hoặc từ chối; nguồn/owner bất biến.',
'residence_records':'BQL tạo atomically khi duyệt và cập nhật bằng action nhận/hủy/trả, không PATCH trạng thái tùy ý.',
'room_fee_receipts':'BQL lập một phiếu/residence và xác nhận toàn bộ. amountVnd snapshot bất biến.',
'sessions':'Session store nội bộ connect-pg-simple. Không phải DTO và không được trả qua API.'}
special={
'id':'Server sinh UUID, bất biến; registration_period.id là smallint cố định 1.',
'password_hash':'Nội bộ; Argon2id. KHÔNG có field passwordHash trong response/log.',
'session_version':'Nội bộ; tăng đúng 1 khi hash đổi; không trả trong DTO.',
'is_locked':'Admin thay đổi; false mặc định. Guard đọc fresh mỗi request.',
'created_at':'Timestamp UTC do server/DB sinh, bất biến; chỉ trả khi DTO tương ứng có field.',
'updated_at':'Timestamp UTC trigger cập nhật; chỉ trả khi DTO tương ứng có field.',
'fee_vnd':'Input/output API feeVnd là chuỗi số nguyên canonical 0..9223372036854775807.',
'amount_vnd':'API amountVnd là chuỗi; SQL trigger lấy rooms.fee_vnd lúc lập, không nhận amount từ client.',
'student_id':'FK student_profiles.id; SV lấy từ principal, không cho chọn owner bằng request.',
'reviewed_by':'FK staff_accounts BQL; server lấy actor, trigger xác nhận role/khóa tại lúc ghi.',
'allocated_by':'BQL actor server; phải bằng reviewer của đơn được duyệt.',
'checked_in_by':'BQL actor server khi nhận phòng.',
'checked_out_by':'BQL actor server khi trả phòng.',
'cancelled_by':'BQL actor server khi hủy xếp.',
'created_by':'BQL actor server khi lập phiếu.',
'paid_by':'BQL actor server khi xác nhận toàn bộ.',
'updated_by':'BQL actor server mở/đóng kỳ; null chỉ lúc khởi tạo CLOSED.',
'date_of_birth':'Nullable, ngày <= hôm nay tại Asia/Ho_Chi_Minh; không dùng ngày giả.',
'check_in_date':'DATE ngày nghiệp vụ <= hôm nay; chỉ khi nhận phòng.',
'check_out_date':'DATE <= hôm nay và >=check_in_date; giữ check-in metadata cũ.',
'payment_date':'DATE <= hôm nay; ngày nhận đủ tiền nhập bởi BQL.',
'phone':'Nullable, optional + rồi 7..20 chữ số, tổng tối đa21 ký tự.',
'email':'Nullable, email có giá trị phải hợp lệ; không UNIQUE, không bắt buộc email trường.',
'permanent_address':'Nullable, khi có trim và1..500; chỉ BQL sửa.',
'sid':'Session ID nội bộ; không log hoặc đưa vào JSON.',
'sess':'JSON session nội bộ gồm cookie/principal/CSRF; không chứa password/hash.',
'expire':'timestamp(6) tương thích store; DB process/session timezone UTC, không phải ngày nghiệp vụ.'}
lines=['# Từ điển dữ liệu và mapping API SQL','','Revision **1.0.0**. Cột/length/null/default là `DELEGATED_SELECTION` theo prompt chốt schema; nghiệp vụ giữ SRS và Q-25..27. DDL là nguồn chuẩn cấu trúc, [schemas.json](<../API Endpoint/Shared/schemas.json>) là nguồn chuẩn field công khai. Không tự expose mọi cột chỉ vì có mapping dưới đây.','','## Quy tắc chung','','- UUID/PK/FK trả chuỗi; smallint kỳ trả số1; BIGINT tiền trả chuỗi canonical. JS không chuyển tiền sang Number.','- TIMESTAMPTZ trả ISO8601 UTC; DATE trả YYYY-MM-DD. NULL SQL -> null JSON khi DTO cho phép, không bỏ trường required.','- Request PATCH thiếu=giữ nguyên; null chỉ cho trường nullable; unknown field422. Profile SV chỉ allowlist phone/email.','- Business keys trim/uppercase (studentCode,code), username trim/lowercase; không trim hoặc biến đổi password. Họ tên/class/faculty/address trim; chuỗi rỗng không thay null.','- Độ dài varchar của PostgreSQL tính ký tự; capacity integer1..10000; tên1..150, class/faculty1..100. Validate trước SQL để trả lỗi422 theo field.','- DTO phải SELECT/map allowlist theo từng endpoint, join tên tòa/phòng khi được phép. Không trả passwordHash/sessionVersion/session blob.','- Tất cả trường actor/time, owner sinh viên, status mặc định và giá phiếu do server xác định; client không tự gửi để nhận quyền.','','## Bảng và cột','']
count=0
for name,body in re.findall(r'CREATE TABLE (\w+) \((.*?)\n\);',sql,re.S):
    cols=[]
    for line in body.splitlines():
        m=re.match(r'    ([a-z][a-z_0-9]*) (uuid|varchar(?:\(\d+\))?|text|integer|smallint|bigint|boolean|timestamptz|timestamp\(6\)|date|json)(?=[ ,])(.*)',line)
        if m:cols.append((m.group(1),m.group(2),m.group(3).rstrip(',')))
    lines += [f'### {name}','',purpose[name],'','| SQL | API mapping | Kiểu và ràng buộc khai báo | Ý nghĩa và quyền ghi |','|---|---|---|---|']
    for col,typ,rest in cols:
        count+=1
        mapping='Nội bộ' if col in ['password_hash','session_version','sid','sess','expire'] else f'`{camel(col)}`'
        definition=(typ+rest).replace('|','\\|')
        notes=special.get(col,'Theo tên field và trạng thái/allowlist của operation; xem DDL và API schema chuẩn.')
        lines.append(f'| `{col}` | {mapping} | `{definition}` | {notes} |')
    lines.append('')
lines += ['## Trường suy ra và nguồn đọc','','| API field | Nguồn | Phạm vi |','|---|---|---|','| allocatedPlaces | view room_availability.allocated_places | COUNT residence ALLOCATED/CHECKED_IN |','| availablePlaces | view room_availability.available_places | capacity - allocatedPlaces, không clamp để che lỗi |','| buildingCode, buildingName | JOIN buildings qua room.building_id | Room DTO; không trả danh sách người ở cho SV |','| accountType | STUDENT nếu student_accounts, STAFF nếu staff_accounts | DTO account theo contract, không là role thứ tư |','| identifier | student_profiles.student_code hoặc staff_accounts.username | Login/account metadata, không password/hash |','| totalItems,totalPages | COUNT cùng snapshot và ceil(totalItems/pageSize) | meta phân trang, không cột SQL |','','Mọi nullable/default và CHECK đầy đủ xem [schema.sql](schema.sql). Các CHECK/triggers liên cột và liên bảng xem [constraints](03-constraints-and-indexes.md); dictionary không thay thế protocol transaction.','',f'Inventory tự động: **{count} cột** trong **10 bảng**. Regenerate bằng Python chuẩn `SQL/tools/build_dictionary.py`, rồi review ngữ nghĩa và thay đổi DTO.']
(root/'01-data-dictionary.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f'Wrote dictionary: {count} columns')
