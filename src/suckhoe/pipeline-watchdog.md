# Pipeline Watchdog - 2026-11-25 15:36 VN

Tự động quét mỗi 3h bởi job `pipeline-watchdog`. Queue chưa đăng: **4 tập**.

## Đã tự xử lý
- run 45550775579 job suckhoe-long-next: lỗi tạm thời (TTS/mạng/asset-vừa-fix) - rerun failed jobs
- run 45513757080 job pipeline-watchdog: lỗi tạm thời (TTS/mạng/asset-vừa-fix) - rerun failed jobs
- ngày trống (tick sáng bị drop): tự dispatch arc-start `nguoi-di-dan-mua-tap-04` dù ngoài khung giờ

## Cần người xem
- **STALL 38h**: còn 4 tập chưa đăng mà upload mới nhất đã 38h trước - auto-heal không cứu được, cần người xem
- **QUEUE LOW**: chỉ còn 4 tập chưa đăng (< 5) - queue-refill cần chạy
- Shorts stall 44h nhưng teaser-ahead picker trả rỗng - mọi tập chưa đăng đã có teaser; cần arc mới từ queue-refill
