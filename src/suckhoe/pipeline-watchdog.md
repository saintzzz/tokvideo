# Pipeline Watchdog - 2026-11-22 08:20 VN

Tự động quét mỗi 3h bởi job `pipeline-watchdog`. Queue chưa đăng: **16 tập**.

## Đã tự xử lý
- gỡ quarantine `quan-tai-troi-tap-03` (black-gate) - nguyên nhân đã hết, tập quay lại queue
- run 44729556085 job suckhoe-long: lỗi cố định `black-gate` lần 1 ở `quan-tai-troi-tap-03` - rerun thử 1 lần
- tick bị drop/delay: upload mới nhất đã 636 phút trước - tự dispatch `cay-da-tap-01`

## Cần người xem
- run 44729383284 job pipeline-watchdog: asset còn thiếu `public/videos/suckhoe-long/quan-tai-troi-tap-01/hieu-house.mp4` - cần commit file (không tự sửa được)
- run 44669234331 job suckhoe-long-next: lỗi cố định `black-gate` nhưng không trích được slug - xem log
- run 44659938053 job pipeline-watchdog: asset còn thiếu `public/videos/suckhoe-long/quan-tai-troi-tap-01/hieu-house.mp4` - cần commit file (không tự sửa được)
