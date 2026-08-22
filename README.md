# TikTok videos — factory nhiều sản phẩm

Nhiều video quảng cáo affiliate, mỗi video là 1 sản phẩm, định dạng 9:16 cho TikTok.
4 scene mỗi video: Hook → Quote/Story/Reveal → Twist/Showcase → CTA giỏ hàng.

| Video | Sản phẩm | Composition id |
|---|---|---|
| `src/GiaCatLuongVideo.tsx` | Sách: Tử Vi Luận Giải (Khải Tâm) | `GiaCatLuong-TuVi` |
| `src/ChurchillVideo.tsx` | Sách: Nghệ Thuật Giao Tiếp Đỉnh Cao (Cốc Vũ) | `Churchill-GiaoTiep` |
| `src/HippocratesVideo.tsx` | Sách: Liệu Pháp Dinh Dưỡng Cho Mọi Loại Bệnh (NewLife) | `Hippocrates-DinhDuong` |
| `src/IdeverrayVideo.tsx` | Áo: set áo đôi IDEVE LAZRY (IDeverRAY) | `Ideverray-AoDoi` |
| `src/AmMuuVideo.tsx` | Sách: Thuyết Âm Mưu / Thuyết Dương Mưu (Mặc Am, SBOOKS) | `AmMuu-ChienLuoc` |

Ngoài ra có **kênh YouTube Shorts riêng** ("Suc Khoe" — mẹo dân gian từ thức ăn,
đồ uống), khác hẳn 5 video trên vì đây không phải quảng cáo 1 sản phẩm mà là
nhiều tập của cùng 1 kênh. Xem mục "Kênh Suc Khoe" bên dưới.

`Ideverray-AoDoi` là video đầu tiên dùng **ảnh sản phẩm thật** (do người bán tự
chụp, không phải ảnh của bên thứ ba) thay vì minh hoạ — hiệu ứng Ken Burns
(`KenBurnsImage`) zoom/pan chậm trên từng ảnh + scrim gradient để chữ luôn đọc
rõ. Ảnh gốc nằm trong `public/images/ideverray/01.jpg`–`09.jpg`.

`Hippocrates-DinhDuong` dùng bộ hiệu ứng nâng cao hơn 2 video trước: chuyển cảnh
crossfade (`@remotion/transitions`) thay vì cắt cứng, chữ kiểu kinetic typography
(từng từ bay vào có làm mờ/nét), nền có hạt lá/hạt ngũ cốc/giọt nước trôi + bokeh,
và nhân vật minh hoạ Hippocrates (không dùng ảnh thật để tránh rủi ro bản quyền —
xem phần "Thêm video mới" bên dưới nếu muốn tái sử dụng các component này
(`KineticText`, `DiseaseIconStrip`, `NutritionBackground`) cho sách khác.

## Giọng đọc (voiceover)

Dùng [msedge-tts](https://github.com/Migushthe2nd/MsEdgeTTS) — gọi cùng API "Đọc to"
(Read Aloud) của Microsoft Edge, giọng neural tiếng Việt, **miễn phí, không cần đăng ký
hay API key**.

```console
npm run generate-voiceover                       # tất cả video
npm run generate-voiceover:gia-cat-luong         # chỉ 1 video
npm run generate-voiceover:churchill
```

Đổi giọng bằng biến môi trường `EDGE_TTS_VOICE` (mặc định `vi-VN-NamMinhNeural`,
giọng nam; có thể đổi sang `vi-VN-HoaiMyNeural`, giọng nữ).

## Render trên GitHub Actions (không cần máy có ffmpeg)

Máy dùng để soạn video này bị chính sách Application Control chặn chạy `ffmpeg.exe`
cục bộ, nên video được render trên GitHub Actions thay vì local. Không cần secret/API
key nào.

**Chỉ render video nào thay đổi:** workflow tự phát hiện file nào bạn sửa (vd chỉ sửa
`src/scenes-churchill/**` thì chỉ render `Churchill-GiaoTiep`, không đụng tới video
kia). Nếu sửa file dùng chung (`src/components/**`, `src/fonts.ts`, `src/timing.ts`...)
thì cả hai video đều render lại vì đều bị ảnh hưởng.

1. Push lên nhánh `main` — workflow tự chạy, chỉ render video bị ảnh hưởng bởi commit đó.
2. Muốn ép render thủ công: vào tab **Actions → Render TikTok video → Run workflow**,
   chọn `all` (render hết) hoặc chọn đúng tên video trong dropdown.
3. Khi xong, vào run đó, mục **Artifacts** — mỗi video ra 1 file zip riêng
   (`gia-cat-luong-tu-vi.zip`, `churchill-giao-tiep.zip`), không tải nhầm video khác.

## Thêm video mới (sách mới)

1. Tạo `src/narration.<ten>.json`, `src/scenes-<ten>/*.tsx`, `src/<Ten>Video.tsx`,
   `src/<Ten>Composition.tsx` — copy cấu trúc từ Churchill làm mẫu.
2. Đăng ký composition mới trong `src/Root.tsx`.
3. Thêm video vào `VIDEOS` trong `scripts/generate-voiceover.mjs`.
4. Thêm `render:<ten>` + `generate-voiceover:<ten>` vào `package.json`.
5. Thêm entry `<ten>` vào `filters` (`gia_cat_luong`/`churchill` block) và một job
   `render-<ten>` mới trong `.github/workflows/render.yml`.

## Kênh Suc Khoe (YouTube Shorts, mẹo dân gian)

Khác với 5 video trên (mỗi video = 1 sản phẩm, viết tay từng scene), kênh này
là **1 hệ thống chung** cho nhiều tập theo thời gian — thêm tập mới chỉ cần
thêm 1 file nội dung, không cần viết code.

**Quy tắc bắt buộc cho mọi tập** (nội dung sức khoẻ bị YouTube kiểm soát rất
chặt, dễ bị gỡ/phạt kênh nếu sai):
- Luôn khẳng định là "kinh nghiệm dân gian" / "theo quan niệm dân gian", không
  dùng từ "chữa bệnh", "trị bệnh", "thay thuốc"
- Luôn có dòng disclaimer "không thay thế ý kiến bác sĩ" ở CTA scene (đã có sẵn
  trong `CTAScene.tsx`, không cần thêm)
- Ghi rõ cảnh báo riêng của nguyên liệu nếu có (vd mật ong với trẻ dưới 1 tuổi)
  vào trường `caution`

**Thêm tập mới:**
1. Tạo file `src/suckhoe/episodes/<slug>.json` theo đúng field trong
   `src/suckhoe/types.ts` (`hook`, `ingredientName`, `remedy`, `steps`, `cta`,
   `caution` tuỳ chọn).
2. Thêm 1 dòng import vào `src/suckhoe/episodes/index.ts`.
3. Xong — composition `SucKhoe-<slug>`, voiceover, và job render trên CI đều tự
   nhận file mới, không cần sửa gì khác (script sinh voiceover và script render
   tự quét thư mục `episodes/`).

```console
npm run generate-voiceover:suckhoe   # sinh giọng đọc cho MỌI tập
npm run render:suckhoe               # render MỌI tập
node scripts/render-suckhoe.mjs gung-mat-ong   # chỉ 1 tập
```

**Nhân vật host:** `HealerSilhouette` — bà lang minh hoạ, miệng mấp máy khi có
giọng đọc (kỹ thuật giống `HippocratesSilhouette`), dùng xuyên suốt kênh để tạo
nhận diện thương hiệu.

**CTA khác TikTok:** kênh này lên YouTube Shorts, không có thẻ giỏ hàng gắn sẵn
như TikTok Shop. `SubscribePointer` trỏ vào vùng nút Subscribe của YouTube
Shorts (khoảng 78% chiều cao màn hình, bên trái) — vị trí ước lượng theo UI
hiện tại, nên kiểm tra lại nếu YouTube đổi giao diện. Link affiliate (nếu có)
để trong phần mô tả video khi đăng, không gắn được vào trong video như TikTok.

### Đăng tự động lên YouTube

**Bước duy nhất phải làm bằng tay** (cần đăng nhập Google, không thể tự động hoá):

1. https://console.cloud.google.com/ → tạo project → bật **YouTube Data API v3**.
2. APIs & Services → Credentials → Create Credentials → OAuth client ID → loại
   **Desktop app**.
3. Trong client đó, thêm đúng Authorized redirect URI: `http://localhost:8080`
4. Chạy: `YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... npm run youtube-get-refresh-token`
   → mở link in ra, đăng nhập đúng tài khoản Google của kênh, đồng ý quyền.
5. Script in ra 1 refresh token. Vào repo GitHub → Settings → Secrets and
   variables → Actions, thêm 3 **secrets**: `YOUTUBE_CLIENT_ID`,
   `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`.
6. (Tuỳ chọn) Thêm **repository variable** `YOUTUBE_PRIVACY_STATUS` = `public`
   nếu muốn đăng công khai tự động ngay. Không đặt thì mặc định `private` —
   video lên kênh nhưng phải tự vào YouTube Studio duyệt rồi mới public.

Sau khi có đủ 3 secret, mọi lần render `suckhoe` trên CI đều tự upload.

**Đăng theo lịch (mỗi 4 giờ 1 tập, 6 tập/ngày):** workflow có `schedule` cron
chạy mỗi 4h, tự lấy **tập kế tiếp chưa đăng** (theo thứ tự alphabet trong
`src/suckhoe/episodes/`, lưu trạng thái ở `src/suckhoe/published.json`), sinh
giọng đọc, render, upload, rồi tự commit lại file trạng thái — không đăng
trùng tập cũ. Hết tập trong hàng đợi thì tự log "không có tập mới" và không
làm gì, tự chạy tiếp khi có tập mới được thêm vào.

Nhịp này đã được giảm từ 2h/tập (12/ngày) xuống 4h/tập ngay từ đầu vì đây là
kênh mới đăng nội dung dựng theo khuôn mẫu (giọng TTS + nhân vật hoạt hình
lặp lại), lại có lịch sử bị strike trên TikTok — tần suất quá cao là đúng
loại tín hiệu "spam/mass-produced" mà YouTube chủ động hạn chế phân phối.
6/ngày vẫn đủ đăng đều mỗi ngày để có dữ liệu, với rủi ro thấp hơn.

⚠️ **Lưu ý rủi ro:** vẫn nên theo dõi YouTube Studio (Content → trạng thái
từng video, mục Copyright/Community Guidelines) sau vài ngày đầu để phát
hiện sớm nếu bị hạn chế, và điều chỉnh lại `cron` trong `render.yml` (giãn ra
6h, 12h, hoặc 1 lần/ngày) nếu thấy dấu hiệu bị giảm reach — hoặc tăng lại
nhịp nếu số liệu cho thấy kênh chịu được tần suất cao hơn.

**Theo dõi số liệu kênh:** job `channel-report` chạy mỗi ngày (00:00 UTC),
cho cả 2 kênh (VI dùng `YOUTUBE_REFRESH_TOKEN`, EN dùng
`YOUTUBE_EN_REFRESH_TOKEN`), ghi ra `src/suckhoe/channel-report-vi.md` và
`channel-report-en.md` rồi tự commit — số subscriber/view/watch-time 28
ngày gần nhất và bảng hiệu suất các video mới nhất. Ghi ra file (thay vì
chỉ log) để job viết tập mới (`daily-content-writer.yml`) đọc lại được,
ưu tiên viết thêm chủ đề đang có hiệu suất tốt. Chạy tay bằng
`npm run channel-report -- --locale=vi` (hoặc `--locale=en`) — cần refresh
token có thêm quyền `youtube.force-ssl` + `yt-analytics.readonly`, chạy
lại bước 4 ở trên nếu token cũ chỉ có quyền upload.

**Tags/hashtags mỗi video:** `upload-youtube.mjs` tự thêm 5-8 tag và 4-5
hashtag theo `category` của tập (map trong chính file đó) thay vì chỉ 3 tag
chung chung như trước — theo khuyến nghị 2026 để thuật toán nhận diện chủ
đề chính xác hơn (xem comment trong file để biết map đầy đủ).

### Tự động viết thêm tập mới mỗi ngày

Workflow `.github/workflows/daily-content-writer.yml` chạy 1 lần/ngày
(20:00 UTC), gọi Claude Code CLI để tự nghiên cứu và viết thêm 8-12 tập mới
vào `src/suckhoe/episodes/`, đăng ký vào `index.ts`, rồi tự commit/push —
giữ hàng đợi không bao giờ cạn. Chạy trên GitHub Actions thay vì máy local
vì máy Windows ở đây có chính sách bảo mật (Application Control) chặn các
tiến trình do Task Scheduler khởi chạy — cùng loại giới hạn đã buộc phải
chuyển việc render/đăng video ra CI trước đó.

Không tự chạy nếu chưa có secret `ANTHROPIC_API_KEY` (repo Settings →
Secrets and variables → Actions). Đây dùng API key trả tiền theo lượng
dùng thật (khác với gói Claude subscription cá nhân) — nên kiểm tra usage
ở https://console.anthropic.com/ sau vài lần chạy đầu để biết chi phí thực
tế trước khi yên tâm để chạy dài hạn.

### Tương tác cộng đồng tự động

Hai workflow riêng, cùng cơ chế `claude -p` + prompt file như job viết tập
mới ở trên (Claude tự đọc/ghi/commit qua Bash, không phải script cứng —
cần thật sự đọc nội dung để viết được câu trả lời/comment genuine):

- **`reply-comments.yml`** (1 lần/ngày, 09:00 UTC): trả lời comment mới trên
  chính video của kênh — an toàn tuyệt đối (chỉ nói chuyện với khán giả của
  mình), lại là tín hiệu thuật toán thật (YouTube tính hội thoại qua lại
  dưới video là dấu hiệu cộng đồng gắn kết). Rule chi tiết:
  `scripts/reply-comments-prompt.txt`. Log các comment đã trả lời:
  `src/suckhoe/replied-comments-log.json`.
- **`comment-outreach.yml`** (mỗi 3 ngày, 13:00 UTC): để lại tối đa 1 comment
  MỖI kênh mỗi lần chạy, trên video của kênh KHÁC thật sự liên quan nội dung
  — không quảng cáo, không link, phải cụ thể theo đúng nội dung video đó.
  Được chủ kênh xác nhận cho chạy tự động (2026-08-23), với điều kiện giữ
  đúng các rule trong `scripts/comment-outreach-prompt.txt` (số lượng thấp,
  genuine, không hạ chuẩn để cố đạt đủ số). Log video đã comment:
  `src/suckhoe/comment-outreach-log.json`.

Cả 2 job cần refresh token có quyền `youtube.force-ssl` (quyền quản lý cũ
`youtube` KHÔNG đủ để post comment — xác nhận thực tế 2026-08-23, lỗi
"insufficient authentication scopes"). Chạy lại bước 4 ở mục "Đăng tự động
lên YouTube" phía trên nếu token hiện tại chưa có quyền này, cho CẢ 2 kênh.

### Kênh tiếng Anh (thị trường nước ngoài)

Cùng codebase, 1 kênh YouTube riêng, nội dung home remedies theo văn hoá
phương Tây (không dịch từ tiếng Việt). Kỹ thuật:

- Mỗi episode JSON thêm field `"locale": "en"` (bỏ trống hoặc `"vi"` =
  kênh Việt như cũ) — xem `src/suckhoe/types.ts` và các file `en-*.json`
  trong `src/suckhoe/episodes/` làm ví dụ. Slug tiếng Anh luôn có tiền tố
  `en-` để dễ phân biệt trong cùng 1 thư mục.
- Nhân vật host riêng (`GrandmaHostSilhouette`, không dùng chung với nhân
  vật "bà lang" của kênh Việt vì khăn/áo kiểu Việt sẽ lệch với nội dung
  phương Tây), giọng đọc tiếng Anh qua `msedge-tts` (voice mặc định
  `en-US-JennyNeural`, đổi bằng biến `EDGE_TTS_VOICE_EN`) — vẫn miễn phí,
  không tốn thêm chi phí.
- Hàng đợi đăng bài **tách riêng** khỏi kênh Việt dù nằm chung 1 file
  `published.json`: `npm run publish-next:suckhoe-en` chỉ xét các episode
  có `locale: "en"`. Lịch đăng 6 giờ/lần (4 video/ngày) — thận trọng hơn cả
  kênh Việt vì kênh này chưa có lịch sử gì cả.
- Cần secret riêng `YOUTUBE_EN_REFRESH_TOKEN` (dùng lại `YOUTUBE_CLIENT_ID`
  / `YOUTUBE_CLIENT_SECRET` cũ, chỉ refresh token là khác vì gắn với tài
  khoản Google khác) và có thể thêm variable `YOUTUBE_EN_PRIVACY_STATUS`
  riêng (mặc định `private` giống kênh Việt nếu không đặt).
- `daily-content-writer.yml` đã được cập nhật để tự viết thêm cả episode
  tiếng Anh (3-5 episode/lần) song song với tiếng Việt, cùng 1 lần chạy.

## Chỉnh sửa nội dung

- Lời thoại/giọng đọc: `src/narration*.json` (nhớ chạy lại `npm run generate-voiceover`
  sau khi sửa)
- Nội dung hiển thị từng scene: `src/scenes/*.tsx`, `src/scenes-churchill/*.tsx`
- Thời lượng mỗi scene tự tính theo độ dài file voiceover tương ứng, không cần chỉnh tay.


<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
