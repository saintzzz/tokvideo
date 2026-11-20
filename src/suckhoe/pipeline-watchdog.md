# Pipeline Watchdog - 2026-11-20 18:40 VN

Tự động quét mỗi 3h bởi job `pipeline-watchdog`. Queue chưa đăng: **21 tập**.

## Đã tự xử lý
- run 44669234331 job suckhoe-long-next: lỗi tạm thời (TTS/mạng/asset-vừa-fix) - rerun failed jobs
- run 44610828221 job suckhoe-long: lỗi tạm thời (TTS/mạng/asset-vừa-fix) - rerun failed jobs
- tick bị drop/delay: upload mới nhất đã 1768 phút trước - tự dispatch `quan-tai-troi-tap-03`

## Cần người xem
- **STALL 29h**: còn 21 tập chưa đăng mà upload mới nhất đã 29h trước - auto-heal không cứu được, cần người xem
- run 44659938053 job pipeline-watchdog: asset còn thiếu `public/videos/suckhoe-long/quan-tai-troi-tap-01/hieu-house.mp4` - cần commit file (không tự sửa được)
- run 44321020890 job suckhoe-long: lỗi tạm thời nhưng đã rerun 3 lần - cần xem tay
- run 44297387751 job suckhoe-long: asset còn thiếu `public/videos/suckhoe-long/quan-tai-troi-tap-01/hieu-house.mp4` - cần commit file (không tự sửa được)
