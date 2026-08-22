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

**Đăng theo lịch (mỗi 2 giờ 1 tập):** workflow có `schedule` cron chạy mỗi 2h,
tự lấy **tập kế tiếp chưa đăng** (theo thứ tự alphabet trong
`src/suckhoe/episodes/`, lưu trạng thái ở `src/suckhoe/published.json`), sinh
giọng đọc, render, upload, rồi tự commit lại file trạng thái — không đăng
trùng tập cũ. Hết tập trong hàng đợi thì tự log "không có tập mới" và không
làm gì, tự chạy tiếp khi có tập mới được thêm vào.

⚠️ **Lưu ý rủi ro:** đăng nhiều video/ngày với cùng 1 khuôn mẫu (giọng TTS +
nhân vật hoạt hình lặp lại) trên kênh mới là tín hiệu spam rõ với YouTube —
kênh có thể bị giảm phân phối hoặc bị xét duyệt gắt hơn thay vì tăng trưởng.
Nên theo dõi YouTube Studio (Content → trạng thái từng video, mục Copyright/
Community Guidelines) sau vài ngày đầu để phát hiện sớm nếu bị hạn chế, và
điều chỉnh lại `cron` trong `render.yml` (giãn ra 6h, 12h, hoặc 1 lần/ngày)
nếu thấy dấu hiệu bị giảm reach.

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
