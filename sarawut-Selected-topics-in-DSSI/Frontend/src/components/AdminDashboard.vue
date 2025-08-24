<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-orange-300 text-white p-4 md:block hidden">
      <h2 class="text-xl font-bold mb-4 text-orange-900">AdminDashboard</h2>
      <ul>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition" @click="currentTab = 'products'">
            การจัดการสินค้า
          </button>
        </li>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition" @click="currentTab = 'orders'">
            ประวัติการสั่งซื้อ
          </button>
        </li>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition"
            @click="currentTab = 'analytics'">
            การสั่งซื้อของลูกค้า
          </button>
        </li>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition" @click="currentTab = 'summary'">
            สรุปยอดขาย
          </button>
        </li>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition"
            @click="currentTab = 'promotion'">
            ส่งโปรโมชั่น
          </button>
        </li>
        <li class="mb-2">
          <button class="w-full text-left px-4 py-2 bg-orange-200 text-orange-900 rounded hover:bg-orange-400 transition"
            @click="openLineManager">
            จัดการ LINE Business
  </button>
</li>
      </ul>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6">
      <h1 class="text-2xl font-bold text-orange-700 mb-4" v-if="currentTab === 'products'">การจัดการสินค้าร้านอึ่งเนื้อวัว</h1>
      <h1 class="text-2xl font-bold text-orange-700 mb-4" v-if="currentTab === 'orders'">ประวัติการสั่งซื้อ</h1>

      <div v-if="currentTab === 'promotion'">
          <h2 class="text-2xl font-bold text-orange-700 mb-4">ส่งโปรโมชั่นให้ลูกค้า</h2>
          <div class="bg-white p-6 rounded-lg shadow border-l-4 border-orange-400 max-w-3xl">
            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">เลือกลูกค้า</label>
              <select v-model="selectedPromoUser" class="border p-2 rounded w-full">
                <option value="all">ส่งให้ลูกค้าทุกคน</option>
                <option v-for="user in userList" :key="user.line_user_id" :value="user.line_user_id">
                  {{ user.display_name }}
                </option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">ชื่อโปรโมชัน / สินค้า</label>
              <input type="text" v-model="promoTitle" class="border p-2 rounded w-full" />
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">รายละเอียด</label>
              <textarea v-model="promoDescription" rows="3" class="border p-2 rounded w-full"></textarea>
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">ลิงก์สินค้า/โปรโมชัน</label>
              <input type="text" v-model="promoLink" class="border p-2 rounded w-full" />
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">ลิงก์รูปภาพสินค้า (URL)</label>
              <input type="text" v-model="promoImageUrl" class="border p-2 rounded w-full" />
            </div>

            <button
              @click="sendPromotion"
              class="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded font-bold transition">
              ส่งโปรโมชัน
            </button>

            <p v-if="promotionStatus" class="mt-4 text-green-600 font-medium">{{ promotionStatus }}</p>
          </div>
        </div>

      <div v-if="currentTab === 'analytics'">
        <h2 class="text-2xl font-bold text-orange-700 mb-4">การวิเคราะห์การสั่งซื้อของลูกค้า</h2>
        <p class="text-gray-700 mb-4">เลือกผู้ใช้เพื่อดูสถิติการสั่งซื้อ</p>

        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-orange-400">
          <div class="mb-6">
            <label for="user" class="block text-gray-700 font-medium mb-1">เลือกผู้ใช้</label>
            <select
              v-model="selectedUserId"
              @change="loadAnalyticsChartByUser"
              class="border p-2 rounded w-full max-w-sm"
            >
              <option disabled value="">เลือกผู้ใช้</option>
              <option v-for="user in userList" :key="user.line_user_id" :value="user.line_user_id">
                {{ user.display_name }}
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-1">เลือกช่วงวันที่</label>
            <div class="flex space-x-2">
              <input type="date" v-model="startDate" class="border p-2 rounded w-full max-w-sm" />
              <input type="date" v-model="endDate" class="border p-2 rounded w-full max-w-sm" />
            </div>
            <button
              @click="loadAnalyticsChartByUser"
              class="mt-2 bg-orange-500 hover:bg-orange-700 text-white px-4 py-2 rounded transition"
            > ดูรายละเอียดสินค้าที่สั่งซื้อ
            </button>
          </div>

          <!-- 📊 Interactive Chart -->
          <div v-if="chartLabels.length" class="mt-6">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <div v-if="currentTab === 'summary'">
        <h2 class="text-2xl font-bold text-orange-700 mb-4">ยอดขายรวมของร้าน</h2>
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-orange-400">

          <!-- 🔶 ส่วนเลือกช่วงวันที่ -->
          <div class="mb-4 flex gap-2 items-end">
            <div class="flex flex-col">
              <label class="text-gray-700 font-medium mb-1">จากวันที่</label>
              <input type="date" v-model="startDateSummary" class="border p-2 rounded" />
            </div>
            <div class="flex flex-col">
              <label class="text-gray-700 font-medium mb-1">ถึงวันที่</label>
              <input type="date" v-model="endDateSummary" class="border p-2 rounded" />
            </div>
          </div>

    <!-- 🔶 กราฟ + ยอดรวม -->
    <div v-if="summaryLabels.length">
            <Bar :data="summaryData" :options="summaryOptions" />
            <p class="mt-4 text-center text-2xl font-bold text-orange-600">
              รวมรายได้ทั้งหมด:
              {{ parseFloat(totalRevenue).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              บาท
            </p>
          </div>
          <p v-else class="text-gray-500 text-center">กรุณาเลือกช่วงวันที่เพื่อแสดงข้อมูล</p>
        </div>
      </div>

      <div v-if="currentTab === 'products'">
        <!-- ฟอร์มเพิ่มสินค้า -->
        <div class="bg-white p-4 rounded-lg shadow mb-6 border-l-4 border-orange-400">
          <h2 class="text-lg font-bold text-orange-600 mb-2">เพิ่มสินค้าใหม่</h2>
          <input v-model="newProduct.product_name" type="text" placeholder="ชื่อสินค้า" class="border p-2 w-full mb-2 rounded">
          <input v-model="newProduct.price" type="number" placeholder="กรอกจำนวนเงิน" class="border p-2 w-full mb-2 rounded">
          <input v-model="newProduct.quantity" type="number" placeholder="กรอกจำนวนกิโลกรัม" class="border p-2 w-full mb-2 rounded">
          <input v-model="newProduct.image_url" type="text" placeholder="URL รูปภาพสินค้า" class="border p-2 w-full mb-2 rounded">
          <button @click="addProduct" class="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-600 transition">เพิ่มสินค้า</button>
        </div>

        <!-- ตารางสินค้า -->
        <div class="bg-white p-4 rounded-lg shadow border-l-4 border-orange-400">
          <h2 class="text-lg font-bold text-orange-600 mb-2">รายการสินค้า</h2>
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-orange-200 text-gray-800">
                <th class="border p-2">ลำดับ</th>
                <th class="border p-2">รูป</th>
                <th class="border p-2">ชื่อสินค้า</th>
                <th class="border p-2">ราคา (บาท)</th>
                <th class="border p-2">คงเหลือ (กิโลกรัม)</th>
                <th class="border p-2">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, index) in products" :key="product.product_id" class="hover:bg-gray-100 transition">
                <td class="border p-2">{{ index + 1 }}</td>
                <td class="border p-2">
                  <img :src="product.image_url" class="w-16 h-16 object-cover rounded" v-if="product.image_url">
                </td>
                <td class="border p-2">
                  <input v-if="product.editing" v-model="product.product_name" class="border p-1 rounded">
                  <span v-else>{{ product.product_name }}</span>
                </td>
                <td class="border p-2">
                  <input v-if="product.editing" v-model="product.price" type="number" class="border p-1 rounded">
                  <span v-else>{{ product.price }} บาท</span>
                </td>
                <td class="border p-2">
                  <input v-if="product.editing" v-model="product.quantity" type="number" class="border p-1 rounded">
                  <span v-else>{{ product.quantity }} กก.</span>
                </td>
                <td class="border p-2">
                  <button v-if="product.editing" @click="updateProduct(product)" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700 transition">💾 บันทึก</button>
                  <button v-else @click="product.editing = true" class="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-700 transition">✏️ แก้ไข</button>
                  <button @click="deleteProduct(product.product_id)" class="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-700 transition">🗑 ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

  <div v-if="currentTab === 'orders'">
    <div class="mb-4 max-w-sm">
    <label class="block text-gray-700 font-medium mb-1">เลือกผู้ใช้เพื่อดูประวัติคำสั่งซื้อ</label>
    <select v-model="selectedUserId" class="border p-2 rounded w-full">
      <option value="">แสดงของลูกค้าทุกคน</option>
  <option v-for="user in userList" :key="user.line_user_id" :value="user.line_user_id">
    {{ user.display_name }}
  </option>
    </select>
  </div>
  <p v-if="filteredOrders.length === 0" class="text-gray-600">
  ไม่พบคำสั่งซื้อของลูกค้าคนนี้
</p>

<ul v-else>
  <li v-for="order in filteredOrders" :key="order.id" class="border p-4 mb-4 rounded bg-white shadow">
    <div class="p-4 bg-gray-100 rounded-lg">
      <p><strong>ลูกค้า:</strong> {{ order.customer_name }}</p>
      <p><strong>เบอร์:</strong> {{ order.phone }}</p>
      <p><strong>ที่อยู่:</strong> {{ order.address }}</p>
      <p><strong>วันที่สั่งซื้อ:</strong> {{ formatDate(order.order_date) }}</p>

  <h2 class="text-lg font-bold text-orange-600 mt-4">รายการสินค้า</h2>

  <!-- ✅ ตรวจสอบว่า order.items มีจริงก่อนแสดง -->
  <ul v-if="filteredOrders && filteredOrders.length > 0">
    <li
      v-for="item in order.items"
      :key="item.product_id"
      class="bg-white p-3 rounded border-l-4 border-orange-400 shadow-sm"
    >
      <p><strong>สินค้า:</strong> {{ item.product_name }}</p>
      <p>จำนวน: {{ item.quantity }} ชิ้น | ราคา: {{ item.price }} บาท/ชิ้น</p>

      <!-- ✅ เช็คให้แน่ใจว่า payment_status มีค่าก่อน -->
      <p class="text-gray-700" v-if="order.payment_status">
        สถานะการชำระเงิน:
        <span
          :class="order.payment_status === 'จ่ายแล้ว' ? 'text-orange-600 font-bold' : 'text-red-600 font-bold'"
        >
          {{ order.payment_status }}
        </span>
      </p>

      <label class="block text-sm font-medium text-gray-700">สถานะการจัดส่ง:</label>
  <select v-model="selectedDeliveryStatus" class="border p-2 rounded w-full">
    <option disabled value="">กรุณาเลือกสถานะ</option>
    <option value="กำลังจัดส่ง">กำลังจัดส่ง</option>
    <option value="จัดส่งสำเร็จ">จัดส่งสำเร็จ</option>
  </select>

  <!-- เวลาประมาณการจัดส่ง -->
  <input type="text" v-model="deliveryETA" placeholder="ระบุเวลาประมาณ" />

  <div class="mt-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
  <button
    @click="updateDeliveryStatus(order)"
    class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition">
    อัปเดตสถานะการจัดส่ง
  </button>

  <button
    @click="togglePaymentStatus(order)"
    class="bg-orange-500 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold transition">
    ยืนยันการชำระเงิน
  </button>
</div>
  </li>
</ul>
      <p class="text-xl font-bold text-orange-600 mt-4 text-right">
        ยอดรวม {{ order.total_price }} บาท
      </p>
    </div>
  </li>
</ul>
</div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)


const openLineManager = () => {
  window.open("https://manager.line.biz/", "_blank");
};

const selectedDeliveryStatus = ref('')
const deliveryETA = ref('')

const selectedPromoUser = ref('all')
const promoTitle = ref('')
const promoDescription = ref('')
const promoLink = ref('')
const promoImageUrl = ref('')
const promotionStatus = ref('')

const summaryLabels = ref([])
const summaryValues = ref([])
const totalRevenue = ref(0)
const startDateSummary = ref('')
const endDateSummary = ref('')

const selectedUserId = ref('')
const userList = ref([])
const chartLabels = ref([])
const chartValues = ref([])
const chartDates = ref([])
const startDate = ref('')
const endDate = ref('')
const currentTab = ref('products');
const products = ref([]);
const orders = ref([]);
const newProduct = ref({ product_name: "", price: "", quantity: "", image_url: "" });

const chartData = computed(() => ({
  labels: chartLabels.value,
  datasets: [
    {
      label: 'จำนวนที่ซื้อ (กก.)',
      data: chartValues.value,
      backgroundColor: '#fb923c',
      borderRadius: 5,
    },
  ],
}))

const summaryData = computed(() => ({
  labels: summaryLabels.value,
  datasets: [
    {
      label: 'รายได้ (บาท)',
      data: summaryValues.value,
      backgroundColor: '#fb923c',
      borderRadius: 5,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'สรุปการสั่งซื้อสินค้า',
    },
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}

const summaryOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'รายได้รวมรายวัน',
    },
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}

const filteredOrders = computed(() => {
  if (!selectedUserId.value || selectedUserId.value === 'all') return orders.value;
  return orders.value.filter(order => order.user_id === selectedUserId.value);
});

const sendPromotion = async () => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/send-promotion`, {
      targetUserId: selectedPromoUser.value,
      productName: promoTitle.value,
      description: promoDescription.value,
      link: promoLink.value,
      imageUrl: promoImageUrl.value
    })
    promotionStatus.value = res.data.message || 'ส่งโปรโมชันสำเร็จ'
  } catch (err) {
    console.error('❌ ส่งโปรโมชันล้มเหลว:', err)
    promotionStatus.value = '❌ ส่งโปรโมชันไม่สำเร็จ'
  }
}

const fetchUserList = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`);
    userList.value = res.data
  } catch (error) {
    console.error('Error fetching user list:', error)
  }
}

const loadAnalyticsChartByUser = async () => {
  if (!selectedUserId.value || !startDate.value || !endDate.value) return
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/statistics/${selectedUserId.value}`, {
      params: {
        start: startDate.value,
        end: endDate.value,
      },
    })
    chartLabels.value = res.data.labels
    chartValues.value = res.data.data
    chartDates.value = res.data.dates || []
  } catch (error) {
    console.error('Error loading analytics chart by user:', error)
  }
}

const loadTotalSummary = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/statistics/revenue`, {
      params: {
        start: startDateSummary.value,
        end: endDateSummary.value,
      },
    })
    summaryLabels.value = res.data.labels
    summaryValues.value = res.data.values
    totalRevenue.value = res.data.totalRevenue || 0
  } catch (error) {
    console.error('Error loading total summary:', error)
  }
}


const updateDeliveryStatus = async (order) => {
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/orders/${order.order_id}/delivery`, {
      delivery_status: selectedDeliveryStatus.value,
      delivery_eta: deliveryETA.value,
      line_user_id: order.line_user_id,
      user_id: order.user_id,
      customer_name: order.customer_name
    });

    console.log(" Delivery updated:", response.data);
    alert(" อัปเดตสถานะการจัดส่งเรียบร้อยแล้ว!");
  } catch (error) {
    console.error("Error updating delivery status:", error);
    alert(" อัปเดตสถานะการจัดส่งล้มเหลว");
  }
};

const loadOrders = async () => {
  try {
    const response = await axios.get(import.meta.env.VITE_API_URL + "/orders");
    orders.value = response.data.map(order => ({
      ...order,
      showDetails: false,
  payment_status: order.payment_status || "ยังไม่จ่าย",
  user_id: order.user_id,
  customer_name: order.customer_name,
  delivery_status: order.delivery_status || "ยังไม่จัดส่ง",
  delivery_eta: order.delivery_eta || ""
}));

  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

const togglePaymentStatus = async (order) => {
  if (!order.order_id) {
    console.error("Error: order_id ไม่ถูกต้อง", order);
    return;
  }

  try {
    if (order.payment_status !== "จ่ายแล้ว") {
      console.log(`📌 เพิ่มข้อมูลการชำระเงิน: Order ID ${order.order_id}`);

      await axios.post(`${import.meta.env.VITE_API_URL}/payments`, {
        order_id: order.order_id,
        payment_status: "จ่ายแล้ว",
        payment_method: "เก็บเงินปลายทาง", // ✅ กำหนดแบบตายตัว
        amount: order.total_price,
        payment_date: new Date().toISOString().slice(0, 19).replace('T', ' ') // ใช้เวลาปัจจุบัน
      });

      alert("บันทึกข้อมูลการชำระเงินเรียบร้อยแล้ว");
    } else {
      alert("ออเดอร์นี้ชำระเงินแล้ว ไม่สามารถยกเลิกได้จากตรงนี้");
    }

    await loadOrders(); // รีโหลดข้อมูลใหม่
  } catch (error) {
    console.error("Error updating payment status:", error);
    alert("เกิดข้อผิดพลาดในการอัปเดตสถานะการชำระเงิน");
  }
};


const formatDate = (dateString) => {
  if (!dateString) return "ไม่ทราบวันที่"; // กรณีไม่มีข้อมูล
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('th-TH', options);
};

const fetchProducts = async () => {
  try {
    const response = await axios.get(import.meta.env.VITE_API_URL + "/products");
    products.value = response.data.map(product => ({ ...product, editing: false }));
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

const addProduct = async () => {
  try {
    await axios.post(import.meta.env.VITE_API_URL + "/products", newProduct.value);
    fetchProducts();
    newProduct.value = { product_name: "", price: "", quantity: "", image_url: "" };
  } catch (error) {
    console.error("Error adding product:", error);
  }
};

const updateProduct = async (product) => {
  try {
    await axios.put(`${import.meta.env.VITE_API_URL}/products/${product.product_id}`, product);
    product.editing = false;
  } catch (error) {
    console.error("Error updating product:", error);
  }
};

const deleteProduct = async (id) => {
  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);
    fetchProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
  }
};

onMounted(() => {
  const today = new Date().toISOString().split('T')[0]
  startDateSummary.value = today
  endDateSummary.value = today
  loadTotalSummary();
  fetchProducts();
  loadOrders();
  fetchUserList();
  setTimeout(() => {
    console.log("✅ Orders:", orders.value);
  }, 1000);
})

watch([startDateSummary, endDateSummary], ([start, end]) => {
  if (start && end) {
    loadTotalSummary()
  }
})
</script>
