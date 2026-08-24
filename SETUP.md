# Cài đặt trên máy mới

Hướng dẫn để chạy được toàn bộ pipeline (video ngắn tự động, viết nội dung,
tương tác cộng đồng, và track phim hoạt hình Blender) trên một máy Windows
khác, giống hệt máy hiện tại.

## 1. Yêu cầu

- **Node.js 24+** — kiểm tra `node -v`.
- **Git**.
- **Claude Code CLI** (`claude`) — cài và đăng nhập một lần tương tác trước
  (các Task Scheduler job chạy `claude -p` không tương tác, cần session/đăng
  nhập đã có sẵn).
- **Blender 5.2 LTS** — dùng cho track phim hoạt hình (`blender/`). Tải thủ
  công tại https://www.blender.org/download/ rồi cài bản Windows Installer.
  **Lưu ý:** `winget install` và tải trực tiếp bằng `curl`/script đều bị
  Cloudflare chặn (403 "Just a moment...") — phải tải bằng trình duyệt thật.
  Sau khi cài, đường dẫn mặc định là
  `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (không nằm
  trong PATH — luôn gọi bằng đường dẫn đầy đủ, hoặc tự thêm vào PATH).

## 2. Clone và cài dependencies

```powershell
git clone https://github.com/saintzzz/tokvideo.git
cd tokvideo
npm install
```

## 3. Thiết lập YouTube API credentials

Các script Task Scheduler (`scripts/run-*.ps1`) đọc credentials từ
`scripts/.env.youtube.local` (bị gitignore, không nằm trong repo — phải tạo
lại trên từng máy). Tạo file này với nội dung:

```
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REFRESH_TOKEN=...
YOUTUBE_EN_REFRESH_TOKEN=...
```

- `YOUTUBE_CLIENT_ID`/`YOUTUBE_CLIENT_SECRET`: lấy từ Google Cloud Console
  (OAuth client) — dùng lại giá trị đã có, hoặc tạo project mới nếu cần.
- `YOUTUBE_REFRESH_TOKEN` (kênh Việt) / `YOUTUBE_EN_REFRESH_TOKEN` (kênh
  Anh): sinh bằng `node scripts/youtube-get-refresh-token.mjs` — **bước này
  cần đăng nhập Google bằng trình duyệt thật, không thể tự động hóa**, chạy
  một lần trên máy nào cũng được rồi copy token sang máy khác nếu muốn dùng
  chung (token không gắn với máy).

GitHub Actions (workflow `render.yml`) dùng cùng 3-4 secret này nhưng đã
được set sẵn ở repo settings trên GitHub — không cần làm lại trừ khi tạo
repo mới.

## 4. Thiết lập Windows Task Scheduler

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-task-scheduler.ps1
```

Script này tạo lại đúng 3 task đang chạy trên máy gốc (đường dẫn tự nhận
diện theo vị trí clone, không hardcode máy cũ):

| Task | Lịch chạy | Script |
|---|---|---|
| `SucKhoeDailyContentWriter` | Hằng ngày 8:00 sáng | `run-daily-content-writer.ps1` |
| `SucKhoeReplyComments` | Hằng ngày 4:00 chiều | `run-reply-comments.ps1` |
| `SucKhoeCommentOutreach` | Mỗi 3 ngày, 8:00 tối | `run-comment-outreach.ps1` |
| `AnimatedFilmEpisodeWriter` | Mỗi 2 ngày, 10:00 sáng | `run-animated-episode-writer.ps1` |
| `SucKhoePublishCatchup` | Mỗi giờ | `run-check-catchup-publish.ps1` |

`SucKhoePublishCatchup` cần thêm `scripts/.env.github.local` (gitignore,
1 dòng `GITHUB_TOKEN=<PAT có quyền Actions:write cho saintzzz/tokvideo>`)
— đây là lưới an toàn cho một lỗi thật đã gặp: lịch `schedule` của GitHub
Actions có thể âm thầm bỏ lỡ một lượt chạy khi nhiều cron trong cùng
workflow rơi gần giờ nhau. Task này kiểm tra `src/suckhoe/published.json`
mỗi giờ, nếu một kênh (VI/EN) trễ quá ngưỡng bình thường thì tự gọi
`workflow_dispatch` để đăng bù.

Kiểm tra sau khi chạy: `Get-ScheduledTask | Where-Object { $_.TaskName -like 'SucKhoe*' }`

Log của mỗi job nằm ở `scripts/*.log` (gitignore, xem trực tiếp trên máy đó).

## 5. Track phim hoạt hình Blender (đang xây dựng)

`blender/gp_character.py` là rig nhân vật 2D dùng Armature thật (xương khớp,
không phải vẽ lại từng frame) — không cần thiết lập gì thêm ngoài việc cài
Blender ở bước 1. Chạy thử:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --python blender/test_grandma_rig.py
```

Frame ảnh xuất ra ở `blender/out/` (gitignore, không commit — chạy lại
script để tái tạo).

## 6. Kiểm tra nhanh mọi thứ hoạt động

```powershell
npm run generate-voiceover:suckhoe   # test TTS miễn phí (Edge, không cần key)
npm run render:suckhoe                # test render một video Suc Khoe
```
