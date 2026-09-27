# Channel cleanup - quyết định của owner 2026-09-28

## Quyết định

Owner yêu cầu: xóa toàn bộ video cũ không thuộc định hướng truyện kể (kể cả video ít view), tập trung toàn lực vào "Bà Tư kể chuyện" / "Grandma June Story Time".

Lý do chiến lược:

- 91 video remedy VI + 89 EN đều ~0-5 views/video - catalog cũ là dead weight, tín hiệu classifier "repetitious content" bám theo từng video.
- Trộn remedy + truyện trên cùng kênh làm loãng topic signal: kênh mới cần một định danh duy nhất.
- Kênh chỉ còn giá trị làm nền phát lại truyện series - mọi video không phục vụ điều đó bị xóa.

## Phạm vi xóa

### Repo (đã làm)

- 197 file episode remedy trong `src/suckhoe/episodes/` - xóa, chỉ còn 25 tập truyện series.
- `index.ts` build lại chỉ import story episodes.
- Audio + captions của các episode đã xóa - dọn sạch.
- `published.json` GIỮ NGUYÊN - là ledger lịch sử + chống re-upload; các video bị xóa trên kênh được stamp `deletedAt` lên entry tương ứng (audit trail persist vì workflow đã commit file này).

### Kênh YouTube (chạy qua CI)

- `src/suckhoe/pending-cleanup.json` flag cả 2 locale.
- `publish-next-suckhoe.mjs` chạy `cleanup-channel-videos.mjs` TRƯỚC khi publish mới: liệt kê toàn bộ video trên kênh qua uploads playlist, `videos.delete` tất cả video KHÔNG nằm trong keep list.
- Keep list = videoId trong `published.json` thuộc episode slug còn tồn tại trong `episodes/` - tức chỉ truyện series sống sót.
- Quota: `videos.delete` = 50 units, ~180 video ~9k/10k units/ngày - nếu hết quota giữa chừng, tick sau resume (idempotent, video đã xóa không xuất hiện lại trong listing).
- `pending-cleanup.json` tồn tại vĩnh viễn trong repo như guard - mọi video lạ xuất hiện sau này sẽ bị sweep ở tick tiếp theo. Script KHÔNG ghi flag file (workflow chỉ stage published.json, dirty tree làm hỏng git pull --rebase cuối job).

## Rủi ro đã cân nhắc

- Xóa video là **không thể hoàn tác** - lệnh trực tiếp của owner.
- Subscribers cũ (250) follow vì remedy có thể churn - chấp nhận được vì họ không xem nữa (49 views/28 ngày toàn kênh).
- Nếu YouTube suppress theo kênh (không theo video), xóa cũng không cứu được - khi đó fallback là kênh mới (CR-001 phương án B).
