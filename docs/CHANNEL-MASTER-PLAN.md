# CHANNEL MASTER PLAN - Bà Tư Kể Chuyện / Grandma June Story Time

Bản kế hoạch vận hành trọn gói theo framework 7 phần, áp dụng trực tiếp vào
trạng thái kênh thật (audit 2026-09-27).

## Trạng thái hiện tại (dữ liệu thật)

| | Kênh VI | Kênh EN |
|---|---|---|
| Handle | `@batukechuyenvn` | `@home-remedies-m3g` (chưa đổi) |
| Tên | Bà Tư Kể Chuyện | Grandma's Home Remedies (chưa đổi) |
| Subs | 250 | ~0-1 |
| Video live | 2 shorts truyện + 1 long-form private | 2 shorts truyện + ~30 remedy cũ |
| Views 28d gần nhất | ~0 (kênh vừa reset) | ~0 |
| Pipeline | Tự động: viết → TTS → render → upload → playlist | Cùng pipeline |

Điều kiện kiếm tiền YouTube (YPP):
- Shorts: 1,000 subs + 10 triệu lượt xem Shorts/90 ngày
- Long-form: 1,000 subs + 4,000 giờ xem/12 tháng

---

## 1. KẾ HOẠCH TRỌN GÓI

### Định vị kênh
- **VI**: "Bà Tư Kể Chuyện" - truyện kể bằng hoạt hình, nhân vật host cố định
  (Bà Tư cầm sách bên lửa trại). Khác biệt: kênh truyện Việt phần lớn là
  giọng đọc + ảnh tĩnh hoặc AI lều báo; ta có nhân vật hoạt hình nhận diện
  được và truyện CHIA TẬP trọn cốt.
- **EN**: "Grandma June Story Time" - cùng nhân vật, kể folklore/thriller
  nhẹ cho khán giả quốc tế.

### Trụ cột nội dung (content pillars)
1. **Series truyện chia tập** (trụ cột chính, ~70% sản lượng): cổ tích,
   giai thoại lịch sử, ly kỳ làng quê - mỗi series 2-3 tập Shorts, 1 playlist.
2. **Long-form tiên hiệp/huyền huyễn** (~20%): tập 40-60 phút, định dạng
   audiobook hoạt hình - nguồn giờ xem chính để đạt 4,000h.
3. **Truyện lẻ cảm động** (~10%): rải giữa các series, dễ viral cảm xúc.

### Chiến lược đăng
- Shorts: 3 tick/ngày (cron hiện có), mỗi tick bung TRỌN 1 series.
- Long-form: 1 tập/tuần/kênh, public sau khi chủ kênh duyệt (private gate).
- Playlist: mỗi series 1 playlist, tên = tên truyện.

### Khung giữ chân
- Tập 1 mở bằng hook câu hỏi/xung đột trong 3s đầu.
- Tập cuối series kết bằng CTA xem playlist + bài học.
- Tập giữa: recap 1 câu + cliffhanger.

### Lịch thực thi tuần (automation)
- Hằng ngày: cron 3 tick publish (đang chạy).
- Hàng tuần: 1 tập long-form mỗi series xianxia (dispatch thủ công).
- Hàng tuần: chạy `strategy-report` + `trend-radar` (xem mục 7).
- Hàng ngày (sau khi có tương tác): `comments-to-content` biến comment
  thành ý tưởng truyện.

---

## 2. NICHE ĐÃ CHỐT + ĐÁNH GIÁ

### Niche: truyện kể hoạt hình có host (storytelling animation)
- **Nhu cầu**: kênh truyện cổ tích/truyện ma VN có tới hàng triệu sub -
  nhu cầu nghe truyện trước ngủ/giải trí là evergreen.
- **Cạnh tranh**: cao nhưng phân mảnh. Kênh lớn dùng giọng đọc + slideshow;
  kênh mới có lợi thế format hoạt hình nhân vật.
- **Tiềm năng tìm kiếm**: "tấm cám", "thạch sanh", "nỏ thần", "truyện cổ
  tích" có search volume ổn định; long-tail "truyện cổ tích hay nhất",
  "truyện kể trước khi ngủ".
- **Độ bền**: nội dung evergreen, không hết hạn.
- **Khác biệt hóa**: nhân vật Bà Tư nhận diện + chia tập trọn cốt +
  long-form audiobook tiên hiệp (gần như trống trên YouTube VI hoạt hình).

### Rủi ro đã ghi nhận
- Kênh từng mass-upload → có thể đang bị suppression theo kênh.
- Quyết tắc: sau 14 ngày đăng đều với metadata đúng, nếu impressions
  vẫn ≈ 0 → chuyển sang kênh mới (phương án B trong CR-001), giữ nguyên
  toàn bộ pipeline.

### 100 ý tưởng video đầu tiên
Xem `src/suckhoe/content-backlog.json` - đã xếp hạng theo tiềm năng:
- Nhóm A (đã viết + đang đăng): 8 series VI × 2-3 tập, 4 series EN × 2 tập,
  5 tập xianxia long-form.
- Nhóm B (backlog cổ tích/dân gian nổi tiếng, search cao): Thạch Sanh,
  Sọ Dừa, Cây Khế, Sơn Tinh Thủy Tinh, Bánh Chưng Bánh Giầy, Con Rồng
  Cháu Tiên, Sự tích trầu cau, Cô bé lọ lem bản Việt, Ông lão đánh cá và
  con cá vàng (bản Việt), Chử Đồng Tử, Thánh Gióng, Mị Châu Trọng Thủy
  (full arc), Cây tre trăm đốt (đã có), Mười hai bà mụ, Ông Táo, ...
- Nhóm C (ly kỳ/ma nhẹ có giải thích): ma da, con ma nhà họ Hứa, chuyện
  lạng Sơn Tùng, bóng đèn dầu, giếng làng, cây đa đầu làng, ...
- Nhóm D (giai thoại lịch sử): Hai Bà Trưng, Bà Triệu, Trần Hưng Đạo,
  Nguyễn Trãi, Chu Văn An, Lê Lợi trả kiếm, ...
- Nhóm E (EN folk): Grimm vàersus bản kể lại ngắn, Appalachian folklore,
  đô thị legend có hồi kết, ...
- Nhóm F (xianxia long-form): 5 series đã viết tập 1 - mỗi series mục tiêu
  10 tập → 50 tập long-form.

---

## 3. HỆ THỐNG KỊCH BẢN, HOOK, THUMBNAIL

### Đã có trong pipeline
- `hookStyle` trên mỗi episode: question/statement/countdown/pov.
- `channelTitle` = tiêu đề video chuẩn SEO + "#Shorts".
- Titles biến thể: `scripts/title-variants.mjs`.
- Karaoke captions (giữ chân mạnh trên Shorts).
- Badge "TẬP n/N" + chip thể loại trên frame.

### Cần bổ sung (đánh dấu trong backlog)
- [ ] Long-form thumbnail riêng: render 1 frame 1280×720 với title overlay
  + upload qua `thumbnails.set` (video long-form phụ thuộc thumbnail nhiều
  hơn shorts rất nhiều).
- [ ] A/B hook: ghi lại hookStyle vào published.json để đo style nào
  giữ chân tốt (feed vào strategy-report).
- [ ] Mẫu kịch bản tối ưu retention: 3s hook → đặt câu hỏi → xung đột →
  nghẹt thở → payoff → cliffhanger. Đã có sườn trong schema storyParts;
  writer prompt cần ép cấu trúc này rõ hơn (đã cập nhật một phần).

---

## 4. HIỂU THUẬT TOÁN - CHECKLIST TỐI ƯU

YouTube quyết định phân phối qua: impressions → CTR → avg view duration →
retention → returning viewers → suggested/search. Checklist áp cho pipeline:

- **Impressions**: phụ thuộc channel trust - cần đăng đều, không xóa/đăng
  lại liên tục (vụ purge trước đây là tín hiệu xấu; đã fix).
- **CTR (long-form)**: thumbnail + title. → backlog thumbnail ở mục 3.
- **Retention (Shorts)**: karaoke caption + scene đổi mỗi nhịp (đã có) +
  nhịp truyện không lan man (validator ép >=4 nhịp, ~60-90s).
- **Returning viewers**: series + playlist (đã có) + nhân vật host cố định.
- **Search**: tiêu đề chứa tên truyện phổ biến, tags theo chủ đề (đã có),
  categoryId đã sửa thành Entertainment (24) cho story.
- **Tần suất**: 3 tick/ngày là ổn cho Shorts; long-form 1/tuần/kênh.
- **Chuyển đổi sub**: CTA cuối tập + banner/avatar nhất quán (đã gen,
  chờ đổi tay avatar + handle EN).

---

## 5. QUY TRÌNH SẢN XUẤT (đã đạt "nhanh gấp N lần")

Pipeline hiện tại đã là quy trình AI hỗ trợ đầy đủ mà PDF yêu cầu:

| Bước PDF | Trạng thái |
|---|---|
| Nghiên cứu chủ đề | `trend-radar.mjs`, `comments-to-content.mjs` |
| Viết kịch bản | `daily-content-writer-prompt.txt` + episode JSON |
| Lồng tiếng | `generate-voiceover.mjs` (TTS + retry + healthcheck) |
| Dựng video | Remotion `render-suckhoe.mjs` / `render-suckhoe-long.mjs` |
| Đăng tải | `upload-youtube.mjs` + playlist tự tạo |
| QC | `validate-episodes.mjs` + CI lint gate + healthcheck |

Thiếu so với PDF:
- [ ] Repurpose: Shorts truyện có thể đăng TikTok/Reels - repo tên
  tokvideo nhưng job TikTok chưa đấu nối truyện. Backlog.
- [ ] Thumbnail long-form (mục 3).
- [ ] Checklist QC thủ công trước khi flip long-form sang public:
  nghe 60s đầu + 60s cuối, check thumbnail, check playlist, check mô tả.

---

## 6. KẾ HOẠCH KIẾM TIỀN THEO GIAI ĐOẠN

| Giai đoạn | Cột mốc | Động thái kiếm tiền |
|---|---|---|
| 0 | Hiện tại (250 subs VI, ~0 EN) | Không kiếm tiền; tập trung nội dung + thói quen đăng |
| 1 | 1,000 subs + đủ watch time | Nộp YPP: Shorts feed revenue + long-form ads |
| 2 | Video có views ổn định | Affiliate: sách truyện/đèn ngủ/loa (link mô tả) |
| 3 | 5-10k subs, long-form có giờ xem | Membership: tập sớm, chọn truyện; kênh EN có thể Patreon |
| 4 | >10k subs | Tài trợ (app đọc truyện, audio book VN); bán kịch bản/nội dung số |
| 5 | Cộng đồng lớn | Newsletter/cộng đồng riêng, sản phẩm số |

Lưu ý YPP: nội dung reuse/mass-produced bị từ chối kiếm tiền - đây là lý
do format hoạt hình nhân vật + truyện gốc viết tay là bắt buộc, không chỉ
là ý tưởng hay.

---

## 7. ĐỌC SỐ LIỆU - FRAMEWORK REVIEW

### Hàng ngày (tự động)
- `channel-report` job chạy sau mỗi publish tick - ghi
  `channel-report-vi.md` / `channel-report-en.md` vào repo.

### Hàng tuần (khung review)
Mỗi thứ Hai (hoặc khi chủ kênh yêu cầu):
1. Chạy `strategy-report` - tổng hợp views/impressions/subs theo tuần.
2. Xếp hạng video theo % completion + views: top 3 / bottom 3.
3. Trả lời: thể loại nào thắng? series hay lẻ? VI hay EN? hook style nào?
4. Quyết định backlog tuần sau: viết thêm truyện thuộc nhóm thắng.
5. Nếu 2 tuần liên tiếp impressions ≈ 0 trên mọi video → kích hoạt
   quyết tắc kênh mới (mục 2).

### Chỉ số ngưỡng quyết định (đặt trước để không bị cảm tính)
- Shorts "sống": impressions > 500 trong 48h đầu.
- Shorts "chết": impressions < 50 sau 7 ngày → xem lại title/hook, không
  xóa (đã có bài học: xóa nhiều = tín hiệu xấu).
- Long-form "sống": AVD > 15% và CTR > 2%.
- Kênh "bị suppression": tất cả video mới < 50 impressions sau 14 ngày.

### Công cụ sẵn có trong repo
`channel-report.mjs`, `strategy-report.mjs`, `trend-radar.mjs`,
`publish-slots.mjs` (học giờ đăng tốt), `comments-to-content.mjs`.

---

## CÁC VIỆC CẦN LÀM TIẾP THEO (ưu tiên)

1. Đợi quota reset → EN purge xong + rebrand EN (tự động ở tick sau).
2. Đổi avatar + handle 2 kênh bằng tay (asset sẵn trong `public/`).
3. Implement thumbnail cho long-form (mục 3).
4. Viết tiếp backlog nhóm B-D (100 ý tưởng → `content-backlog.json`).
5. Viết tập 2-10 cho 5 series xianxia.
6. Review số liệu theo framework mục 7 sau 7 và 14 ngày.
