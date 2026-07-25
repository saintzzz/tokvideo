# TikTok video — Tử Vi Luận Giải (Gia Cát Lượng)

Video quảng cáo affiliate cho sách "Tử Vi Luận Giải" (Khải Tâm), định dạng 9:16 cho TikTok.
4 scene: Hook → Quote (Gia Cát Lượng) → Twist (liên hệ Tử Vi) → CTA giỏ hàng.

## Render trên GitHub Actions (không cần máy có ffmpeg)

Máy dùng để soạn video này bị chính sách Application Control chặn chạy `ffmpeg.exe`
cục bộ, nên video được render trên GitHub Actions thay vì local.

1. Push repo này lên GitHub.
2. Vào **Settings → Secrets and variables → Actions → New repository secret**,
   thêm secret `ELEVENLABS_API_KEY` (lấy tại elevenlabs.io → Profile → API Keys).
3. (Tuỳ chọn) Thêm **repository variable** `ELEVENLABS_VOICE_ID` nếu muốn dùng giọng
   tiếng Việt khác thay vì giọng mặc định — tìm giọng tag "Vietnamese" trong
   ElevenLabs Voice Library rồi copy Voice ID.
4. Vào tab **Actions → Render TikTok video → Run workflow** để chạy thủ công,
   hoặc chỉ cần push lên nhánh `main` là workflow tự chạy.
5. Khi workflow xong, vào run đó, mục **Artifacts** để tải file
   `gia-cat-luong-tu-vi.zip` (chứa `GiaCatLuong-TuVi.mp4`).

## Chỉnh sửa nội dung

- Lời thoại/giọng đọc: `src/narration.json`
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
