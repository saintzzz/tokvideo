# CR-001: Channel Pivot — thoát khỏi trạng thái "kênh chết phân phối"

Ngày: 2026-09-27 · Trạng thái: ĐÃ PHÊ DUYỆT phương án A (Bà Tư kể chuyện, tất cả 4 loại) - đã implement 2026-09-27

## 1. Yêu cầu thay đổi

User yêu cầu: "có cách nào thay đổi hoàn toàn chủ đề hay mọi thứ về kênh để hút hơn không?" — tức thay đổi chiến lược nội dung gốc của kênh, không chỉ cải tiến kỹ thuật.

## 2. Chẩn đoán dữ liệu thật (channel-report 2026-09-27)

### Kênh VI "Bà Lang Mách Mẹo" — UCJI2sx_mGlmuqn0cdiWXE2g
- 250 subs · 91 videos · 3,027 views tổng
- **28 ngày gần nhất: 49 views, 10 phút xem, -2 subs**
- 25 video gần nhất: 0-5 views/video
- Video ĐÃ public (verify trên tab /shorts công khai) → không phải lỗi privacy

### Kênh EN "Grandma's Home Remedies"
- 0 subs · 89 videos · 236 views tổng
- **28 ngày gần nhất: 60 views, 7 phút xem**
- 25 video gần nhất: 0-1 views/video

### Kết luận chẩn đoán
Kênh không bị lỗi kỹ thuật — video public, đúng lịch, đúng format. Vấn đề là **YouTube không phân phối**: ~0.5 view/video nghĩa là Shorts không vào feed. Nguyên nhân xếp theo xác suất:

1. **Channel-level suppression**: 2 sự cố mass-upload (2026-08-22: 9 video/30s; vòng lặp dedupe 9/2026: 49 upload trùng) + 7 video/ngày clustered trước 8/23 → classifier "mass-produced/spam". Phục hồi có thể mất hàng tuần-tháng, hoặc không bao giờ.
2. **Profile nội dung đúng mẫu YouTube đang triệt**: update 7/2025 chống "mass-produced and repetitious content" — remedy listicle + TTS + template giống nhau là định nghĩa gần như chính xác.
3. **Niche bão hòa + YMYL**: "mẹo dân gian/sức khỏe" siêu bão hòa ở cả VI lẫn EN; nội dung sức khỏe bị xét duyệt phân phối chặt hơn (YMYL).

## 3. Phạm vi ảnh hưởng (impact assessment)

| Thành phần | Ảnh hưởng nếu pivot chủ đề |
|---|---|
| `src/suckhoe/episodes/*.json` | Format mới cần schema mới hoặc field bổ sung; episode cũ giữ nguyên (đã publish) |
| `src/scenes-suckhoe/*` | Scene remedy (title/remedy/steps/cta) → có thể cần scene kể chuyện; Bà Tư/kitchen/camera/parallax tái dùng được 100% |
| `src/suckhoe/themes.ts` | Thêm palette cho chủ đề mới |
| `publish-next-suckhoe.mjs` + cron | Giữ nguyên — queue mechanism không đổi |
| `daily-content-writer` | Prompt viết lại cho chủ đề mới |
| Validator compliance | Rule "cấm claim y tế" có thể nới/giữ nguyên tùy niche mới |
| Tài sản animation | Tăng giá trị — chủ đề kể chuyện cần hoạt hình hơn chủ đề mẹo |

## 4. Các phương án pivot

### Phương án A — Bà Tư kể chuyện (KHUYẾN NGHỊ)
Giữ kênh + nhân vật + pipeline hoạt hình; đổi nội dung sang **truyện kể**: cổ tích, tích truyện dân gian, chuyện ma làng quê, bài học cuộc sống ngắn.

- Vì sao hợp: "bà kể chuyện" là persona tự nhiên của Bà Tư; niche truyện ma/cổ tích có demand Shorts VI rất lớn; retention cảm xúc cao hơn listicle; bỏ gánh nặng compliance YMYL; tận dụng tối đa đầu tư animation (kể chuyện CẦN hoạt hình, mẹo thì không).
- EN tương đương: Grandma June kể dark folklore / weird history / scary stories ngắn.
- Rủi ro: suppression theo kênh có thể vẫn còn → cần giai đoạn test 2-3 tuần.

### Phương án B — Kênh mới hoàn toàn
Tạo kênh mới (cùng Google account được, nhưng cần OAuth token mới) + niche mới.

- Ưu: sạch lịch sử spam, sạch tín hiệu classifier.
- Nhược: mất 250 subs kênh VI; phải tạo channel + authorize lại thủ công; YouTube vẫn có thể liên kết qua fingerprint nội dung nếu format giống hệt.

### Phương án C — Giữ niche, đổi format mạnh
Vẫn mẹo/sức khỏe nhưng làm dạng mini-story (tình huống nhân vật → mẹo), thumbnail/hook mới.

- Nhược: không giải quyết YMYL + niche bão hòa + vẫn dễ bị xếp "repetitious".

### Đề xuất kết hợp
A trước (chi phí thấp nhất, tận dụng tài sản hiện có) — nếu sau ~3 tuần impressions vẫn ~0 thì kết luận suppression theo kênh → chuyển B. Kênh EN (0 subs) làm sandbox song song.

## 5. Estimate

- Schema episode kể chuyện + 1-2 scene mới: ~nửa ngày
- Batch nội dung đầu (8-10 tập) + voiceover + render: ~1 ngày
- Đo lường: channel-report hiện có đủ dùng
