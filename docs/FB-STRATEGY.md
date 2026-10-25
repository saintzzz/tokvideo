# FB-STRATEGY - Trang "Truyện Ma Dài Kỳ" (fb.com/TruyenMaDaiKy2026)

Page ID (asset): `1384474058090954` · Public ID: `61595982565969`
Business: `2263907567253715` · Meta app: `tokvideo publisher` (`1100302619535328`)

## Mục tiêu

1. **Seeding traffic về YouTube** - kênh chính, FB là kênh phụ phân phối.
2. **Đạt ngưỡng monetization**: Stars cần 500 followers trong 30 ngày liền;
   Gói đăng ký cần 5.000; Content Monetization là invite-only (form chỉ có
   trong app mobile: Bảng điều khiển chuyên nghiệp -> Kiếm tiền).

## Vận hành hằng ngày (đã tự động hóa)

- `pipeline-doctor` cron (23:45 VN) build + đặt lịch tối đa 3 Reel/ngày
  cho tập đã lên YouTube mà chưa có `-fb` trong ledger.
- Slot giờ vàng VN: **12:30, 19:30, 22:30** (truyện ma -> đêm khuya).
  Reel được lên lịch qua `video_state=SCHEDULED` + `scheduled_publish_time`.
- Comment đầu tiên tự gắn link YouTube trọn tập (link ngoài trong caption
  giảm reach). Reel đặt lịch comment được ngay; nếu fail -> ledger ghi
  `ytCommentPending` và doctor retry ở lần chạy sau.
- Dedupe: key `<slug>-fb` trong `src/suckhoe/published-long.json`.

## Format Reel (build-fb-reel.mjs)

- 1080x1920, ~50s, zoom Ken Burns + title/subtitle/brand burned-in +
  2 beat narration đầu - chống flag "static video" của CMP.
- Caption: hook câu đầu + tên arc/tập + câu hỏi thật (không engagement
  bait) + hashtag `#truyenma #kechuyen #truyencotich #truyendangian
  #kechuyendemkhuya`.
- Secrets CI: `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN` (non-expiring page
  token). Token local cho chạy tay: `~/.config/devin/secrets/fb_page_token_truyen_ma_dai_ky`
  (60 ngày, tái tạo qua Graph API Explorer khi hết).

## Đã setup trên Page

- Cover + avatar custom (artwork Hôn Ma), bio, hạng mục "Trang web giải
  trí", CTA "Xem ngay" -> kênh YouTube, link YouTube trong mục Liên kết,
  liên hệ sẵn có, bài giới thiệu đã ghim + comment link kênh.
- Trạng thái Trang: sạch. Đề xuất Trang: ĐƯỢC ĐỀ XUẤT.

## KHÔNG làm

- Không mời bạn bè / ping người thật (chủ kênh cấm - làm phiền).
- Không đặt link ngoài trong caption bài đăng.
- Không engagement-bait ("comment X nếu...").
- Không video tĩnh (ảnh đơn + audio) - CMP phạt.

## Việc chờ (phía Meta)

- Business verification đang xét -> mở System Users (không chặn đăng bài).
- Content Monetization interest form: chỉ trong app mobile.
- Token local 60 ngày cần rotate; token trên GH Secrets là bản non-expire.
