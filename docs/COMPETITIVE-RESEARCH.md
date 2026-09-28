# COMPETITIVE RESEARCH - Kênh truyện hàng đầu + bài học áp dụng

Research thực tế 2026-09-28: các kênh kể truyện lớn nhất + tài liệu về
hành vi thuật toán với kênh mới.

## Kênh đối thủ đã khảo sát

| Kênh | Subs | Format | Bài học |
|---|---|---|---|
| Câu chuyện cổ tích việt nam (@fairytalesvietnamese) | **2.3M** | Hoạt hình dài 8-12 phút, ~8 video/tháng, catalog 622 video | Cổ tích dài + hoạt hình thật = mỏ vàng evergreen; 1.3 tỷ view tổng |
| Yêu Cổ Tích (THVL) | 362K | Re-upload phim truyền hình Vĩnh Long, 2243 video | Chứng minh demand VN cho cổ tích hình ảnh |
| KONDOSAN Vietnamese | hàng triệu view/video | Hoạt hình cổ tích quốc tế lồng tiếng Việt 11 phút | "Chó sói và 7 chú dê con" = 21.5M view |
| Tạ Hói Audio + hệ sinh thái audio truyện | vài K-100K | Truyện tiên hiệp audio **2-3 GIỜ/tập**, ảnh tĩnh, hàng trăm tập | Niche xianxia-audio có sẵn khán giả; tập full-end lên tới 3.3M view. Video của ta có animation + karaoke caption → vượt trần họ |
| TheOdd1sOut / JaidenAnimations (tham chiếu toàn cầu) | 15-20M | Storytime animation cá nhân, 7-20 phút, personality-driven | Nhân vật host nhận diện (Bà Tư) đúng hướng; 189 video → 20M sub: quality > quantity |

## Mẫu thắng rút ra (đã verify với số liệu thật)

1. **Nội dung dài thắng trong niche truyện.** Cổ tích top = 8-12 phút,
   audio truyện = 2-3 giờ. Shorts 90s của ta chỉ là top-of-funnel —
   long-form mới là nơi views + giờ xem thực sự nằm. → Ưu tiên xianxia
   long-form và các tập cổ tích dài.

2. **Serial/binge là cỗ máy tăng trưởng.** Mọi kênh audio truyện đều
   đánh số tập + playlist (tập 21-233!). Ta đã có series+playlist —
   đúng hướng, cần ra tập ĐỀU.

3. **Nhân vật host cố định.** Kênh audio truyện gắn tên MC (Tạ Hói,
   Trần Vân, Tiến Phong). Bà Tư = tương đương, thậm chí tốt hơn vì là
   nhân vật hoạt hình nhận diện thị giác.

4. **Tên truyện nổi tiếng trong tiêu đề.** "Thạch Sanh", "Sọ Dừa",
   "Ngã Dục Phong Thiên" - search traffic từ tên truyện gốc là nguồn
   view ổn định. Backlog nhóm B đã chuẩn theo nguyên tắc này.

5. **Cadence hợp lý.** Kênh top: ~8 video/tháng đến 1/ngày. Kênh mới
   đăng 3+ video/ngày = tín hiệu spam/sandbox. → Đã cap cadence
   1 series/ngày/locale trong publish-next-suckhoe.mjs.

## Điểm ta vượt / điểm ta kém (đánh giá thẳng)

**Vượt:** nhân vật hoạt hình động (đa số kênh audio chỉ ảnh tĩnh),
karaoke caption, pipeline tự động toàn phần, truyện gốc không vi phạm
bản quyền (nhiều kênh audio đọc lại truyện Trung Quốc có bản quyền -
rủi ro tắt monetization của họ, không phải của ta).

**Kém:** không có catalog lớn (kênh top có 600-2200 video), không có
giọng MC người thật (TTS vs MC thật - trade-off đã chọn), kênh có lịch
sử mass-upload bị flag.

---

## Chẩn đoán video 1 ngày 0 view

Không hẳn là bất thường. Nguyên nhân xếp theo xác suất:

1. **Sandbox kênh mới/rebuilt (khả năng cao nhất).** YouTube quan sát
   kênh mới 24-72h+ trước khi test distribution. Kênh VI vừa purge
   toàn bộ catalog + đổi branding = giống hệt pattern kênh mới lập.
   Nguồn tham chiếu: nhiều case 0 impressions 24-72h đầu rồi tự nở.

2. **Lịch sử mass-upload.** Kênh từng 91 video/mẫu lặp → trust score
   thấp. Cần 2-4 tuần đăng đều + tương tác để thuật toán "quên".

3. **Analytics lag.** Studio có thể trễ tới 48h. 0 view lúc 12h chưa
   kết luận được; 0 view sau 4-7 ngày mới là tín hiệu thật.

4. **Metadata (đã fix hôm qua):** categoryId sai → đã sửa 24.

### Giao thức chờ (đã ghi vào master plan, lặp lại)

- Ngày 1-3: 0-10 view = bình thường, không hành động.
- Ngày 4-7: nếu mọi video <50 impressions → kiểm tra lại phone
  verification của kênh + đăng đều tiếp.
- Ngày 14: nếu vẫn ≈0 impressions toàn bộ → kênh bị suppression,
  kích hoạt phương án B (kênh mới - xem AUTOMATION-PLAYBOOK.md).

### Việc làm NGAY hỗ trợ thoát sandbox

- Đăng đều 1 series/ngày, không flood (đã cap).
- Chủ kênh dùng chính tài khoản xem/like/comment kênh khác cùng niche
  ~10 phút/ngày (warm-up behavior - không tự động hóa được vì phải là
  hành vi người thật).
- Reply mọi comment nhận được (script reply-comments có sẵn).

---

## Tự động hóa toàn phần kể cả xây kênh mới

Thực trạng API YouTube (không phải thiếu cố gắng - là giới hạn thật):

| Việc | Tự động được? | Cơ chế |
|---|---|---|
| Tạo Google account + kênh YouTube | ❌ Không có API | Tay: tạo kênh ở youtube.com (5 phút), hoặc Playwright drive UI |
| Lấy refresh token kênh mới | ⚠️ 1 lần tay | `scripts/youtube-get-refresh-token.mjs` - OAuth consent bắt buộc có người bấm |
| Nạp secret vào GitHub | ✅ | `gh secret set YOUTUBE_<X>_REFRESH_TOKEN` |
| Branding (tên/mô tả/keywords/quốc gia/banner) | ✅ | `scripts/bootstrap-channel.mjs --locale=<key>` |
| Playlist cố định | ✅ | bootstrap script check/tạo |
| Avatar + handle | ❌ Không có API | Tay trong Studio (ảnh sẵn trong public/) |
| Phone verification | ❌ | Tay: Studio → Settings → Feature eligibility |
| Voiceover/render/upload/publish queue/playlist series | ✅ | Pipeline hiện có, chạy trọn trên CI |
| Report/analytics/strategy | ✅ | channel-report, strategy-report, trend-radar |
| Warm-up behavior | ❌ Theo bản chất | Phải là hoạt động người thật |

→ Mức tự động đạt được: **~90%**. 3 thứ bắt buộc tay, tổng ~15 phút
một lần cho mỗi kênh mới: tạo kênh + OAuth consent + avatar/handle/phone.
Sau đó `bootstrap-channel.mjs` + publish queue lo toàn bộ phần còn lại.

Chi tiết từng bước: `docs/AUTOMATION-PLAYBOOK.md`.
