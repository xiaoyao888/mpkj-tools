<template>
  <div class="qrcode-page">
    <h1 class="qrcode-title">在线二维码图片生成器</h1>

    <div class="qrcode-body">
      <!-- 左侧：输入区 -->
      <div class="qrcode-left">
        <div class="tabs">
          <a
            v-for="tab in tabs"
            :key="tab.key"
            href="javascript:"
            :class="['tab-elem', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <span>{{ tab.name }}</span>
          </a>
        </div>

        <div class="qrcode-forms">
        <!-- 文本 -->
        <div v-show="activeTab === 'text'" class="sub">
          <div class="tit"><span>即时输入即时生成!</span>输入文本</div>
          <textarea
            v-model="textContent"
            class="text"
            placeholder="支持文本、网址和电子邮箱"
            maxlength="300"
            @input="onTextInput"
          ></textarea>
          <div class="size">已输入字数：<span>{{ textLength }}</span>/300</div>
        </div>

        <!-- 名片 -->
        <div v-show="activeTab === 'card'" class="sub">
          <div class="tit"><span>即时输入即时生成!</span>输入联系人信息</div>
          <form>
            <div class="form-group">
              <label>姓名</label>
              <input v-model="card.name" type="text" maxlength="50" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>电话</label>
              <input v-model="card.tel" type="text" maxlength="30" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>手机</label>
              <input v-model="card.phone" type="text" maxlength="30" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>QQ</label>
              <input v-model="card.qq" type="text" maxlength="30" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>电子邮箱</label>
              <input v-model="card.mail" type="text" maxlength="80" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>单位</label>
              <input v-model="card.org" type="text" maxlength="100" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>职位</label>
              <input v-model="card.til" type="text" maxlength="30" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>网址</label>
              <input v-model="card.url" type="text" maxlength="255" placeholder="http://" @input="onCardInput" />
            </div>
            <div class="form-group">
              <label>地址</label>
              <input v-model="card.adr" type="text" maxlength="255" @input="onCardInput" />
            </div>
          </form>
        </div>

        <!-- 网址 -->
        <div v-show="activeTab === 'url'" class="sub">
          <div class="tit"><span>即时输入即时生成!</span>输入URL网址</div>
          <input v-model="urlContent" type="text" maxlength="255" placeholder="http://" @input="onUrlInput" />
          <div class="size">输入网址</div>
        </div>

        <!-- 短信 -->
        <div v-show="activeTab === 'sms'" class="sub">
          <div class="tit"><span>即时输入即时生成!</span>输入短信内容</div>
          <textarea v-model="sms.content" class="sms_text" maxlength="300" @input="onSmsInput"></textarea>
          <div class="size">已输入字数：<span>{{ smsLength }}</span>/300</div>
          <form class="form-inline">
            <div class="form-group">
              <label>手机号码</label>
              <input v-model="sms.tel" type="text" maxlength="30" @input="onSmsInput" />
            </div>
          </form>
        </div>

        <!-- WiFi -->
        <div v-show="activeTab === 'wifi'" class="sub">
          <div class="tit"><span>即时输入即时生成!</span>输入WiFi帐号信息</div>
          <form>
            <div class="form-group">
              <label>网络账号</label>
              <input v-model="wifi.ssid" type="text" maxlength="30" @input="onWifiInput" />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input v-model="wifi.password" type="text" maxlength="50" :disabled="wifi.encryption === 'nopass'" @input="onWifiInput" />
            </div>
            <div class="form-group">
              <label>加密类型</label>
              <select v-model="wifi.encryption" class="form-control" @change="onWifiInput">
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">无加密</option>
              </select>
            </div>
          </form>
        </div>

        <!-- 电话 -->
        <div v-show="activeTab === 'telephone'" class="sub">
          <div class="tit"><span>即时输入即时生成!</span>输入电话号码</div>
          <form class="form-inline">
            <div class="form-group">
              <label>手机号码</label>
              <input v-model="telContent" type="text" maxlength="30" @input="onTelInput" />
            </div>
          </form>
        </div>

        <!-- 邮箱 -->
        <div v-show="activeTab === 'mail'" class="sub">
          <div class="tit"><span>即时输入即时生成!</span>输入电邮地址</div>
          <form class="form-inline">
            <div class="form-group">
              <label>电子邮箱</label>
              <input v-model="mailContent" type="text" maxlength="80" @input="onMailInput" />
            </div>
          </form>
        </div>

        <div class="prompt">建议内容不超过150个汉字，如果二维码不显示请清除设置。</div>
        </div>
      </div>

      <!-- 右侧：预览和设置 -->
      <div class="qrcode-right">
        <div class="canvas-wrap">
          <canvas ref="canvasRef" width="300" height="300" class="canvas"></canvas>
        </div>

        <div class="diy_div">
          <div class="diy_scroll">
            <input
              v-model.number="dotShape"
              type="range"
              min="0"
              max="50"
              step="1"
              class="dot-slider"
              @input="onSliderInput"
            />
          </div>
          <div class="diy_statue">
            <a href="javascript:" :class="{ on: liquidMode }" @click="setLiquid">液态</a>
            <a href="javascript:" :class="{ on: !liquidMode && dotShape === 0 }" @click="setDotShape(0)">直角</a>
            <a href="javascript:" :class="{ on: !liquidMode && dotShape === 25 }" @click="setDotShape(25)">圆角</a>
          </div>
        </div>

        <div class="fnrow">
          <div class="tabset">
            <a
              v-for="setting in settings"
              :key="setting.key"
              href="javascript:"
              :class="['tabelem', { active: activeSetting === setting.key }]"
              @click="activeSetting = setting.key"
            >
              {{ setting.name }}
            </a>
          </div>

          <!-- 颜色设置 -->
          <div v-show="activeSetting === 'color'" class="fnsubv">
            <ul class="colors">
              <li>
                <label>前景色</label>
                <input v-model="colors.fg" type="color" @input="drawQRCode" />
              </li>
              <li>
                <label>渐变颜色</label>
                <input v-model="colors.gc" type="color" @input="drawQRCode" />
                <a href="javascript:" class="close" @click="colors.gc = '#000000'; drawQRCode()">×</a>
              </li>
              <li>
                <label>定位点(外框)</label>
                <input v-model="colors.pt" type="color" @input="drawQRCode" />
                <a href="javascript:" class="close" @click="colors.pt = '#000000'; drawQRCode()">×</a>
              </li>
              <li>
                <label>背景色</label>
                <input v-model="colors.bg" type="color" @input="drawQRCode" />
              </li>
              <li>
                <label>渐变方式</label>
                <select v-model="colors.gradientWay" @change="drawQRCode">
                  <option value="0">无</option>
                  <option value="circular">圆形</option>
                  <option value="backslash">反斜线</option>
                  <option value="slash">斜线</option>
                  <option value="horizontal">水平</option>
                  <option value="vertical">垂直</option>
                </select>
              </li>
              <li>
                <label>定位点(内点)</label>
                <input v-model="colors.inpt" type="color" @input="drawQRCode" />
                <a href="javascript:" class="close" @click="colors.inpt = '#000000'; drawQRCode()">×</a>
              </li>
            </ul>
          </div>

          <!-- 嵌入Logo -->
          <div v-show="activeSetting === 'logo'" class="fnsubv">
            <div class="logotypes">
              <label><input v-model="logo.type" type="radio" value="icon" @change="drawQRCode" />圆角</label>
              <label><input v-model="logo.type" type="radio" value="border" @change="drawQRCode" />白底</label>
              <label><input v-model="logo.type" type="radio" value="stroke" @change="drawQRCode" />描边</label>
              <label><input v-model="logo.type" type="radio" value="default" checked @change="drawQRCode" />原图</label>
            </div>
            <div class="pic">
              <input ref="logoInput" type="file" accept="image/*" style="display: none" @change="onLogoChange" />
              <a-button type="primary" @click="logoInput?.click()">选择图片</a-button>
              <div v-if="logo.dataUrl" class="picelem">
                <span>{{ logo.name }}</span>
                <a href="javascript:" class="del" title="删除" @click="clearLogo">×</a>
              </div>
            </div>
            <div class="format">（支持jpg、gif、png、bmp格式图片，不超过20M）</div>
          </div>

          <!-- 嵌入文字 -->
          <div v-show="activeSetting === 'text'" class="fnsubv">
            <div class="content">
              <input v-model="textEmbed.content" type="text" placeholder="输入文本" class="ctext" @input="drawQRCode" />
              <a href="javascript:" class="del" title="删除" @click="clearTextEmbed">×</a>
            </div>
            <ul class="fontset">
              <li>
                <label>效果</label>
                <select v-model="textEmbed.effect" @change="drawQRCode">
                  <option value="default">描边</option>
                  <option value="in">内融合</option>
                  <option value="out">外融合</option>
                  <option value="stretch">拉伸</option>
                  <option value="3d">3D效果</option>
                  <option value="light">发光</option>
                </select>
              </li>
              <li>
                <label>字号</label>
                <select v-model="textEmbed.fontsize" @change="drawQRCode">
                  <option value="24">24</option>
                  <option value="26">26</option>
                  <option value="28" selected>28</option>
                  <option value="30">30</option>
                  <option value="32">32</option>
                  <option value="34">34</option>
                  <option value="36">36</option>
                  <option value="38">38</option>
                </select>
              </li>
              <li>
                <label>文字颜色</label>
                <input v-model="textEmbed.color" type="color" @input="drawQRCode" />
              </li>
            </ul>
          </div>

          <!-- 其它设置 -->
          <div v-show="activeSetting === 'other'" class="fnsubv">
            <ul class="baseset">
              <li>
                <label>外边距</label>
                <select v-model="other.margin" @change="drawQRCode">
                  <option value="0">0px</option>
                  <option value="5">5px</option>
                  <option value="10" selected>10px</option>
                  <option value="15">15px</option>
                  <option value="20">20px</option>
                  <option value="25">25px</option>
                  <option value="30">30px</option>
                  <option value="35">35px</option>
                  <option value="40">40px</option>
                  <option value="45">45px</option>
                  <option value="50">50px</option>
                </select>
              </li>
              <li>
                <label>纠错等级</label>
                <select v-model="other.level" @change="drawQRCode">
                  <option value="L">最低</option>
                  <option value="M">低</option>
                  <option value="Q">中等</option>
                  <option value="H">高</option>
                </select>
              </li>
              <li>
                <label>旋转角度</label>
                <select v-model="other.rotate" @change="drawQRCode">
                  <option value="0" selected>0°</option>
                  <option value="1">90°</option>
                  <option value="2">180°</option>
                  <option value="3">270°</option>
                </select>
              </li>
              <li>
                <label>图片大小</label>
                <select v-model="other.size" @change="drawQRCode">
                  <option value="200">200px</option>
                  <option value="300" selected>300px</option>
                  <option value="500">500px</option>
                  <option value="600">600px</option>
                  <option value="800">800px</option>
                  <option value="1000">1000px</option>
                  <option value="1500">1500px</option>
                  <option value="2000">2000px</option>
                </select>
              </li>
            </ul>
          </div>

          <!-- 图案样式（定位点） -->
          <div v-show="activeSetting === 'pattern'" class="fnsubv">
            <div class="pattern-grid">
              <a
                v-for="p in patternStyles"
                :key="p.key"
                href="javascript:"
                :class="['pattern-item', { on: patternStyle === p.key }]"
                :title="p.name"
                @click="selectPattern(p.key)"
              >
                <canvas :ref="(el) => setPatternCanvas(el, p.key)" width="46" height="46"></canvas>
              </a>
            </div>
            <div class="format">点击图案即可更换二维码三个角的定位点样式</div>
          </div>
        </div>

        <div class="other">
          <a-button type="primary" class="btn" @click="resetAll">清除设置</a-button>
          <a-button @click="downloadImage">下载图片</a-button>
          <a-button @click="copyImageLink">复制图片链接</a-button>
        </div>
      </div>
    </div>

    <div class="tool-info">
      <h5>工具说明</h5>
      <p>
        1.本工具所有运算均在本地客户端完成，不会上传任何用户数据。<br />
        2.支持文本、网址、名片、短信、WiFi、电话、邮箱等多种格式生成二维码。<br />
        3.可以自定义二维码颜色、样式、大小，并支持嵌入Logo和文字。<br />
        4.生成的二维码图片可以下载保存到本地。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import QRCode from 'qrcode-generator';

const canvasRef = ref(null);
const logoInput = ref(null);

// Tab配置
const tabs = [
  { key: 'text', name: '文本' },
  { key: 'card', name: '名片' },
  { key: 'url', name: '网址' },
  { key: 'sms', name: '短信' },
  { key: 'wifi', name: 'WiFi' },
  { key: 'telephone', name: '电话' },
  { key: 'mail', name: '邮箱' }
];
const activeTab = ref('text');

// 设置Tab配置
const settings = [
  { key: 'color', name: '颜色设置' },
  { key: 'logo', name: '嵌入Logo' },
  { key: 'text', name: '嵌入文字' },
  { key: 'other', name: '其它设置' },
  { key: 'pattern', name: '图案样式' }
];
const activeSetting = ref('color');

// 输入内容
const textContent = ref('');
const urlContent = ref('http://');
const telContent = ref('');
const mailContent = ref('');

const card = ref({
  name: '',
  tel: '',
  phone: '',
  qq: '',
  mail: '',
  org: '',
  til: '',
  url: 'http://',
  adr: ''
});

const sms = ref({
  content: '',
  tel: ''
});

const wifi = ref({
  ssid: '',
  password: '',
  encryption: 'WPA'
});

// 颜色设置
const colors = ref({
  fg: '#000000',
  gc: '#000000',
  pt: '#000000',
  bg: '#ffffff',
  gradientWay: 'backslash',
  inpt: '#000000'
});

// Logo设置
const logo = ref({
  type: 'default',
  dataUrl: '',
  name: ''
});

// 文字嵌入设置
const textEmbed = ref({
  content: '',
  effect: 'default',
  fontsize: 28,
  color: '#000000'
});

// 其它设置
const other = ref({
  margin: 10,
  level: 'M',
  rotate: 0,
  size: 300
});

// 定位点图案样式：ring=外框形状，dot=内点形状
const patternStyles = [
  { key: 'default', name: '标准', ring: 'square', dot: 'square' },
  { key: 'squareRounded', name: '方框圆角点', ring: 'square', dot: 'rounded' },
  { key: 'squareCircle', name: '方框圆点', ring: 'square', dot: 'circle' },
  { key: 'rounded', name: '圆角', ring: 'rounded', dot: 'rounded' },
  { key: 'roundedCircle', name: '圆角圆点', ring: 'rounded', dot: 'circle' },
  { key: 'circle', name: '圆形', ring: 'circle', dot: 'circle' },
  { key: 'circleSquare', name: '圆环方点', ring: 'circle', dot: 'square' },
  { key: 'leaf', name: '叶片', ring: 'leaf', dot: 'leaf' },
  { key: 'oneCorner', name: '单圆角', ring: 'oneCorner', dot: 'oneCorner' },
  { key: 'dotted', name: '点阵', ring: 'dotted', dot: 'dotted' }
];
const patternStyle = ref('default');
const patternCanvases = {};

const setPatternCanvas = (el, key) => {
  if (el) patternCanvases[key] = el;
};

const selectPattern = (key) => {
  patternStyle.value = key;
  drawQRCode();
};

// 点形状：圆角半径占单元格的百分比，0=直角，25=圆角；液态为独立模式（邻域融合）
const dotShape = ref(0);
const liquidMode = ref(false);
const setDotShape = (v) => {
  liquidMode.value = false;
  dotShape.value = v;
  drawQRCode();
};
const setLiquid = () => {
  liquidMode.value = true;
  dotShape.value = 50;
  drawQRCode();
};
const onSliderInput = () => {
  liquidMode.value = false;
  drawQRCode();
};

// 计算属性
const textLength = computed(() => textContent.value.length);
const smsLength = computed(() => sms.value.content.length);

// 获取当前输入的内容
const getContent = () => {
  switch (activeTab.value) {
    case 'text':
      return textContent.value;
    case 'card':
      return generateCardString();
    case 'url':
      return urlContent.value;
    case 'sms':
      return `SMSTO:${sms.value.tel}:${sms.value.content}`;
    case 'wifi':
      return generateWifiString();
    case 'telephone':
      return `TEL:${telContent.value}`;
    case 'mail':
      return `mailto:${mailContent.value}`;
    default:
      return '';
  }
};

// 生成名片字符串
const generateCardString = () => {
  const c = card.value;
  let str = 'BEGIN:VCARD\n';
  if (c.name) str += `FN:${c.name}\n`;
  if (c.tel) str += `TEL;TYPE=WORK:${c.tel}\n`;
  if (c.phone) str += `TEL;TYPE=CELL:${c.phone}\n`;
  if (c.qq) str += `X-QQ:${c.qq}\n`;
  if (c.mail) str += `EMAIL:${c.mail}\n`;
  if (c.org) str += `ORG:${c.org}\n`;
  if (c.til) str += `TITLE:${c.til}\n`;
  if (c.url && c.url !== 'http://') str += `URL:${c.url}\n`;
  if (c.adr) str += `ADR:${c.adr}\n`;
  str += 'END:VCARD';
  return str;
};

// 生成WiFi字符串
const generateWifiString = () => {
  const w = wifi.value;
  return `WIFI:T:${w.encryption};S:${w.ssid};P:${w.password};H:false;;`;
};

// 输入事件处理
const onTextInput = () => drawQRCode();
const onCardInput = () => drawQRCode();
const onUrlInput = () => drawQRCode();
const onSmsInput = () => drawQRCode();
const onWifiInput = () => drawQRCode();
const onTelInput = () => drawQRCode();
const onMailInput = () => drawQRCode();

// Logo文件选择
const onLogoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    message.error('图片大小不能超过20M');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    logo.value.dataUrl = event.target.result;
    logo.value.name = file.name;
    drawQRCode();
  };
  reader.readAsDataURL(file);
};

// 清除Logo
const clearLogo = () => {
  logo.value.dataUrl = '';
  logo.value.name = '';
  if (logoInput.value) logoInput.value.value = '';
  drawQRCode();
};

// 清除文字嵌入
const clearTextEmbed = () => {
  textEmbed.value.content = '';
  drawQRCode();
};

// 绘制二维码
const drawQRCode = async () => {
  await nextTick();
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = parseInt(other.value.size);
  const margin = parseInt(other.value.margin);

  canvas.width = size;
  canvas.height = size;

  const content = getContent();
  if (!content || content === 'http://') {
    // 绘制空白背景
    ctx.fillStyle = colors.value.bg;
    ctx.fillRect(0, 0, size, size);
    return;
  }

  try {
    // 创建二维码
    const qr = QRCode(0, other.value.level);
    qr.addData(content);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = Math.floor((size - margin * 2) / moduleCount);
    const offset = (size - cellSize * moduleCount) / 2;

    // 填充背景
    ctx.fillStyle = colors.value.bg;
    ctx.fillRect(0, 0, size, size);

    // 绘制二维码模块
    if (liquidMode.value) {
      // 液态：相邻点融合连通，孤立点为圆点；定位点由图案样式绘制
      drawLiquidModules(ctx, qr, offset, cellSize, moduleCount);
    } else {
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (!qr.isDark(row, col)) continue;
          // 定位点跳过，由图案样式统一绘制
          if (isFinderPattern(row, col, moduleCount)) continue;

          const x = offset + col * cellSize;
          const y = offset + row * cellSize;

          // 使用前景色或渐变色
          if (colors.value.gradientWay !== '0') {
            ctx.fillStyle = getGradientColor(col, row, moduleCount);
          } else {
            ctx.fillStyle = colors.value.fg;
          }

          // 按滑动值控制每个点的形状：0=直角，>0 为圆角
          if (dotShape.value === 0) {
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            const r = Math.min(cellSize / 2, (cellSize * dotShape.value) / 100);
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, y, cellSize, cellSize, r);
            } else {
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2, 0, Math.PI * 2);
            }
            ctx.fill();
          }
        }
      }
    }

    // 绘制三个角的定位点（液态模式下默认样式保持圆角外观）
    const styleKey = liquidMode.value && patternStyle.value === 'default' ? 'rounded' : patternStyle.value;
    drawFinderPattern(ctx, offset, cellSize, 0, 0, styleKey);
    drawFinderPattern(ctx, offset, cellSize, 0, moduleCount - 7, styleKey);
    drawFinderPattern(ctx, offset, cellSize, moduleCount - 7, 0, styleKey);

    // 嵌入Logo
    if (logo.value.dataUrl) {
      await drawLogo(ctx, size, offset, cellSize);
    }

    // 嵌入文字
    if (textEmbed.value.content) {
      drawText(ctx, size);
    }

  } catch (err) {
    console.error('QR Code generation error:', err);
    message.error('生成二维码失败：' + err.message);
  }
};

// 判断是否为定位点（左上、右上、左下）
const isFinderPattern = (row, col, count) => {
  return (row < 7 && col < 7) || // 左上
         (row < 7 && col >= count - 7) || // 右上
         (row >= count - 7 && col < 7); // 左下
};

// 圆角矩形路径（兼容旧浏览器）
const roundRectPath = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// 液态模式：数据点邻域融合绘制
// 每个黑点画中心圆，若某方向邻居也是黑点（且非定位点），则向该方向填矩形连通
const drawLiquidModules = (ctx, qr, offset, cellSize, count) => {
  const r = cellSize / 2;
  const dark = (row, col) => {
    if (row < 0 || col < 0 || row >= count || col >= count) return false;
    if (isFinderPattern(row, col, count)) return false; // 不与定位点连通
    return qr.isDark(row, col);
  };

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!dark(row, col)) continue;

      ctx.fillStyle = colors.value.gradientWay !== '0'
        ? getGradientColor(col, row, count)
        : colors.value.fg;

      const x = offset + col * cellSize;
      const y = offset + row * cellSize;
      const cx = x + r;
      const cy = y + r;

      // 中心圆
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // 向黑邻居方向连通
      if (dark(row - 1, col)) ctx.fillRect(x, y, cellSize, r);
      if (dark(row + 1, col)) ctx.fillRect(x, cy, cellSize, r);
      if (dark(row, col - 1)) ctx.fillRect(x, y, r, cellSize);
      if (dark(row, col + 1)) ctx.fillRect(cx, y, r, cellSize);
    }
  }
};

// 定位点形状路径：square 方形 / rounded 圆角 / circle 圆形 / leaf 叶片(对角圆角) / oneCorner 单圆角
const finderShapePath = (ctx, x, y, s, type) => {
  ctx.beginPath();
  if (type === 'circle') {
    ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2);
    return;
  }
  if (type === 'rounded') {
    roundRectPath(ctx, x, y, s, s, s * 0.22);
    return;
  }
  if (type === 'leaf') {
    const R = s * 0.5;
    ctx.moveTo(x, y);
    ctx.lineTo(x + s - R, y);
    ctx.arcTo(x + s, y, x + s, y + R, R);
    ctx.lineTo(x + s, y + s);
    ctx.lineTo(x + R, y + s);
    ctx.arcTo(x, y + s, x, y + s - R, R);
    ctx.lineTo(x, y);
    ctx.closePath();
    return;
  }
  if (type === 'oneCorner') {
    const R = s * 0.5;
    ctx.moveTo(x, y);
    ctx.lineTo(x + s - R, y);
    ctx.arcTo(x + s, y, x + s, y + R, R);
    ctx.lineTo(x + s, y + s);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x, y);
    ctx.closePath();
    return;
  }
  ctx.rect(x, y, s, s);
};

// 定位点外框（7x7），pal={pt,bg}
const drawFinderRing = (ctx, x, y, c, type, pal) => {
  if (type === 'dotted') {
    ctx.fillStyle = pal.pt;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i > 0 && i < 6 && j > 0 && j < 6) continue;
        ctx.beginPath();
        ctx.arc(x + (j + 0.5) * c, y + (i + 0.5) * c, c * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }
  ctx.fillStyle = pal.pt;
  finderShapePath(ctx, x, y, 7 * c, type);
  ctx.fill();
  ctx.fillStyle = pal.bg;
  finderShapePath(ctx, x + c, y + c, 5 * c, type);
  ctx.fill();
};

// 定位点内点（3x3），pal={inpt}
const drawFinderDot = (ctx, x, y, c, type, pal) => {
  ctx.fillStyle = pal.inpt;
  if (type === 'dotted') {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.arc(x + (2 + j + 0.5) * c, y + (2 + i + 0.5) * c, c * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }
  finderShapePath(ctx, x + 2 * c, y + 2 * c, 3 * c, type);
  ctx.fill();
};

// 按图案样式绘制单个定位点（row/col 为 7x7 图案左上角所在模块坐标）
const drawFinderPattern = (ctx, offset, cellSize, row, col, styleKey) => {
  const style = patternStyles.find((s) => s.key === styleKey) || patternStyles[0];
  const x = offset + col * cellSize;
  const y = offset + row * cellSize;
  const pal = { pt: colors.value.pt, inpt: colors.value.inpt, bg: colors.value.bg };
  drawFinderRing(ctx, x, y, cellSize, style.ring, pal);
  drawFinderDot(ctx, x, y, cellSize, style.dot, pal);
};

// 渲染图案样式缩略图
const renderPatternThumbs = () => {
  patternStyles.forEach((p) => {
    const canvas = patternCanvases[p.key];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const pal = { pt: '#333333', inpt: '#333333', bg: '#ffffff' };
    drawFinderRing(ctx, 2, 2, 6, p.ring, pal);
    drawFinderDot(ctx, 2, 2, 6, p.dot, pal);
  });
};

// 获取渐变颜色
const getGradientColor = (col, row, count) => {
  const fg = hexToRgb(colors.value.fg);
  const gc = hexToRgb(colors.value.gc);
  let ratio;

  switch (colors.value.gradientWay) {
    case 'circular':
      const center = count / 2;
      const dist = Math.sqrt(Math.pow(col - center, 2) + Math.pow(row - center, 2));
      ratio = dist / (count / 2);
      break;
    case 'backslash':
      ratio = (col + row) / (count * 2);
      break;
    case 'slash':
      ratio = (col - row + count) / (count * 2);
      break;
    case 'horizontal':
      ratio = col / count;
      break;
    case 'vertical':
      ratio = row / count;
      break;
    default:
      return colors.value.fg;
  }

  ratio = Math.min(1, Math.max(0, ratio));
  const r = Math.round(fg.r + (gc.r - fg.r) * ratio);
  const g = Math.round(fg.g + (gc.g - fg.g) * ratio);
  const b = Math.round(fg.b + (gc.b - fg.b) * ratio);

  return `rgb(${r},${g},${b})`;
};

// 绘制Logo
const drawLogo = (ctx, size, offset, cellSize) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const logoSize = Math.floor(size * 0.2);
      const x = (size - logoSize) / 2;
      const y = (size - logoSize) / 2;

      // 根据Logo类型绘制
      if (logo.value.type === 'border') {
        // 白底
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
      } else if (logo.value.type === 'stroke') {
        // 描边
        ctx.strokeStyle = colors.value.fg;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
      } else if (logo.value.type === 'icon') {
        // 圆角
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, logoSize, logoSize, 10);
        ctx.clip();
      }

      ctx.drawImage(img, x, y, logoSize, logoSize);

      if (logo.value.type === 'icon') {
        ctx.restore();
      }

      resolve();
    };
    img.src = logo.value.dataUrl;
  });
};

// 绘制文字
const drawText = (ctx, size) => {
  const text = textEmbed.value.content;
  const fontsize = parseInt(textEmbed.value.fontsize);
  const effect = textEmbed.value.effect;

  ctx.font = `${fontsize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const x = size / 2;
  const y = size / 2;

  switch (effect) {
    case 'default': // 描边
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeText(text, x, y);
      ctx.fillStyle = textEmbed.value.color;
      ctx.fillText(text, x, y);
      break;
    case 'in': // 内融合
      ctx.fillStyle = textEmbed.value.color;
      ctx.fillText(text, x, y);
      break;
    case 'out': // 外融合
      ctx.fillStyle = textEmbed.value.color;
      ctx.shadowColor = textEmbed.value.color;
      ctx.shadowBlur = 5;
      ctx.fillText(text, x, y);
      break;
    case 'stretch': // 拉伸
      ctx.save();
      ctx.scale(1.5, 1);
      ctx.fillStyle = textEmbed.value.color;
      ctx.fillText(text, x / 1.5, y);
      ctx.restore();
      break;
    case '3d': // 3D效果
      ctx.fillStyle = '#cccccc';
      ctx.fillText(text, x + 2, y + 2);
      ctx.fillStyle = textEmbed.value.color;
      ctx.fillText(text, x, y);
      break;
    case 'light': // 发光
      ctx.fillStyle = textEmbed.value.color;
      ctx.shadowColor = textEmbed.value.color;
      ctx.shadowBlur = 10;
      ctx.fillText(text, x, y);
      break;
  }
};

// 清除设置
const resetAll = () => {
  colors.value = {
    fg: '#000000',
    gc: '#000000',
    pt: '#000000',
    bg: '#ffffff',
    gradientWay: 'backslash',
    inpt: '#000000'
  };
  logo.value = { type: 'default', dataUrl: '', name: '' };
  textEmbed.value = { content: '', effect: 'default', fontsize: 28, color: '#000000' };
  other.value = { margin: 10, level: 'M', rotate: 0, size: 300 };
  dotShape.value = 0;
  liquidMode.value = false;
  patternStyle.value = 'default';

  if (logoInput.value) logoInput.value.value = '';

  drawQRCode();
  message.success('已清除设置');
};

// 下载图片
const downloadImage = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  message.success('图片已下载');
};

// 复制图片链接
const copyImageLink = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  canvas.toBlob((blob) => {
    const item = new ClipboardItem({ 'image/png': blob });
    navigator.clipboard.write([item]).then(() => {
      message.success('图片已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  });
};

// 辅助函数
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// 初始化
onMounted(() => {
  drawQRCode();
  renderPatternThumbs();
});
</script>

<style scoped>
.qrcode-page {
  max-width: 1100px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.qrcode-title {
  font-size: 18px;
  text-align: center;
  color: #34495e;
  margin-bottom: 20px;
}

.qrcode-body {
  display: flex;
  gap: 30px;
}

.qrcode-left {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 15px;
}

.qrcode-right {
  flex-shrink: 0;
  width: 440px;
}

.qrcode-forms {
  flex: 1;
  min-width: 0;
  max-width: 460px;
}

.tabs {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 72px;
  gap: 4px;
  border-right: 1px solid #ddd;
  padding-right: 8px;
}

.tab-elem {
  padding: 8px 6px;
  text-align: center;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
  font-size: 14px;
}

.tab-elem:hover {
  background-color: #f0f0f0;
  color: #34495e;
}

.tab-elem.active {
  background-color: #1677ff;
  color: #fff;
}

.sub {
  background: #fff;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.tit {
  font-size: 14px;
  color: #34495e;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.tit span {
  color: #999;
  font-size: 12px;
  margin-right: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  color: #666;
}

.form-group input,
.form-group select,
.text,
.sms_text {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.text,
.sms_text {
  height: 100px;
  resize: vertical;
  font-family: inherit;
}

.size {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  text-align: right;
}

.prompt {
  font-size: 12px;
  color: #999;
  padding: 10px;
  background: #f0f7ff;
  border-radius: 4px;
  border: 1px solid #bae7ff;
}

.canvas-wrap {
  background: #fff;
  padding: 10px;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.canvas {
  border: 1px solid #eee;
  width: 200px;
  height: 200px;
}

.diy_div {
  background: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.diy_scroll {
  margin-bottom: 4px;
}

.dot-slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #91caff, #1677ff);
  outline: none;
  cursor: pointer;
}

.dot-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #1677ff;
  cursor: pointer;
}

.dot-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #1677ff;
  cursor: pointer;
}

.diy_statue {
  display: flex;
  gap: 8px;
}

.diy_statue a {
  flex: 1;
  text-align: center;
  padding: 4px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #666;
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s;
}

.diy_statue a:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.diy_statue a.on {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}

.fnrow {
  background: #fff;
  padding: 12px 14px;
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
}

.tabset {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  width: 78px;
  border-right: 1px solid #eee;
  padding-right: 10px;
}

.tabset .tabelem {
  padding: 6px 8px;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  text-align: center;
  border-radius: 4px;
}

.tabset .tabelem:hover {
  background-color: #f0f0f0;
}

.tabset .tabelem.active {
  background-color: #1677ff;
  color: #fff;
}

.fnsubv {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.colors,
.logotypes,
.fontset,
.baseset {
  list-style: none;
  padding: 0;
  margin: 0;
}

.colors li,
.logotypes li,
.fontset li,
.baseset li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  padding: 2px 0;
}

.colors label,
.fontset label,
.baseset label {
  width: 90px;
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 13px;
  color: #666;
}

.colors input[type="color"] {
  width: 40px;
  height: 30px;
  padding: 2px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.colors select,
.fontset select,
.baseset select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.logotypes {
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.logotypes label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-right: 15px;
  font-size: 13px;
  cursor: pointer;
}

.pic {
  margin-bottom: 10px;
}

.picelem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.picelem span {
  font-size: 13px;
  color: #666;
}

.del,
.close {
  color: #999;
  text-decoration: none;
  font-size: 18px;
  cursor: pointer;
}

.del:hover,
.close:hover {
  color: #ff4d4f;
}

.format {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.pattern-item {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.pattern-item:hover {
  border-color: #1677ff;
}

.pattern-item.on {
  border-color: #1677ff;
  box-shadow: 0 0 0 1px #1677ff;
  background: #f0f7ff;
}

.pattern-item canvas {
  display: block;
  width: 46px;
  height: 46px;
}

.content {
  margin-bottom: 15px;
}

.ctext {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.other {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.other .btn {
  padding: 6px 14px;
  font-size: 13px;
}

.tool-info {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

.tool-info h5 {
  font-size: 14px;
  color: #34495e;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8e8e8;
}

@media (max-width: 900px) {
  .qrcode-body {
    flex-direction: column;
  }

  .qrcode-right {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .qrcode-page {
    margin: 10px;
    padding: 14px;
  }

  .qrcode-left {
    flex-direction: column;
  }

  .qrcode-forms {
    max-width: none;
  }

  .tabs {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd;
    padding-right: 0;
    padding-bottom: 10px;
    margin-bottom: 15px;
    gap: 3px;
  }

  .tab-elem {
    padding: 6px 12px;
    font-size: 13px;
  }

  .other {
    flex-direction: column;
  }

  .other .btn {
    width: 100%;
  }
}
</style>
