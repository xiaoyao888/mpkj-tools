<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  categories: Array,
  modelValue: String
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'category-change', 'character-select'])

const characterData = {
  hot: ['▲', '▼', '◀', '►', '▵', '▽', '◁', '▷', '◣', '◥', '◢', '◤', '☝', '☟', '☜', '☞', '↖', '↗', '↘', '↙', '➤', '➜', '➔', '➙', '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿', '➀', '➁', '➂', '➃', '➄', '➅', '➆', '➇', '➈', '➉', '✓', '✗', '★', '☆', '◆', '◇', '●', '○', '■', '□', '△', '▽', '▼', '▲'],
  special: ['█', '▉', '▊', '▋', '▌', '▍', '▎', '▏', '■', '□', '▢', '▣', '▤', '▥', '▦', '▧', '▨', '▩', '▪', '▫', '▬', '▭', '▮', '▯', '▰', '▱', '▲', '△', '▼', '▽', '▴', '▵', '▾', '▿', '◀', '◁', '▶', '▷', '◐', '◑', '◒', '◓', '◔', '◕', '◖', '◗', '◘', '◙', '◚', '◛', '◜', '◝', '◞', '◟', '◠', '◡', '◢', '◣', '◤', '◥'],
  math: ['+', '−', '×', '÷', '=', '±', '∓', '≈', '≡', '≠', '≤', '≥', '∈', '∉', '∪', '∩', '⊂', '⊃', '⊄', '⊅', '∀', '∃', '¬', '∧', '∨', '→', '←', '↔', '↑', '↓', '↕', '↖', '↗', '↘', '↙', '∞', '∫', '∑', '∏', '√', '∛', '∜', '∝', '∞', '∟', '∠', '∡', '∢', '∣', '∥', '⊥', '∥', '∦', '∧', '∨', '¬', '∃', '∀', '∄'],
  pinyin: ['ā', 'á', 'ǎ', 'à', 'ō', 'ó', 'ǒ', 'ò', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ū', 'ú', 'ǔ', 'ù', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ń', 'ň', 'ǹ', 'ɑ', 'ɡ', 'ü', 'ê', 'ǎ', 'ǒ', 'ě', 'ǐ', 'ǔ'],
  foreign: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'],
  other: ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳', '⑴', '⑵', '⑶', '⑷', '⑸', '⑹', '⑺', '⑻', '⑼', '⑽', '⑾', '⑿', '⒀', '⒁', '⒂', '⒃', '⒄', '⒅', '⒆', '⒇', 'ⓐ', 'ⓑ', 'ⓒ', 'ⓓ', 'ⓔ', 'ⓕ', 'ⓖ', 'ⓗ', 'ⓘ', 'ⓙ', 'ⓚ', 'ⓛ', 'ⓜ', 'ⓝ', 'ⓞ', 'ⓟ', 'ⓠ', 'ⓡ', 'ⓢ', 'ⓣ', 'ⓤ', 'ⓥ', 'ⓦ', 'ⓧ', 'ⓨ', 'ⓩ']
}

const selectedCharacter = ref('')

const filteredCharacters = computed(() => {
  return characterData[props.modelValue] || []
})

const handleTabChange = (tab) => {
  emit('update:modelValue', tab.paneName)
  emit('category-change', tab.paneName)
}

const handleCharacterSelect = (character) => {
  selectedCharacter.value = character
  navigator.clipboard.writeText(character).then(() => {
    console.log('字符已复制到剪贴板:', character)
  })
  // 通知父组件选中了哪个字符
  emit('character-select', character)
}
</script>

<template>
  <div class="character-selector">
    <el-tabs :model-value="modelValue" @tab-change="handleTabChange" type="card">
      <el-tab-pane 
        v-for="category in categories" 
        :key="category.id" 
        :label="category.name" 
        :name="category.id"
      >
        <div class="character-grid">
          <el-button 
            v-for="(character, index) in filteredCharacters" 
            :key="index" 
            type="default" 
            size="large"
            @click="handleCharacterSelect(character)"
            :class="{ 'selected': selectedCharacter === character }"
          >
            {{ character }}
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <div v-if="selectedCharacter" class="selection-info">
      <el-alert 
        title="已选择字符：{{ selectedCharacter }}" 
        type="success" 
        :closable="false"
        show-icon
      >
        <template #desc>
          字符已复制到剪贴板
        </template>
      </el-alert>
    </div>
  </div>
</template>

<style scoped>
.character-selector {
  width: 100%;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  padding: 16px 0;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.character-grid .el-button {
  height: 36px;
  font-size: 18px;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  padding: 0;
}

.character-grid .el-button:hover {
  border-color: #409eff;
  color: #409eff;
  transform: none;
  box-shadow: none;
}

.character-grid .el-button.selected {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.selection-info {
  margin-top: 16px;
}

/* 优化标签页样式 */
:deep(.el-tabs__nav-wrap) {
  padding-bottom: 12px;
}

:deep(.el-tabs__nav) {
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-tabs__item) {
  padding: 0 16px;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
}

:deep(.el-tabs__active-bar) {
  background-color: #409eff;
}
</style>