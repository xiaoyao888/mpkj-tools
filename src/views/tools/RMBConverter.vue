<template>
  <div class="container">
    <h2 class="title">人民币大写在线转换工具</h2>
    <a-input
        type="number"
        v-model:value.number="amount"
        placeholder="输入小写数字金额"
        @input="convertToChinese"
    ></a-input>
    <a-button type="primary" @click="convertToChinese">转换为大写金额</a-button>
    <p>大写金额: {{ chineseAmount }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
const amount = ref('')

const convertToChinese = () => {
  const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const cnIntRadice = ['', '拾', '佰', '仟'];
  const cnIntUnits = ['', '万', '亿', '兆'];
  const cnDecUnits = ['角', '分'];
  const cnInteger = '整';
  const cnNegative = '负';
  let integerNum;
  let decimalNum;
  let chineseStr = '';
  let parts;
  let num = amount.value;
  if (num === '') {
    return '';
  }
  num = parseFloat(num);
  if (num < 0) {
    chineseStr = cnNegative;
    num = -num;
  }
  num = num.toString();
  if (num.indexOf('.') === -1) {
    integerNum = num;
    decimalNum = '';
  } else {
    parts = num.split('.');
    integerNum = parts[0];
    decimalNum = parts[1].substr(0, 2);
  }
  if (parseInt(integerNum, 10) > 0) {
    let zeroCount = 0;
    const IntLen = integerNum.length;
    for (let i = 0; i < IntLen; i++) {
      const n = integerNum.substr(i, 1);
      const p = IntLen - i - 1;
      const q = p / 4;
      const m = p % 4;
      if (n === '0') {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          chineseStr += cnNums[0];
        }
        zeroCount = 0;
        chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
      }
      if (m === 0 && zeroCount < 4) {
        chineseStr += cnIntUnits[q];
      }
    }
    chineseStr = chineseStr.replace(/零(千|百|拾|角)/g, '零');
    chineseStr = chineseStr.replace(/(零)+/g, '零');
    chineseStr = chineseStr.replace(/零(万|亿|兆)/g, '$1');
    chineseStr = chineseStr.replace(/零+元/g, '元');
    chineseStr = chineseStr.replace(/亿零{0,3}万/g, '亿');
    chineseStr = chineseStr.replace(/^元/g, '');
  }
  if (decimalNum !== '') {
    const decLen = decimalNum.length;
    for (let i = 0; i < decLen; i++) {
      const n = decimalNum.substr(i, 1);
      if (n !== '0') {
        chineseStr += cnNums[Number(n)] + cnDecUnits[i];
      }
    }
  }
  if (chineseStr === '') {
    chineseStr = cnNums[0] + '元' + cnInteger;
  } else if (decimalNum === '') {
    chineseStr += '元' + cnInteger;
  } else if (integerNum === '0' && decimalNum !== '') {
    chineseStr = chineseStr.replace(/^零/g, '');
  } else {
    chineseStr = chineseStr.replace(/元$/g, '元');
  }
  return chineseStr;
};

const chineseAmount = computed(() => {
  return convertToChinese(amount.value);
});

</script>

<style scoped>
.converter {
  font-family: Arial, sans-serif;
  width: 300px;
  margin: auto;
  text-align: center;
}

input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
  box-sizing: border-box;
}

p {
  margin-top: 10px;
  font-size: 18px;
}
</style>