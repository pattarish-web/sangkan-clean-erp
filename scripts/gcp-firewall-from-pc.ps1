# รันบน Windows (PowerShell) หลังติดตั้ง Google Cloud SDK
# ใช้เปิด firewall port 3000 ให้ VM ชื่อ sangkan-clean
# แก้ $Zone ให้ตรงกับ zone ที่สร้าง VM

$ProjectId = "YOUR_PROJECT_ID"
$Zone = "us-central1-a"
$VmName = "sangkan-clean"

gcloud config set project $ProjectId

gcloud compute instances add-tags $VmName --zone=$Zone --tags=sangkan-app

gcloud compute firewall-rules create allow-sangkan-3000 `
  --direction=INGRESS `
  --priority=1000 `
  --network=default `
  --action=ALLOW `
  --rules=tcp:3000 `
  --source-ranges=0.0.0.0/0 `
  --target-tags=sangkan-app

Write-Host "Firewall ready. Open http://<EXTERNAL-IP>:3000"
