# Cinematic Upgrade — "như film hoạt hình" cho kênh Suc Khoe

## Research tóm tắt

Kỹ thuật khiến video motion-graphic trông "produced" như hoạt hình
(Kurzgesagt-style explainer, motion design cho Shorts):

1. **Nhân vật sống** — idle animation liên tục: thở (torso scale nhẹ),
   chớp mắt chu kỳ, miệng mở/khép theo nhịp thoại, đầu nghiêng phản ứng.
   Nhân vật tĩnh = slideshow; nhân vật idle = phim.
2. **Camera rig** — mỗi scene có 1 camera move chậm (push-in / pull-back /
   drift ngang), không bao giờ đứng yên. Push-in ở payoff, pull-back ở setup.
3. **Parallax nhiều lớp** — nền/giữa/trước trôi với vận tốc khác nhau theo
   một driver chung; yếu tố foreground mờ (depth of field giả).
4. **Squash & stretch + anticipation** — elements vào màn hình overshoot
   rồi settle (spring damping thấp), badge nén-dãn khi đập xuống.
5. **Ánh sáng** — god rays / light sweep chéo chuyển động chậm, rim light,
   vignette (đã có), grain (đã có).
6. **Color scripting** — palette theo cung bậc cảm xúc (đã có qua themes.ts).

## Quyết định áp dụng vào repo

- Port model sheet Bà Tư (`blender/ba-tu-concept.html` — SVG vẽ tay đã
  duyệt) thành `BaTuCharacter.tsx` với rig animation: breathing, blink,
  mouth-sync (`talking_mouth.py` port), head bob, arm sway. Thay thế
  `HostSilhouette` ở các scene Shorts.
- `CinematicCamera`: wrapper per-scene, push/pull/drift xen kẽ theo scene.
- `NutritionBackground`: particles chia 3 lớp parallax + lớp bokeh
  foreground mờ + god rays (`GodRays.tsx`).
- Badge/typo: giữ spring overshoot; thêm squash khi land.
- Không đổi transition fade (phù hợp tone channel) — chuyển động do
  camera đảm nhiệm.

Ràng buộc: mọi animation deterministic theo frame (không Math.random
lúc render), text không vượt safe-zone, giữ nguyên tốc độ đọc.
