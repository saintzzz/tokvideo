# English Arena — bộ video giới thiệu VieSchool

## Nội dung

- Bản Full: khám phá bài học → nhiệm vụ → ôn câu sai → báo cáo ba mẹ → dùng thử.
- Bản Short: mở đầu → ôn câu sai → dùng thử, dành cho thử nghiệm nội dung ngắn.
- MP4 dọc 1080 × 1920, H.264; giọng nữ tiếng Việt; nhạc nền tự tổng hợp; phụ đề đốt vào video và file SRT riêng; ảnh bìa PNG.
- Ảnh giao diện lấy từ bộ screenshot có sẵn trong repo; không mô phỏng số điểm hay lời chứng thực. Nhãn dữ liệu minh họa được giữ trên cảnh tính năng.
- Bố cục dành khoảng trống bên phải và phía dưới cho giao diện mạng xã hội. Phông Be Vietnam Pro được đóng gói cùng giấy phép OFL để không cần tải font lúc render.

## Căn cứ sản phẩm

Đối chiếu mã nguồn `saintzzz/student-self-practice-web` tại commit `a045a304986409566ad8ed1544bc5f128abb1365`:

| Nội dung video | Căn cứ |
| --- | --- |
| Tìm chữ thừa, nghe, ghép hình | `src/lib/rounds/roundDefinitions.ts`, `src/lib/generators/extraLetter.ts`, `listeningImageChoice.ts`, `picturePairMatching.ts` |
| Nhiệm vụ mỗi ngày | `src/components/DailyQuestCard.tsx` |
| Sao và bạn đồng hành | `src/lib/engagement/store.ts`, `src/components/PetCard.tsx` |
| Ôn lại câu sai, gợi ý theo kỹ năng | `src/components/ReviewCard.tsx`, `src/components/CoachCard.tsx` |
| Báo cáo hoạt động 7 ngày | `src/components/ParentReportScreen.tsx` |
| Mỗi lớp 1 vòng miễn phí, đăng nhập để mở đủ 4 vòng | `src/components/GradeSelect.tsx` |

Các screenshot được kế thừa từ commit `553bd4c8abbd512b793ffe095fad878176341177` của tokvideo. Không khẳng định đây là bản chụp mới nhất của website đang chạy. Báo cáo phụ huynh hiện đọc dữ liệu hoạt động trên thiết bị; video không hứa đồng bộ đa thiết bị hay hiệu quả học tập định lượng.

## Dựng lại

```bash
npm ci
node scripts/prepare-ea-launch.mjs
node scripts/render-ea-launch.mjs
```

Node 24, ffprobe và kết nối dịch vụ Edge TTS được yêu cầu để tạo giọng đọc. Có thể đổi giọng bằng `EDGE_TTS_VOICE_EA`; mặc định `vi-VN-HoaiMyNeural`. Cache gắn với nội dung/giọng/tốc độ để tránh dùng lời đọc cũ sau khi sửa kịch bản. Thời lượng mỗi cảnh tính từ audio thực, có khoảng nghỉ cuối cảnh; phụ đề căn theo cụm câu, không giả lập căn chỉnh từng từ.

Workflow **English Arena launch review** chạy trên pull request có thay đổi bộ video, hoặc chạy thủ công sau khi workflow có trên nhánh mặc định. Artifacts gồm Full, Short, bìa, SRT và audio nguồn. Workflow chỉ render, không đăng lên mạng xã hội.

Đầu vào duy nhất để sửa nội dung: `src/english-arena/launch/story.json`. Scene/component nằm trong `LaunchVideo.tsx`. Entry độc lập tránh tải các video kênh khác. Các quảng cáo cũ không thay đổi.

Xem bố cục khi chưa tạo giọng (chỉ dành cho duyệt hình):

```bash
npx remotion still src/english-arena/launch/index.tsx EnglishArena-Launch-Full out/layout.png --frame=300 --props='{"preview":true}'
```

## Gợi ý nội dung đăng

**Tiêu đề:** Mỗi bài luyện, một khám phá mới cùng English Arena.

**Nội dung:** Tìm chữ thừa, luyện nghe, ghép hình — cùng con khám phá tiếng Anh qua những tương tác nhỏ. English Arena có nhiệm vụ mỗi ngày, ôn lại câu sai và báo cáo hoạt động cho ba mẹ. Thử miễn phí 1 vòng ở mỗi lớp, không cần tài khoản, tại https://ea.vieschool.com/

**Hashtag:** #EnglishArena #VieSchool #TiengAnhTieuHoc #CungConHocTiengAnh

Không tự đăng, không tự merge. Anh duyệt video trước khi sử dụng.
