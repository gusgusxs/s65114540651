<template>
  <div class="max-w-5xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow-lg mt-8">
    <h1 class="text-3xl font-bold text-center text-orange-600 mb-6">สรุปรายการสั่งซื้อ</h1>

    <!-- 🟡 สินค้าในตะกร้า -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">สินค้าในตะกร้า</h2>
      <div v-if="cart.length > 0" class="overflow-x-auto">
        <table class="w-full table-auto border-collapse shadow-md rounded-lg overflow-hidden text-sm sm:text-base">
          <thead class="bg-orange-100">
            <tr class="text-left">
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">ชื่อสินค้า</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">ราคา</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">จำนวน</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">รวม</th>
              <th class="px-4 py-3 text-sm font-semibold text-gray-700">ลบสินค้า</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in cart" :key="item.product_id" class="hover:bg-orange-50">
              <td class="px-4 py-3">{{ item.name }}</td>
              <td class="px-4 py-3">฿{{ item.price }}</td>
              <td class="px-4 py-3">{{ item.quantity }}</td>
              <td class="px-4 py-3">฿{{ (item.price * item.quantity).toFixed(2) }}</td>
              <td class="px-4 py-3">
                <button @click="removeItem(index)" class="text-red-600 hover:text-red-800 transition-transform transform hover:scale-110">❌ ลบ</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center text-gray-600 mt-4">
        🛒 <span class="text-lg font-semibold">ไม่มีสินค้าในตะกร้า</span>
      </div>
    </div>

    <!-- ฟอร์มกรอกข้อมูล -->
    <form @submit.prevent="submitOrder" class="space-y-6 bg-gray-50 p-6 rounded-lg shadow-inner">
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">ข้อมูลผู้สั่งซื้อ</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-lg font-medium text-gray-700">ชื่อผู้สั่งซื้อ</label>
          <input
            v-model="customer_name"
            type="text"
            readonly
            class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
            placeholder="ชื่อผู้สั่งซื้อ"
          />
        </div>

        <div>
          <label class="block text-lg font-medium text-gray-700">เบอร์โทร</label>
          <input
            list="phones"
            v-model="phone"
            placeholder="เลือกหรือกรอกเบอร์โทร"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500"
          />
          <datalist id="phones">
            <option v-for="option in profilePhones" :key="option" :value="option" />
          </datalist>
        </div>

        <div>
          <label class="block text-lg font-medium text-gray-700">ที่อยู่จัดส่ง</label>
          <input
            list="addresses"
            v-model="address"
            placeholder="เลือกหรือกรอกที่อยู่จัดส่ง"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500"
          />
          <datalist id="addresses">
            <option v-for="option in profileAddresses" :key="option" :value="option" />
          </datalist>
        </div>
      </div>
      <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-orange-200">
        <label class="block text-lg font-semibold text-gray-800 mb-3">วิธีรับสินค้า</label>

        <div class="flex flex-col sm:flex-row gap-4">
          <!-- ✅ มารับเองที่ร้าน -->
          <div
            @click="toggleDelivery('pickup')"
            class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 w-full sm:w-1/2"
            :class="delivery_method === 'pickup' ? 'bg-orange-100 border-orange-500 shadow-sm' : 'border-gray-300 hover:bg-orange-50'"
          >
            <div class="w-5 h-5 border-2 rounded-full flex items-center justify-center" :class="delivery_method === 'pickup' ? 'border-orange-500' : 'border-gray-400'">
              <div v-if="delivery_method === 'pickup'" class="w-3 h-3 bg-orange-500 rounded-full"></div>
            </div>
            <div class="text-gray-700 font-medium">มารับเองที่ร้าน</div>
          </div>

          <!-- ✅ จัดส่งผ่านแกร๊ป -->
          <div
            @click="toggleDelivery('delivery')"
            class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 w-full sm:w-1/2"
            :class="delivery_method === 'delivery' ? 'bg-orange-100 border-orange-500 shadow-sm' : 'border-gray-300 hover:bg-orange-50'"
          >
            <div class="w-5 h-5 border-2 rounded-full flex items-center justify-center" :class="delivery_method === 'delivery' ? 'border-orange-500' : 'border-gray-400'">
              <div v-if="delivery_method === 'delivery'" class="w-3 h-3 bg-orange-500 rounded-full"></div>
            </div>
            <div class="text-gray-700 font-medium">ให้ร้านจัดส่ง</div>
          </div>
        </div>
      </div>


      <!-- ✅ สรุปคำสั่งซื้อ -->
      <div class="bg-orange-50 p-4 rounded-lg shadow-md">
        <h3 class="text-xl font-bold text-gray-800 mb-3">สรุปคำสั่งซื้อ</h3>
        <div class="flex justify-between text-lg font-bold">
          <span>ยอดชำระทั้งหมด</span>
          <span class="text-orange-600">฿{{ totalAmount }}</span>
        </div>
      </div>

      <!-- 🟠 ปุ่มสั่งซื้อและย้อนกลับ -->
      <div class="mt-6 flex flex-col sm:flex-row justify-center gap-4">
        <button type="submit" class="w-full sm:w-auto px-8 py-3 bg-orange-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-transform transform hover:scale-105">สั่งซื้อสินค้า</button>

        <button type="button" @click="goBack" class="w-full sm:w-auto px-8 py-3 bg-gray-500 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-transform transform hover:scale-105">ย้อนกลับ</button>
      </div>
    </form>
  </div>
</template>

<script>
import liff from "@line/liff";

export default {
  data() {
    return {
      customer_name: "",
      phone: "",
      address: "",
      cart: JSON.parse(localStorage.getItem("cart")) || [],
      user_id: "",
      delivery_method: "",
      profilePhones: [],
      profileAddresses: []
    };
  },
  computed: {
    totalAmount() {
      return this.cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
    }
  },
  methods: {

  getDeliveryLabel(method) {
  return method === 'pickup'
    ? 'มารับเองที่ร้าน'
    : method === 'delivery'
    ? 'ให้ร้านจัดส่ง'
    : 'ไม่ระบุ';
  },
  // ✅ ฟังก์ชันสำหรับสลับวิธีรับสินค้า
  toggleDelivery(option) {
    this.delivery_method = this.delivery_method === option ? "" : option;
  },

  // ✅ ฟังก์ชันโหลดข้อมูลจาก LIFF
  async initLiff() {
    try {
      await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      this.user_id = profile.userId;
      this.customer_name = profile.displayName;

      // ✅ เรียก API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/get-user/${profile.userId}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      console.log("ข้อมูลผู้ใช้จาก API:", userData);

      // ✅ อัปเดตข้อมูลเบอร์โทรและที่อยู่
      this.profilePhones = userData.phone ? [userData.phone] : ["ไม่มีข้อมูลเบอร์โทร"];
      this.profileAddresses = userData.address ? [userData.address] : ["ไม่มีข้อมูลที่อยู่"];

    } catch (error) {
      console.error("LIFF Initialization Error:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  },

    goBack() {
      window.history.back();
    },

    removeItem(index) {
      this.cart.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(this.cart));
    },

    async submitOrder() {
  if (this.cart.length === 0) {
    alert("ไม่มีสินค้าในตะกร้า");
    return;
  }

  if (!this.customer_name || !this.phone.trim() || !this.address.trim()) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, เบอร์โทร, ที่อยู่)");
    return;
  }

  // ✅ ตรวจสอบเบอร์โทร
  if (!/^\d{9,10}$/.test(this.phone)) {
    alert("กรุณากรอกเบอร์โทรให้ถูกต้อง (9-10 หลัก)");
    return;
  }

  // ✅ ตรวจสอบวิธีจัดส่ง
  if (!this.delivery_method) {
    alert("กรุณาเลือกวิธีรับสินค้า");
    return;
  }
      const orderData = {
        user_id: this.user_id,
        customer_name: this.customer_name,
        phone: this.phone,
        address: this.address,
        delivery_method: this.delivery_method,
        items: this.cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: parseFloat(item.price).toFixed(2),
          quantity: parseFloat(item.quantity).toFixed(1),
          subtotal: (item.price * item.quantity).toFixed(2)
        })),
        total_price: this.totalAmount
      };

      console.log("ส่งข้อมูลคำสั่งซื้อ:", orderData);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log("Order Saved Successfully", result);
          alert(result.message);
          localStorage.removeItem("cart");
          this.$router.push("/order-history");
        } else {
          console.error("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์:", result);
          alert(`เกิดข้อผิดพลาด: ${result.message || "โปรดลองใหม่"}`);
        }
      } catch (error) {
        console.error("🚫 Error submitting order:", error);
        alert("ไม่สามารถสั่งซื้อได้");
      }

    }
  },
  mounted() {
    this.initLiff();
  }
};
</script>

<style scoped>
button:focus {
  outline: none;
}
input, textarea, select {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  margin-bottom: 12px;
}
input:focus, textarea:focus, select:focus {
  border-color: #f97316;
  outline: none;
  box-shadow: 0 0 5px rgba(249, 115, 22, 0.5);
}
table thead {
  background-color: #ffedd5;
}
table tbody tr:hover {
  background-color: #fffbeb;
}
</style>
