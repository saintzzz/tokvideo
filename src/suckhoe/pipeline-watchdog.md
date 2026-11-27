# Pipeline Watchdog - 2026-11-28 06:29 VN

Tự động quét mỗi 3h bởi job `pipeline-watchdog`. Queue chưa đăng: **5 tập**.

## Đã tự xử lý
- tick bị drop/delay: upload mới nhất đã 1127 phút trước - tự dispatch `ghe-mua-lu-tap-01`
- Shorts stall 19h: tự dispatch teaser-ahead cho `ghe-mua-lu-tap-01` (cron teaser bị drop)

## Cần người xem
- run 45754957007 job suckhoe-long-next: lỗi tạm thời nhưng đã rerun 3 lần - cần xem tay
