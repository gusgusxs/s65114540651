<template>
  <div class="profile-page p-4 sm:p-8 bg-gray-50 min-h-screen relative">
    <!-- Back Button -->
    <button
      @click="goHome"
      class="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-md flex items-center transition-all"
    >
     กลับหน้าแรก
    </button>

    <h1 class="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left text-gray-800">
      โปรไฟล์ผู้ใช้งาน
    </h1>

    <!-- Profile Header -->
    <div class="flex flex-col items-center sm:flex-row sm:items-start mb-6">
      <img
        :src="user.pictureUrl"
        alt="User Avatar"
        class="rounded-full border-4 border-gray-300 shadow-lg mb-4 sm:mb-0 sm:mr-4"
        width="100"
        height="100"
      />
      <h2 class="text-xl sm:text-2xl font-semibold text-gray-800">{{ user.displayName || 'ผู้ใช้งาน' }}</h2>
    </div>

    <!-- Profile Form -->
    <div class="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
      <form @submit.prevent="handleSubmit">

        <!-- Display Name (Non-editable) -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ชื่อLINE:</label>
          <div class="bg-gray-100 p-2 rounded-md border border-gray-300 text-gray-800 shadow-inner">
            {{ user.displayName }}
          </div>
        </div>

        <!-- Address -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">ที่อยู่:</label>
          <div class="flex items-center bg-gray-100 p-2 rounded-md border border-gray-300">
            <input
              v-model="user.address"
              type="text"
              placeholder="กรอกที่อยู่"
              class="flex-1 outline-none text-gray-800 bg-transparent focus:border-orange-500 focus:ring-2 focus:ring-orange-300"
              :readonly="!isEditing"
            />
            <button type="button" class="text-gray-500 hover:text-orange-600 ml-2" @click="toggleEdit">
              {{ isEditing ? '💾' : '✏️' }}
            </button>
          </div>
        </div>

        <!-- Phone -->
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">เบอร์โทร:</label>
          <div class="flex items-center bg-gray-100 p-2 rounded-md border border-gray-300">
            <input
              v-model="user.phone"
              type="tel"
              placeholder="กรอกเบอร์โทร"
              class="flex-1 outline-none text-gray-800 bg-transparent focus:border-orange-500 focus:ring-2 focus:ring-orange-300"
              :readonly="!isEditing"
            />
            <button type="button" class="text-gray-500 hover:text-orange-600 ml-2" @click="toggleEdit">
              {{ isEditing ? '💾' : '✏️' }}
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md w-full shadow-md transform hover:scale-105 transition-all"
          :class="{ 'opacity-50 cursor-not-allowed': !isEditing || isLoading }"
          :disabled="!isEditing || isLoading"
        >
          {{ isLoading ? 'กำลังบันทึก...' : '✅ ยืนยันแก้ไขข้อมูล' }}
        </button>

        <!-- Success Message -->
        <p v-if="showSuccess" class="mt-4 text-green-600 font-medium text-center animate-pulse">
          🎉 ข้อมูลบันทึกสำเร็จ!
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import { useRouter } from "vue-router";
import liff from '@line/liff';
import axios from 'axios';

export default {
  name: "ProfilePage",
  setup() {
    const router = useRouter();
    const goHome = () => {
      router.push("/home");
    };
    return { goHome };
  },
  data() {
    return {
      user: {
        displayName: "",
        pictureUrl: "",
        address: "",
        phone: "",
      },
      isEditing: false,
      showSuccess: false,
      isLoading: false,
    };
  },
  async created() {
    await this.initializeLiff();
  },
  methods: {
    async initializeLiff() {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        this.user.displayName = profile.displayName;
        this.user.pictureUrl = profile.pictureUrl;

        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/get-user/${profile.userId}`);
          if (response.data) {
            this.user.address = response.data.address || "";
            this.user.phone = response.data.phone || "";
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.warn(" ไม่พบข้อมูลผู้ใช้ใน Backend");
          } else {
            console.error(" เกิดข้อผิดพลาดในการเชื่อมต่อกับ API:", error);
          }
        }
      } catch (error) {
        console.error("LIFF Error:", error);
      }
    },

    toggleEdit() {
      this.isEditing = !this.isEditing;
    },

    async handleSubmit() {
      if (this.isEditing) {
        if (!this.user.phone.match(/^[0-9]{9,10}$/)) {
          alert(" กรุณากรอกเบอร์โทรให้ถูกต้อง (9-10 หลัก)");
          return;
        }

        this.isLoading = true;

        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/update-profile`, {
            displayName: this.user.displayName,
            address: this.user.address,
            phone: this.user.phone,
          });

          this.showSuccess = true;
          setTimeout(() => (this.showSuccess = false), 3000);
        } catch (error) {
          console.error("Error updating profile:", error);
          alert(" เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
          this.isEditing = false;
          this.isLoading = false;
        }
      }
    },
  },
};
</script>

<style scoped>
.profile-page {
  background-color: #f9fafb;
  min-height: 100vh;
}

input:focus {
  border-color: #ea580c;
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2);
}

button:hover {
  transform: scale(1.05);
  transition: all 0.2s ease-in-out;
}
</style>
