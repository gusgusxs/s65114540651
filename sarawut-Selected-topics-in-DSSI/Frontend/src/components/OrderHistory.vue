<template>
  <div class="container mx-auto px-6 py-10">
    <button
      @click="goHome"
      class="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-md flex items-center transition-all"
    >
      กลับหน้าแรก
    </button>
    <h1 class="text-4xl font-extrabold text-orange-600 text-center mb-10">📜 ประวัติการสั่งซื้อ</h1>
    <div v-if="orders.length > 0" class="space-y-8">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-item bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-orange-200"
      >
        <div class="space-y-4">
          <p class="text-lg font-semibold text-gray-800">
            🧑‍💼 <span class="text-orange-500">{{ order.customer_name }}</span>
          </p>
          <p class="text-gray-700"><span class="font-medium">{{ order.phone }}</span></p>
          <p class="text-gray-700"><span class="font-medium">{{ order.address }}</span></p>
          <p class="text-gray-700">วันที่สั่งซื้อ: <span class="font-medium">{{ formatDate(order.order_date) }}</span></p>


          <h2 class="text-2xl font-bold text-orange-600 mt-6">รายการสินค้า</h2>
          <ul class="mt-4 space-y-3">
            <li
              v-for="item in order.items"
              :key="item.product_id"
              class="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400 shadow-sm hover:bg-orange-100 transition"
            >
              <p class="text-gray-800 font-medium">{{ item.product_name }}</p>
              <p class="text-gray-600 text-sm">จำนวน: <span class="text-orange-500 font-semibold">{{ item.quantity }}</span> ชิ้น</p>
              <p class="text-gray-600 text-sm">ราคา: <span class="text-orange-500 font-semibold">{{ item.price }} บาท/ชิ้น</span></p>
            </li>
          </ul>

          <p class="text-2xl font-bold text-orange-600 border-t pt-4 mt-4 text-right">ยอดรวม: {{ order.total_price }} บาท</p>
        </div>
      </div>
    </div>

    <div v-else>
      <p class="text-gray-500 text-center py-12 text-xl">ไม่มีประวัติการสั่งซื้อ</p>
    </div>
  </div>
</template>

<script>
import liff from "@line/liff";
import { useRouter } from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const goHome = () => {
      router.push("/home");
    };
    return { goHome };
  },
  data() {
    return {
      orders: [], // เก็บข้อมูลประวัติการสั่งซื้อ
      user_id: "",
      access_token: "",
      refreshInterval: null,
    };
  },
  methods: {
    formatDate(dateString) {
      const options = { year: "numeric", month: "long", day: "numeric" };
      return new Date(dateString).toLocaleDateString("th-TH", options);
    },

    async loadOrders() {
      try {
        if (!this.access_token || !this.user_id) {
          console.error("❌ No LINE Access Token or User ID found!");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/userorders`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.access_token}`,
          },
        });

        if (response.ok) {
          this.orders = await response.json();
        } else {
          console.error("❌ Error loading order history.");
          alert("ไม่สามารถโหลดข้อมูลประวัติการสั่งซื้อได้");
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
      }
    },

    async initLiff() {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          const profile = await liff.getProfile();
          this.user_id = profile.userId;
          this.access_token = liff.getAccessToken();

          this.loadOrders();
          this.startAutoRefresh();
        }
      } catch (error) {
        console.error("LIFF Initialization Error:", error);
      }
    },

    startAutoRefresh() {
      if (this.refreshInterval) clearInterval(this.refreshInterval);
      this.refreshInterval = setInterval(() => {
        this.loadOrders();
      }, 10000); // รีเฟรชข้อมูลทุก 10 วินาที
    },
  },
  mounted() {
    this.initLiff();
  },
  beforeUnmount() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  },
};
</script>
