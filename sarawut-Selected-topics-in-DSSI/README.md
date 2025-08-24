
# Lineliff Orde Management Systems
## ขั้นตอนการติดตั้ง
1. ติดตั้ง Xampp บนเครื่อง
```
https://www.apachefriends.org/download.html
```
2. ติดตั้ง node.js บนเครื่อง
```
https://nodejs.org/en
```
2. clone โปรเจค
   ```bash
   git clone -b https://github.com/gusgusxs/sarawut-Selected-topics-in-DSSI.git
   ```
## Download Data Mockup
สามารถดาวโหลดได้จากลิ้งค์ด้านล่าง
https://drive.google.com/drive/folders/19lyV3XRA7nwvRft51xeEQmUa823BZEj_?usp=sharin
## ขั้นตอนการ Mockup Data
```
เมื่อดาวโหลด data มาแล้วให้ทำการสร้าง database ที่ชื่อว่า oungbeefshopsql บน phpMyaAmin
จากนั้นให้ทำการ Import database ที่ดาวโหลดมา ลงไปใน database ที่สร้างไว้

```
## ต่อไปให้ทำการสร้าง .env ในไฟล์ backend เมื่อสร้างเสร็จแล้วให้เพิ่มข้อความข้างล่างเข้าไป
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=oungbeefshopsql

*** เป็น key ของ linebot หาได้ในการสร้างบอทใน line developers
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ID=
LINE_CHANNEL_ACCESS_TOKEN=
DEFAULT_MEMBER_RICH_MENU=
```
## ต่อไปให้ทำการเปิด terminal 2 อัน
```
1. terminal แรกให้ทำการติดตั้ง
 npm install
 npm install -g vite
 และทำการเข้า path frontend โดยการพิมพ์คำสั่ง
 cd frontend
 และทำการ run project โดยใช้คำสั่ง
 npm run dev
 2. terminal ที่สองให้ทำการเข้า path
 cd backend
 npm start ขั้นตอนนี้ต้องทำการเปิด Xampp ก่อน
```
## prom_log
https://drive.google.com/file/d/1FNvOfaVaEHJnS4YVv9dA0fYRGtO_kVg_/view?usp=sharing
