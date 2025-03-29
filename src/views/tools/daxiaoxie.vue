<template>
  <div class="container container-custom" style="margin-top:20px;">
    <h1 style="font-size:18px;text-align:center;">英文字母大小写转换</h1>
    <form class="tool-form">
      <div class="form-field">
        <a-textarea :cols="90" :rows="10" maxlength="5000" class="form-textarea form-block"
                 v-model:value="content"
                  placeholder="请把你需要转换的内容粘贴在这里" style="width:100%;"></a-textarea>
        <div class="word-count"><span id="total">{{ content.length }}</span> / 5000</div>
      </div>
      <div class="form-btn">
        <a-button class="btn btn-primary" @click="letterConvert('upper_case')">全大写</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('lower_case')">全小写</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('capitalize_words')">单词首字母大写</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('capitalize_sentence')">句首字母大写</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('title_case')">标题大小写</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('blank2unline')">空格→下划线</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('blank2camel')">下划线&amp;空格→驼峰</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('camel2unline')">驼峰→下划线</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('unline2midline')">下划线→中横线</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('midline2unline')">中横线→下划线</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('unline2blank')">下划线→空格</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('unline2dot')">下划线→小数点</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('dot2unline')">小数点→下划线</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('del_blank')">清除空格</a-button>
        <a-button class="btn btn-primary" @click="letterConvert('del_punctuation')">清除符号</a-button>
        <input class="btn btn-warning btn-copy" type="button" value="复制" data-clipboard-target="#tool-res">
        <input class="btn btn-info btn-cut" type="button" value="剪切" data-clipboard-action="cut"
               data-clipboard-target="#tool-res">
        <input class="btn btn-error" type="reset" value="清空">
      </div>
      <div id="tool-tips"></div>
      <p class="tips"> 提示：首字母转大写仅在英文单词前有空格的情况下才有效；每句首字母大写仅在符号“.!?:”后的第一个单词有效；
      </p>
    </form>

    <div class="tool-info">
      <h5>相关知识</h5>
      <p>英文字母，即英文<code>English</code>所基于的字母，共26个。<br>英文字母渊源于拉丁字母，拉丁字母渊源于希腊字母，而希腊字母则是由腓尼基字母演变而来的。</p>

      <h5>英文标题大小写格式</h5>
      <p><code>Title case</code> 或 <code>Headline case</code> 是一种大写风格，用于以英文呈现已出版作品或艺术作品的标题。
        标题大写格式：所有单词都要是首字母大写，除了不是标题第一个或最后一个单词的次要单词（通常是冠词、短介词和一些连词），本工具次要单词包含 <code>a, an, the, and, but, or,
          for,
          nor, on, at, to, from, by, in, out, of, up, over, with, as</code>。</p>

      <h5>程序上的字母大小写转换</h5>
      <p>骆驼式命名法 <code>Camel Case</code> 是指混合使用大小写字母来构成变量和函数的名字，为了代码能更容易阅读，而采取统一的可读性比较好的命名方式。</p>
      <p>
        PHP：<code>strtolower()</code> 字符串转换为小写，<code>strtoupper()</code> 字符串转换为大写；<code>ucfirst()</code>
        将第一个字符转换为大写，<code>ucwords()</code> 将每个单词的首字母转换为大写。<br>
        JavaScript：<code>toLowerCase()</code>返回一个字符串，其中所有的字母字符都被转换为小写；<code>toUpperCase()</code>返回一个字符串，其中所有的字母字符都被转换为大写。<br>
        Python：<code>capitalize()</code>将字符串的第一个字母变成大写,其他字母变小写；<code>upper()</code>
        方法将字符串中的小写字母转为大写字母；<code>lower()</code>
        方法转换字符串中所有大写字符为小写；<code>title() </code>方法返回"标题化"的字符串,就是说所有单词都是以大写开始，其余字母均为小写。
      </p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';

const content = ref('');

const letterConvert = (type) => {
  switch (type) {
    case 'upper_case':
      content.value = content.value.toUpperCase();
      break;
    case 'lower_case':
      content.value = content.value.toLowerCase();
      break;
    case 'capitalize_words':
      content.value = content.value.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      break;
    case 'capitalize_sentence':
      content.value = content.value.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, s => s.toUpperCase());
      break;
    case 'title_case':
      content.value = content.value.toLowerCase().replace(/\b(?!\b(a|an|the|and|but|or|for|nor|on|at|to|from|by|in|out|of|up|over|with|as)\b)\w/g, s => s.toUpperCase());
      break;
    case 'blank2unline':
      content.value = content.value.replace(/\s+/g, '_');
      break;
    case 'blank2camel':
      content.value = content.value.replace(/(\b\w)/g, (match, p1) => p1.toUpperCase()).replace(/\s+/g, '');
      break;
    case 'camel2unline':
      content.value = content.value.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      break;
    case 'unline2midline':
      content.value = content.value.replace(/_/g, '-');
      break;
    case 'midline2unline':
      content.value = content.value.replace(/-/g, '_');
      break;
    case 'unline2blank':
      content.value = content.value.replace(/_/g, ' ');
      break;
    case 'unline2dot':
      content.value = content.value.replace(/_/g, '.');
      break;
    case 'dot2unline':
      content.value = content.value.replace(/\./g, '_');
      break;
    case 'del_blank':
      content.value = content.value.replace(/\s+/g, '');
      break;
    case 'del_punctuation':
      content.value = content.value.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      break;
    default:
      break;
  }
};
</script>
<style scoped>
/* 您的样式可以在此处定义 */
</style>