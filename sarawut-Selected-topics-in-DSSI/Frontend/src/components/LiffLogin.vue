<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div v-if="!user" class="bg-white p-8 rounded-lg shadow-md text-center">
      <h1 class="text-2xl font-bold mb-4">ยินดีต้อนรับสู่ร้านอึ่งเนื้อวัว</h1>
      <p class="mb-6">กรุณากดเข้าสู่ระบบด้วยบัญชี LINE ของคุณเพื่อเริ่มต้นใช้งาน</p>
      <button
        @click="login"
        class="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition duration-300"
      >
        เข้าสู่ระบบด้วย LINE
      </button>
    </div>

    <div v-else class="text-center">
      <h1 class="text-2xl font-bold mb-4">เข้าสู่ระบบสำเร็จ!</h1>
      <img :src="user.pictureUrl" alt="Profile Picture" class="w-24 h-24 rounded-full mx-auto mb-4" />
      <p class="text-lg font-semibold">{{ user.displayName }}</p>
      <p class="text-gray-600">{{ user.statusMessage || "No status message" }}</p>
      <p class="mb-6 text-green-500">กำลังนำทางไปยังหน้า {{ redirectPage }}...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import liff from '@line/liff';
import axios from 'axios';
import { useRouter } from 'vue-router';

const user = ref(null);
const redirectPage = ref();
const router = useRouter();

const login = async () => {
  try {
    const liffId = import.meta.env.VITE_LIFF_ID; // ✅ LIFF ID จาก .env
    const apiUrl = import.meta.env.VITE_API_URL; // ✅ Backend URL จาก .env

    if (!liffId) throw new Error('LIFF ID is not defined in environment variables.');

    // ✅ Initialize LIFF
    await liff.init({
      liffId: liffId,
      withLoginOnExternalBrowser: false,
    });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // ✅ ดึงข้อมูลผู้ใช้และ Access Token
    const profile = await liff.getProfile();
    const accessToken = liff.getAccessToken();

    if (!accessToken) {
      console.error('❌ No Access Token found');
      return;
    }

    user.value = profile;
    console.log('👤 Profile:', profile);
    console.log('🛡️ Access Token:', accessToken);

    // ✅ ส่งข้อมูลไป Backend เพื่อบันทึกข้อมูลผู้ใช้
    const response = await axios.post(`${apiUrl}/verify-access-token`, {
      accessToken,
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    });

    if (response.status === 200 && response.data.success) {
      console.log('✅ User profile saved successfully');

      // ✅ บันทึก Role ลง LocalStorage
      const userRole = response.data.role;
      localStorage.setItem("userRole", userRole);

      // ✅ เปลี่ยนหน้าไปตาม Role
      if (userRole === "admin") {
        redirectPage.value = "Admin Dashboard";
        setTimeout(() => router.push("/admin"), 2000);
      } else {
        redirectPage.value = "หน้าหลัก";
        setTimeout(() => router.push("/home"), 2000);
      }
    } else {
      console.error('🚫 Failed to save profile:', response.data.error);
    }

  } catch (error) {
    console.error('LIFF Error:', error);
    alert('⚠️ Login failed. Please try again.');
  }
};

onMounted(() => {
  if (liff.isInClient()) {
    login();
  } else {
    console.warn('⚠️ This app is not running inside the LINE app.');
  }
});
</script>

<style scoped>
body {
  font-family: 'Poppins', sans-serif;
}
</style>
