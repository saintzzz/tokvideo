# TikTok videos — factory nhiều sách

Nhiều video quảng cáo affiliate, mỗi video là 1 sách, định dạng 9:16 cho TikTok.
4 scene mỗi video: Hook → Quote/Story → Twist → CTA giỏ hàng.

| Video | Sách | Composition id |
|---|---|---|
| `src/GiaCatLuongVideo.tsx` | Tử Vi Luận Giải (Khải Tâm) | `GiaCatLuong-TuVi` |
| `src/ChurchillVideo.tsx` | Nghệ Thuật Giao Tiếp Đỉnh Cao (Cốc Vũ) | `Churchill-GiaoTiep` |

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
