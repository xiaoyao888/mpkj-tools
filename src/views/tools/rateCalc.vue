<template>
  <div class="calculator-container">
    <h2 class="title">小微企业税负计算器</h2>

    <div class="input-group">
      <label>销售额（元）:</label>
      <input type="number" v-model.number="sales" step="1" placeholder="请输入销售额">
    </div>

    <div class="input-group">
      <label>进货成本（元）:</label>
      <input type="number" v-model.number="cost" step="1" placeholder="请输入成本">
    </div>

    <div class="input-group">
      <label>增值税率:</label>
      <select v-model="vatRate">
        <option value="0.03">3%</option>
        <option value="0.01">1%</option>
      </select>
    </div>

    <div class="results">
      <h3>计算结果</h3>
      <div>增值税: {{ vat.toFixed(2) }} 元</div>
      <div>附加税: {{ surcharge.toFixed(2) }} 元</div>
      <div>印花税: {{ stampTax.toFixed(3) }} 元</div>
      <div>企业所得税: {{ incomeTax.toFixed(2) }} 元</div>
      <div class="total">总税负: {{ totalTax.toFixed(2) }} 元</div>
      <div class="rate">综合税负率: {{ isNaN(taxRate.toFixed(2))? '0.00' : taxRate.toFixed(2) }}%</div>
    </div>
  </div>
</template>

<script setup>
import {ref,computed} from "vue";

const sales = ref(null);  // 默认销售额
const cost = ref(null);    // 默认进货成本
const vatRate = ref(0.03);  // 默认增值税率

// 增值税计算
const vat = computed(() => sales.value * vatRate.value);

// 附加税计算（增值税的12%减半）
const surcharge = computed(() => vat.value * 0.12 * 0.5);

// 印花税计算（0.03%减半）
const stampTax = computed(() => sales.value * 0.0003 * 0.5);

// 应纳税所得额
const taxableIncome = computed(() => {
  return sales.value - cost.value - surcharge.value - stampTax.value;
});

// 企业所得税（小微企业5%）
const incomeTax = computed(() => {
  return taxableIncome.value > 0
      ? taxableIncome.value * 0.05
      : 0;
});

// 总税负
const totalTax = computed(() => {
  return vat.value + surcharge.value + stampTax.value + incomeTax.value;
});

// 综合税负率
const taxRate = computed(() => {
  return (totalTax.value / sales.value) * 100;
});
</script>

<style scoped>
.calculator-container {
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  color: #34495e;
}

.input-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

input, select {
  padding: 8px;
  width: 150px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.results {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #fff;
}

.total, .rate {
  font-weight: bold;
  margin-top: 10px;
  color: #2c3e50;
}

h3 {
  color: #34495e;
  text-align: center;
}
</style>
