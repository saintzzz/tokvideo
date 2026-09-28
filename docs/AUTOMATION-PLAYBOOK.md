# AUTOMATION PLAYBOOK - Xây kênh mới từ con số 0

Quy trình chuẩn để dựng một kênh mới bằng pipeline hiện có. Mục tiêu:
tay chỉ chạm ~15 phút, còn lại tự động hết.

## Kiến trúc: mọi kênh = 1 locale + 1 secret

Pipeline đọc credentials theo tên biến môi trường:
- Kênh VI mặc định: `YOUTUBE_REFRESH_TOKEN`
- Kênh EN: `YOUTUBE_EN_REFRESH_TOKEN`
- Kênh mới `<key>`: `YOUTUBE_<KEY>_REFRESH_TOKEN` (quy ước chữ hoa)

## Các bước dựng kênh mới (theo thứ tự)

### A. Phần tay - bắt buộc (~15 phút, 1 lần duy nhất)

1. **Tạo Google account + kênh YouTube** trên youtube.com.
   Chọn tên kênh đúng branding ngay lúc tạo (đổi sau cũng được bằng API).
2. **Phone verification**: YouTube Studio → Settings → Channel →
   Feature eligibility → xác minh số điện thoại. KHÔNG bỏ qua -
   kênh chưa verify bị sandbox mạnh hơn và không set được thumbnail.
3. **Lấy refresh token** cho kênh mới:
   ```bash
   YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... \
     node scripts/youtube-get-refresh-token.mjs
   # trình duyệt mở → đăng nhập ĐÚNG account kênh mới → approve
   ```
4. **Nạp secret**:
   ```bash
   gh secret set YOUTUBE_<KEY>_REFRESH_TOKEN  # paste token
   ```
5. **Avatar + handle** trong Studio (ảnh gen sẵn:
   `public/channel-avatar-*.png`; handle theo tên kênh).

### B. Phần tự động - script lo

6. **Thêm block branding** vào `src/suckhoe/channel-branding.json`
   dưới key locale mới (title/description/keywords/country/language).
7. **Chạy bootstrap**:
   ```bash
   YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... \
   YOUTUBE_<KEY>_REFRESH_TOKEN=... \
     node scripts/bootstrap-channel.mjs --locale=<key> \
       --token-env=YOUTUBE_<KEY>_REFRESH_TOKEN
   ```
   Script sẽ: verify token đúng kênh → apply branding → set banner →
   kiểm tra playlists → in checklist phần tay còn lại.
8. **Nối vào publish queue**: thêm job/`--locale=<key>` tương tự
   `publish-next-suckhoe-en` trong `.github/workflows/render.yml`
   (đổi env sang `YOUTUBE_<KEY>_REFRESH_TOKEN`).
9. **Warm-up 1 tuần** trước khi đăng: dùng tài khoản kênh xem/like/
   comment các kênh cùng niche ~10 phút/ngày. Đây là phần không tự
   động được - nó định nghĩa là hành vi người.
10. Sau warm-up: pipeline tự đăng theo queue, cadence cap 1 series/
    ngày tự áp dụng cho locale mới.

## Ma trận "cái gì tự động được"

| Bước | Cách | Tự động |
|---|---|---|
| Tạo account/kênh | UI YouTube | ❌ (Playwright drive UI được nhưng flaky, không khuyến nghị) |
| OAuth consent | youtube-get-refresh-token.mjs | ⚠️ bấm 1 lần |
| Secret vào CI | gh secret set | ✅ |
| Branding/banner | bootstrap-channel.mjs | ✅ |
| Playlists | bootstrap + upload tự tạo | ✅ |
| Avatar/handle | Studio UI | ❌ |
| Phone verify | Studio UI | ❌ |
| Nội dung → video → đăng | pipeline | ✅ 100% |
| Series playlist/SEO/tags | upload script | ✅ |
| Report/analytics | channel-report.mjs | ✅ |
| Warm-up | hành vi người thật | ❌ |

## Khi nào cần kênh mới (quyết tắc - không cảm tính)

Kích hoạt playbook này khi: mọi video mới trên kênh hiện tại < 50
impressions sau 14 ngày đăng đều, metadata đã đúng, và channel-report
không cho thấy tín hiệu nào phục hồi. Kênh mới bắt đầu LẠNH HƠN kênh
cũ - chỉ đổi khi kênh cũ chắc chắn bị suppression.
