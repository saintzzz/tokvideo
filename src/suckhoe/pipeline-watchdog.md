# Pipeline Watchdog - 2026-11-21 09:15 VN

Tự động quét mỗi 3h bởi job `pipeline-watchdog`. Queue chưa đăng: **19 tập**.

## Đã tự xử lý
- run 44729556085 job suckhoe-long: lỗi tạm thời (TTS/mạng/asset-vừa-fix) - rerun failed jobs
- ngày trống (tick sáng bị drop): tự dispatch arc-start `cau-khi-tap-01` dù ngoài khung giờ

## Cần người xem
- run 44729383284 job pipeline-watchdog: asset còn thiếu `public/videos/suckhoe-long/quan-tai-troi-tap-01/hieu-house.mp4` - cần commit file (không tự sửa được)
- run 44669234331 job suckhoe-long-next: lỗi tạm thời nhưng đã rerun 3 lần - cần xem tay
- run 44659938053 job pipeline-watchdog: asset còn thiếu `public/videos/suckhoe-long/quan-tai-troi-tap-01/hieu-house.mp4` - cần commit file (không tự sửa được)
