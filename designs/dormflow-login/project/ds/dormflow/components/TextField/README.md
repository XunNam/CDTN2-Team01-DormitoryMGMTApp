Thu thập identifier và mật khẩu bằng trường có nhãn rõ.

Input cao 52px, radius-control, border 1px bằng border, padding ngang 16px. Identifier autocomplete=username, autocapitalize=none, spellcheck=false, giới hạn 1–50 code point sau trim. Không dùng type=email hay inputMode=numeric vì mã không bắt buộc là số. Password autocomplete=current-password, 8–128 Unicode code point; không trim/normalize/cắt chuỗi, cho phép paste. Nút hiện mật khẩu rộng ít nhất 44px. Lỗi là text kèm aria-invalid và aria-describedby, không chỉ viền đỏ.

