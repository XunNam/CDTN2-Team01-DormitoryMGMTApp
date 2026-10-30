# Công cụ kiểm tra bộ đặc tả

Dùng Python3.10+ chuẩn thư viện; không cần pip cho hai script dưới đây. Từ repo root:

```powershell
python tools/build_contract_artifacts.py
python tools/check_specification.py
```

Script build dẫn xuất README API, OpenAPI JSON và request HTTP từ manifest, schemas và các ví dụ operation trong Markdown; không sửa bản dẫn xuất riêng. Script check kiểm tra liên kết, JSON, operation duy nhất, sourcehashSRS và schema/response mẫu. Đây là kiểm tra tài liệu, không là runtime API/DB hoặcNFR.

SQL/tools/build_dictionary.py dùng để cập nhật data dictionary sau thay đổi schema đã được giao. Backend kiểm riêng bằng npm run check. .qa chứa các phụ thuộc/kết quả kiểm tra tạm, không đưa lênGit.
