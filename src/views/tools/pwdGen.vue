<template>
  <div class="calculator-container">
    <h2 class="title">密码生成器</h2>
    <a-form :model="formState" layout="vertical">
      <a-form-item label="密码长度">
        <a-input-number v-model:value="formState.length" :min="4" :max="32" />
      </a-form-item>
      <a-form-item label="包含字符类型">
        <a-checkbox-group v-model:value="formState.types">
          <a-row>
            <a-col :span="12">
              <a-checkbox value="uppercase">大写字母</a-checkbox>
            </a-col>
            <a-col :span="12">
              <a-checkbox value="lowercase">小写字母</a-checkbox>
            </a-col>
            <a-col :span="12">
              <a-checkbox value="numbers">数字</a-checkbox>
            </a-col>
            <a-col :span="12">
              <a-checkbox value="symbols">符号</a-checkbox>
            </a-col>
          </a-row>
        </a-checkbox-group>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="generatePassword">生成密码</a-button>
      </a-form-item>
      <a-form-item label="生成的密码">
        <a-input
            v-model:value="generatedPassword"
            readonly
            @click="copyToClipboard"
        >
          <template #suffix>
            <a-tooltip title="点击复制">
              <a-icon type="copy" />
            </a-tooltip>
          </template>
        </a-input>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

const formState = reactive({
  length: 12,
  types: ['uppercase', 'lowercase', 'numbers'],
});

const generatedPassword = ref('');

const generatePassword = () => {
  let password = '';
  let characters = '';
  if (formState.types.includes('uppercase')) {
    characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  if (formState.types.includes('lowercase')) {
    characters += 'abcdefghijklmnopqrstuvwxyz';
  }
  if (formState.types.includes('numbers')) {
    characters += '0123456789';
  }
  if (formState.types.includes('symbols')) {
    characters += '!@#$%^&*()_+[]{}|;:,.<>?';
  }
  for (let i = 0; i < formState.length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  generatedPassword.value = password;
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(generatedPassword.value);
  message.success('密码已复制到剪贴板');
};
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
.ant-form-item {
  margin-bottom: 16px;
}
.ant-input-number {
  width: 100%;
}
.ant-checkbox-group {
  width: 100%;
}
.ant-row {
  display: flex;
  justify-content: space-between;
}
.ant-col {
  flex: 1;
  margin-right: 16px;
}
.ant-col:last-child {
  margin-right: 0;
}
.ant-input[readonly] {
  cursor: pointer;
}
</style>
