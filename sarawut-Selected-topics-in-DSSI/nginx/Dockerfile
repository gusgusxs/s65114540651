# ใช้ official Nginx image เป็น image พื้นฐาน
FROM nginx:latest

# ลบไฟล์คอนฟิกเริ่มต้นของ Nginx ออกไปก่อน
# เพื่อให้แน่ใจว่าจะใช้ไฟล์ของเราเท่านั้น
RUN rm /etc/nginx/conf.d/default.conf

# คัดลอกไฟล์ nginx.conf จากในโฟลเดอร์นี้ (build context)
# ไปยังตำแหน่งที่ถูกต้องภายใน container
COPY nginx.conf /etc/nginx/conf.d/default.conf
