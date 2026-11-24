# Pipeline Watchdog - 2026-11-25 06:55 VN

Tự động quét mỗi 3h bởi job `pipeline-watchdog`. Queue chưa đăng: **5 tập**.

## Đã tự xử lý
- tick bị drop/delay: upload mới nhất đã 1743 phút trước - tự dispatch `nguoi-di-dan-mua-tap-03`

## Cần người xem
- **STALL 29h**: còn 5 tập chưa đăng mà upload mới nhất đã 29h trước - auto-heal không cứu được, cần người xem
- Shorts stall 35h nhưng teaser-ahead picker trả rỗng - mọi tập chưa đăng đã có teaser; cần arc mới từ queue-refill
