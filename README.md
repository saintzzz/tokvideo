# TikTok video — Tử Vi Luận Giải (Gia Cát Lượng)

Video quảng cáo affiliate cho sách "Tử Vi Luận Giải" (Khải Tâm), định dạng 9:16 cho TikTok.
4 scene: Hook → Quote (Gia Cát Lượng) → Twist (liên hệ Tử Vi) → CTA giỏ hàng.

## Giọng đọc (voiceover)

Dùng [msedge-tts](https://github.com/Migushthe2nd/MsEdgeTTS) — gọi cùng API "Đọc to"
(Read Aloud) của Microsoft Edge, giọng neural tiếng Việt, **miễn phí, không cần đăng ký
hay API key**.

```console
npm run generate-voiceover
```

Sinh ra 4 file `public/audio/{hook,quote,twist,cta}.mp3` theo nội dung trong
`src/narration.json`. Đổi giọng bằng biến môi trường `EDGE_TTS_VOICE`
(mặc định `vi-VN-NamMinhNeural`, giọng nam; có thể đổi sang `vi-VN-HoaiMyNeural`,
giọng nữ).

## Render trên GitHub Actions (không cần máy có ffmpeg)

Máy dùng để soạn video này bị chính sách Application Control chặn chạy `ffmpeg.exe`
cục bộ, nên video được render trên GitHub Actions thay vì local. Không cần secret/API
key nào — cả bước sinh giọng đọc lẫn render đều tự chạy.

1. Push repo này lên GitHub.
2. Vào tab **Actions → Render TikTok video → Run workflow** để chạy thủ công,
   hoặc chỉ cần push lên nhánh `main` là workflow tự chạy.
3. Khi workflow xong, vào run đó, mục **Artifacts** để tải file
   `gia-cat-luong-tu-vi.zip` (chứa `GiaCatLuong-TuVi.mp4`).

## Chỉnh sửa nội dung

- Lời thoại/giọng đọc: `src/narration.json` (nhớ chạy lại `npm run generate-voiceover`
  sau khi sửa)
- Nội dung hiển thị từng scene: `src/scenes/*.tsx`
- Thời lượng mỗi scene tự tính theo độ dài file voiceover tương ứng
  (`src/Composition.tsx`), không cần chỉnh tay.


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
