<template>
  <div class="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 relative">
    <!-- ✅ หัวข้อ -->
    <h1 class="text-2xl sm:text-3xl font-semibold text-gray-800 text-center mb-6">
      สั่งซื้อสินค้า OUNG BEEF
    </h1>
    <div class="mb-6">
    <!-- ฟอร์มค้นหาสินค้า -->
    <div class="mb-6 relative">
      <input
        v-model="searchQuery"
        @input="filterProducts"
        type="text"
        placeholder="ค้นหาสินค้า..."
        class="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
      />

      <!-- ไอคอนค้นหา -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    </div>
  </div>
    <!-- ✅ ปุ่มโปรไฟล์และตะกร้า -->
    <div class="fixed top-4 right-4 flex items-center space-x-4 z-50">
      <!-- ✅ ปุ่มโปรไฟล์ -->
      <div @click="goToProfile" class="relative cursor-pointer">
        <img
          :src="user.pictureUrl || 'https://dummyimage.com/40x40/cccccc/000000&text=👤'"
          alt="Profile"
          class="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-orange-500"
        />
      </div>

      <!-- ✅ ปุ่มตะกร้าสินค้า -->
      <div class="relative">
        <button @click="toggleCartDropdown" class="relative text-gray-800 hover:text-orange-600 border-4 border-white rounded-full p-3 bg-white shadow-lg">
          🛒
          <span v-if="cart.length > 0" class="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {{ cart.length }}
          </span>
        </button>

        <!-- ✅ Dropdown ตะกร้าสินค้า -->
        <div v-if="showCartDropdown" class="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-300 max-h-96 overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">ตะกร้าสินค้า</h3>

          <div v-if="cart.length === 0" class="text-gray-600 text-center">ไม่มีสินค้าในตะกร้า</div>

          <div v-else>
            <div v-for="(item, index) in cart" :key="index" class="flex justify-between items-center mb-4">
              <div>
                <p class="font-medium text-gray-800">{{ item.name }}</p>
                <p class="text-gray-600">฿{{ item.price }} x {{ item.quantity }} กิโลกรัม</p>
              </div>
              <button @click="removeFromCart(index)" class="text-red-500 hover:text-red-600 font-bold">ลบ</button>
            </div>

            <hr class="my-4" />

            <div class="flex justify-between font-medium text-gray-800">
              <p>ยอดรวม:</p>
              <p>฿{{ totalPrice }}</p>
            </div>

            <button @click="checkout" class="w-full mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">
              ยืนยันการสั่งซื้อ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 🟡 สินค้า -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
      <div
        v-for="product in products"
        :key="product.product_id"
        class="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <img :src="product.image_url || 'https://via.placeholder.com/150'" alt="product.product_name" class="w-full h-48 object-cover">
        <div class="p-4">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-800">{{ product.product_name }}</h2>
          <p class="text-gray-600">฿{{ product.price }}/กิโลกรัม</p>

          <!-- ✅ แสดงจำนวนคงเหลือหรือสินค้าหมด -->
          <p :class="{'text-red-500 font-bold': product.quantity == 0, 'text-sm text-gray-500': product.quantity > 0}">
            {{ product.quantity > 0 ? 'คงเหลือ: ' + product.quantity + ' กิโลกรัม' : ' สินค้าหมด' }}
          </p>

          <div class="mt-4">
            <label class="block text-gray-700">ระบุน้ำหนัก (กิโลกรัม):</label>
            <input
              type="text"
              v-model="product.inputQuantity"
              class="w-full mt-2 border rounded-lg px-2 py-1"
              @input="filterInput(product)"
              @blur="validateQuantity(product)"
              :disabled="product.quantity <= 0"
            />

            <!-- ✅ แสดงข้อความเตือนเมื่อสั่งเกินจำนวนคงเหลือ -->
            <p v-if="product.errorMessage" class="text-red-500 text-sm mt-1">{{ product.errorMessage }}</p>
          </div>

          <button
            @click="addToCart(product)"
            class="w-full mt-4 bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600"
            :disabled="product.quantity <= 0"
          >
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import liff from "@line/liff";
import axios from "axios";

export default {
  data() {
    return {
      products: [],
      cart: [],
      showCartDropdown: false,
      user: {
        pictureUrl: "",
        displayName: "",
        userId: "",
      },
      searchQuery: '',
    };
  },
  computed: {
    totalPrice() {
      return this.cart.reduce((total, item) => {
        const price = parseFloat(item.price);
        const quantity = parseFloat(item.quantity);
        return !isNaN(price) && !isNaN(quantity) ? total + price * quantity : total;
      }, 0).toFixed(2);
    },
  },
  methods: {

    filterProducts() {
    if (!this.searchQuery) {
      this.fetchProducts(); // ถ้าคำค้นหาว่าง ให้โหลดสินค้าทั้งหมด
    } else {
      this.products = this.products.filter(product =>
        product.product_name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  },
    async initLiff() {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          const profile = await liff.getProfile();
          this.user = {
            pictureUrl: profile.pictureUrl,
            displayName: profile.displayName,
            userId: profile.userId,
          };
          this.fetchProducts();
        }
      } catch (error) {
        console.error("LIFF Initialization Error:", error);
      }
    },

    async fetchProducts() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/Products`);
        this.products = response.data.map(product => ({
          ...product,
          inputQuantity: '',
          errorMessage: ''
        }));
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    },

    goToProfile() {
      this.$router.push("/profile");
    },

    toggleCartDropdown() {
      this.showCartDropdown = !this.showCartDropdown;
    },

    filterInput(product) {
      product.inputQuantity = product.inputQuantity
        .replace(/[^\d.]/g, '')
        .replace(/(\..*?)\..*/g, '$1')
        .replace(/^0+(\d)/, '$1')
        .replace(/^[-]+/, '');
    },

    validateQuantity(product) {
  // แปลง inputQuantity เป็นตัวเลข
  const inputQuantity = parseFloat(product.inputQuantity);
  const availableQuantity = parseFloat(product.quantity); // ✅ แปลง product.quantity เป็นตัวเลข

  if (isNaN(inputQuantity) || inputQuantity <= 0) {
    product.errorMessage = "กรุณาระบุน้ำหนักที่ถูกต้อง";
  } else if (isNaN(availableQuantity) || inputQuantity > availableQuantity) {
    product.errorMessage = `จำนวนคงเหลือไม่พอ (คงเหลือ: ${availableQuantity || 0} กก.)`;
  } else {
    product.errorMessage = ""; // ✅ เคลียร์ข้อความเมื่อถูกต้อง
  }
},

    addToCart(product) {
      const quantity = parseFloat(product.inputQuantity);

      if (isNaN(quantity) || quantity <= 0) {
        product.errorMessage = "กรุณาระบุน้ำหนักที่ถูกต้อง";
        return;
      }

      if (quantity > product.quantity) {
        product.errorMessage = `จำนวนคงเหลือไม่พอ (คงเหลือ: ${product.quantity} กก.)`;
        return;
      }

      const existingItem = this.cart.find(item => item.id === product.product_id);
      if (existingItem) {
        existingItem.quantity = (parseFloat(existingItem.quantity) + quantity).toFixed(1);
      } else {
        this.cart.push({
          id: product.product_id,
          name: product.product_name,
          price: parseFloat(product.price).toFixed(2),
          quantity: quantity.toFixed(1),
        });
      }

      product.quantity = (product.quantity - quantity).toFixed(1);
      product.inputQuantity = '';
      product.errorMessage = '';

      this.saveCartToLocalStorage();
    },

    removeFromCart(index) {
      const item = this.cart[index];
      const product = this.products.find(p => p.product_id === item.id);
      if (product) {
        product.quantity = (parseFloat(product.quantity) + parseFloat(item.quantity)).toFixed(1);
      }
      this.cart.splice(index, 1);
      this.saveCartToLocalStorage();
    },

    checkout() {
      if (this.cart.length === 0) {
        alert("ไม่มีสินค้าในตะกร้า");
        return;
      }
      localStorage.setItem("cart", JSON.stringify(this.cart));
      this.$router.push("/checkout");
    },

    saveCartToLocalStorage() {
      localStorage.setItem("cart", JSON.stringify(this.cart));
    },

    loadCartFromLocalStorage() {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
    },
  },

  mounted() {
    this.initLiff();
    this.loadCartFromLocalStorage();
  },
};
</script>

<style scoped>
/* ✅ ปิด Spin Buttons ใน Input Number */
input::-webkit-inner-spin-button,
input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* ✅ เพิ่ม Hover Effect สำหรับรูปโปรไฟล์ */
img:hover {
  border-color: #f97316;
  transition: border-color 0.3s ease;
}

/* ✅ Scrollbar สำหรับตะกร้าสินค้า */
.w-72::-webkit-scrollbar {
  width: 6px;
}

.w-72::-webkit-scrollbar-thumb {
  background-color: #f97316;
  border-radius: 3px;
}
</style>
