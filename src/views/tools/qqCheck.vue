<template>
  <div class="qq-page">
    <!-- 顶部蓝色横幅 -->
    <div class="qq-banner">
      <div class="qq-banner-title">寻找10年以上皇冠QQ</div>
      <div class="qq-banner-format">格式123-456-789</div>
    </div>

    <!-- 输入区 -->
    <div class="qq-search">
      <input
        v-model="qqInput"
        class="qq-input"
        type="text"
        placeholder="请输入QQ号码"
        @keyup.enter="evaluate"
      />
      <button class="qq-eval-btn" :disabled="loading" @click="evaluate">{{ loading ? '查询中...' : '评估' }}</button>
    </div>
    <div v-if="apiKey" class="key-line">
      已保存接口KEY
      <a href="javascript:;" @click="openKeyModal">修改</a>
    </div>

    <!-- KEY 输入弹窗 -->
    <div v-if="showKeyModal" class="key-mask">
      <div class="key-dialog">
        <h4>输入接口KEY</h4>
        <p class="key-tip">首次查询需输入接口KEY，保存后下次无需再次输入。</p>
        <input
          v-model="keyInput"
          class="key-input"
          type="text"
          placeholder="请输入接口KEY"
          @keyup.enter="saveKey"
        />
        <div class="key-actions">
          <button class="key-cancel" @click="showKeyModal = false">取消</button>
          <button class="key-ok" @click="saveKey">保存</button>
        </div>
      </div>
    </div>

    <!-- 结果面板 -->
    <div v-if="result" class="qq-panel">
      <!-- 资料区 -->
      <div class="profile">
        <div class="avatar-box">
          <img v-if="result.head" :src="result.head" class="avatar-img" alt="QQ头像" referrerpolicy="no-referrer" />
          <div v-else class="avatar-face">🐧</div>
          <div class="avatar-tag">{{ result.level >= 64 ? 'QQ达人' : '非QQ达人' }}</div>
        </div>
        <div class="info-cells">
          <div class="cell"><span class="ico">🎈</span><span class="k">昵称：</span>{{ result.nickname }}</div>
          <div class="cell">
            <span class="ico">🔆</span><span class="k text-red">等级：</span>
            <span class="text-red level-num">{{ result.level }} 级</span>
          </div>
          <div class="cell cell-span2">
            <span class="ico">🏅</span><span class="k">等级图标：</span>
            <span class="level-icons">{{ result.levelIcons }}</span>
          </div>
          <div class="cell"><span class="ico">📅</span><span class="k">等级天数：</span>{{ result.activeDays }}天</div>
          <div class="cell"><span class="ico">📈</span>升{{ result.level + 1 }}级大概还需要≈{{ result.upgradeDays }}天</div>
          <div class="cell"><span class="ico">🕐</span><span class="k">今日在线：</span>{{ result.todayOnline }}小时</div>
          <div class="cell"><span class="ico">⚡</span><span class="k">今日成长：</span>{{ result.growthToday }}天</div>
          <div class="cell">
            <span class="ico">👑</span><span class="k">会员：</span>
            <span :class="result.vip ? 'text-red' : ''">{{ result.vip ? `已开通（${result.vipLevel}级）` : '未开通' }}</span>
            <span class="vip-badge">VIP</span>
          </div>
          <div class="cell"><span class="ico">🌟</span><span class="k">超级会员：</span><span :class="result.svip ? 'text-red' : ''">{{ result.svip ? '已开通' : '未开通' }}</span></div>
          <div class="cell"><span class="ico">📺</span><span class="k">大会员：</span><span :class="result.bigClub ? 'text-red' : ''">{{ result.bigClub ? '已开通' : '未开通' }}</span></div>
          <div class="cell"><span class="ico">💻</span><span class="k">PC在线：</span>{{ result.pcOnline ? '在线' : '离线' }}</div>
        </div>
      </div>

      <!-- 钻服务图标区 -->
      <div class="services">
        <div v-for="s in result.services" :key="s.name" class="svc">
          <span class="svc-ico">{{ s.icon }}</span>
          <span :class="s.open ? 'svc-open' : 'svc-closed'">{{ s.open ? '已开通' : '未开通' }}</span>
          <span class="svc-name">{{ s.name }}</span>
        </div>
      </div>

      <!-- 估值横幅 -->
      <div class="value-banner">
        <div class="crown-badge">C</div>
        <span class="value-text">该号码最终参考估值为：</span>
        <span class="value-num">¥ {{ result.total }}</span>
      </div>

      <!-- 分析表格 -->
      <table class="analysis-table">
        <thead>
          <tr>
            <th>号码分析</th>
            <th>号码类型</th>
            <th>分析数字</th>
            <th>估值</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in result.rows" :key="i">
            <td class="col-name">{{ row.name }}</td>
            <td>{{ row.type }}</td>
            <td :class="{ 'col-red': row.analysisRed }">{{ row.analysis }}</td>
            <td class="col-red">+ {{ row.value }}</td>
          </tr>
          <tr class="total-row">
            <td colspan="3" class="total-label">QQ价值评估：</td>
            <td class="total-value">¥ {{ result.total }}</td>
          </tr>
        </tbody>
      </table>

      <div class="mem-usage" v-if="false"></div>
    </div>

    <div class="tool-info">
      <h5>工具说明</h5>
      <p>
        1.输入QQ号码（支持 123-456-789 等带分隔符格式），点击“评估”即可查询并生成估值报告。<br />
        2.首次查询需输入接口KEY，保存到本机 localStorage，之后再次查询无需重复输入。<br />
        3.资料数据来自第三方接口，估值部分为本地娱乐计算，与腾讯官方无任何关系。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';

const KEY_STORAGE = 'qqcheck_api_key';
const API_URL = 'https://cn.apihz.cn/api/other/qq.php';
const API_ID = '10003261';

const qqInput = ref('');
const result = ref(null);
const loading = ref(false);
const apiKey = ref(localStorage.getItem(KEY_STORAGE) || '');
const showKeyModal = ref(false);
const keyInput = ref('');
const pendingQuery = ref(false);

// 位数基准估值
const baseValueByLen = (len) => {
  if (len <= 5) return 5000;
  if (len === 6) return 2000;
  if (len === 7) return 500;
  if (len === 8) return 100;
  if (len === 9) return 58;
  if (len === 10) return 20;
  return 5;
};

// 寓意数字组合
const LUCKY_PATTERNS = [
  ['8888', 388], ['6666', 366], ['9999', 399], ['1314', 131],
  ['888', 88], ['666', 66], ['999', 99], ['520', 52],
  ['168', 16], ['518', 51], ['789', 78], ['678', 67],
  ['567', 56], ['456', 45], ['345', 34], ['234', 23], ['123', 12]
];

const openKeyModal = () => {
  keyInput.value = apiKey.value;
  pendingQuery.value = false;
  showKeyModal.value = true;
};

const saveKey = () => {
  const key = keyInput.value.trim();
  if (!key) {
    message.error('请输入接口KEY');
    return;
  }
  apiKey.value = key;
  localStorage.setItem(KEY_STORAGE, key);
  showKeyModal.value = false;
  message.success('KEY已保存');
  if (pendingQuery.value) {
    pendingQuery.value = false;
    evaluate();
  }
};

const isOn = (v) => String(v) === '1';

const evaluate = () => {
  const qq = qqInput.value.replace(/[^\d]/g, '');
  if (!/^\d{5,11}$/.test(qq)) {
    message.error('请输入正确的QQ号码（5-11位数字）');
    return;
  }
  if (!apiKey.value) {
    keyInput.value = '';
    pendingQuery.value = true;
    showKeyModal.value = true;
    return;
  }
  queryQQ(qq);
};

const queryQQ = async (qq) => {
  loading.value = true;
  try {
    const url = `${API_URL}?id=${API_ID}&key=${encodeURIComponent(apiKey.value)}&qq=${qq}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 200) {
      message.error(data.text || data.msg || '查询失败，请重试');
      return;
    }
    buildResult(qq, data);
  } catch (err) {
    message.error('查询失败，请检查网络或稍后重试');
  } finally {
    loading.value = false;
  }
};

const buildResult = (qq, d) => {
  const len = qq.length;
  const level = Number(d.Level) || 0;

  /* 估值明细 */
  const rows = [];

  // 1. 位数基准
  const baseVal = baseValueByLen(len);
  rows.push({ name: '位数基准', type: `${len}位QQ号`, analysis: qq, value: baseVal });

  // 2. 包含寓意
  const found = LUCKY_PATTERNS.filter(([p]) => qq.includes(p));
  const luckyVal = found.reduce((s, [, v]) => s + v, 0);
  rows.push({
    name: '包含寓意',
    type: found.length ? found.map(([p]) => p).join('、') : '无',
    analysis: found.length ? found.map(([p]) => p).join('、') : '无',
    value: luckyVal
  });

  // 3. 账号等级
  const levelVal = level * 10;
  rows.push({ name: '账号等级', type: `${level}级`, analysis: qq, value: levelVal });

  // 4. 数字重复
  const counts = {};
  for (const ch of qq) counts[ch] = (counts[ch] || 0) + 1;
  const luckyDigitVal2 = { 6: 60, 8: 80, 9: 90 };
  const luckyDigitVal3 = { 6: 160, 8: 180, 9: 190 };
  let repeatVal = 0;
  Object.keys(counts).sort().forEach((digit) => {
    const c = counts[digit];
    if (c < 2) return;
    let v;
    if (c === 2) v = luckyDigitVal2[digit] || 40;
    else if (c === 3) v = luckyDigitVal3[digit] || 120;
    else v = 300;
    repeatVal += v;
    rows.push({
      name: '数字重复',
      type: `${len}位号,数字[${digit}]共出现了(${c})次`,
      analysis: `数字[${digit}] ${c}次`,
      analysisRed: true,
      value: v
    });
  });

  const total = baseVal + luckyVal + levelVal + repeatVal;

  const services = [
    { name: 'QQ会员', icon: '👑', open: isOn(d.iVip) },
    { name: '超级会员', icon: '🌟', open: isOn(d.iSVip) },
    { name: '年费会员', icon: '💎', open: isOn(d.iYearVip) },
    { name: '大会员', icon: '📺', open: Number(d.iBigClubLevel) > 0 },
    { name: 'PC在线', icon: '💻', open: isOn(d.iPCQQOnline) }
  ];

  result.value = {
    qq: d.qq || qq,
    head: d.head || '',
    nickname: d.Name || '-',
    level,
    levelIcons: d.Icon || '-',
    activeDays: d.NetworkDay ?? '-',
    upgradeDays: d.Next ?? '-',
    todayOnline: d.Active ?? '-',
    growthToday: d.TheDays ?? '-',
    vip: isOn(d.iVip),
    vipLevel: d.iVipLevel ?? '-',
    svip: isOn(d.iSVip),
    bigClub: Number(d.iBigClubLevel) > 0,
    pcOnline: isOn(d.iPCQQOnline),
    rows,
    total,
    services
  };
};
</script>

<style scoped>
.qq-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 12px;
  background: #fdfdf3;
  min-height: 100%;
}

/* 顶部横幅 */
.qq-banner {
  background: linear-gradient(180deg, #14a9ec 0%, #0b8fd8 100%);
  border-radius: 6px;
  text-align: center;
  padding: 28px 12px 22px;
  color: #fff;
}
.qq-banner-title {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
}
.qq-banner-format {
  margin-top: 14px;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 4px;
}

/* 输入区 */
.qq-search {
  display: flex;
  gap: 10px;
  margin: 14px 0;
}
.qq-input {
  flex: 1;
  height: 64px;
  font-size: 28px;
  padding: 0 18px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
  letter-spacing: 2px;
}
.qq-input:focus {
  border-color: #14a9ec;
  box-shadow: 0 0 0 2px rgba(20, 169, 236, 0.15);
}
.qq-eval-btn {
  width: 150px;
  height: 64px;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  background: #0d9ae8;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.qq-eval-btn:hover {
  background: #0b8fd8;
}
.qq-eval-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* KEY 提示与弹窗 */
.key-line {
  margin: -4px 0 14px;
  font-size: 13px;
  color: #888;
  text-align: right;
}
.key-line a {
  color: #0d9ae8;
  margin-left: 6px;
}
.key-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.key-dialog {
  width: 420px;
  max-width: 90vw;
  padding: 22px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}
.key-dialog h4 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}
.key-tip {
  margin-bottom: 14px;
  font-size: 13px;
  color: #888;
}
.key-input {
  box-sizing: border-box;
  width: 100%;
  height: 42px;
  padding: 0 12px;
  font-size: 15px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
}
.key-input:focus {
  border-color: #14a9ec;
  box-shadow: 0 0 0 2px rgba(20, 169, 236, 0.15);
}
.key-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
.key-cancel,
.key-ok {
  height: 38px;
  padding: 0 22px;
  font-size: 15px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.key-ok {
  color: #fff;
  background: #0d9ae8;
  border-color: #0d9ae8;
}
.key-ok:hover {
  background: #0b8fd8;
}

/* 结果面板 */
.qq-panel {
  background: #fffef2;
  border: 1px solid #d6e8c8;
  border-radius: 4px;
  padding: 12px;
  position: relative;
}

/* 资料区 */
.profile {
  display: flex;
  gap: 12px;
}
.avatar-box {
  width: 170px;
  flex-shrink: 0;
  text-align: center;
}
.avatar-face {
  width: 150px;
  height: 150px;
  margin: 0 auto;
  font-size: 96px;
  line-height: 150px;
  background: linear-gradient(135deg, #b3e5fc, #e1f5fe);
  border: 3px solid #4fc3f7;
  border-radius: 8px;
}
.avatar-img {
  display: block;
  width: 150px;
  height: 150px;
  margin: 0 auto;
  object-fit: cover;
  background: #e1f5fe;
  border: 3px solid #4fc3f7;
  border-radius: 8px;
}
.avatar-tag {
  margin-top: 8px;
  color: #e91e63;
  font-size: 18px;
  font-weight: 700;
}
.info-cells {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.cell {
  border: 1px dotted #8bc34a;
  padding: 10px 12px;
  font-size: 17px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
}
.cell-span2 {
  grid-column: span 2;
}
.ico {
  font-size: 18px;
}
.k {
  font-weight: 700;
}
.text-red {
  color: #e53935;
  font-weight: 700;
}
.level-num {
  font-size: 19px;
}
.level-icons {
  margin-left: 10px;
  font-size: 20px;
  letter-spacing: 3px;
}
.vip-badge {
  margin-left: 8px;
  background: #9e9e9e;
  color: #fff;
  font-weight: 800;
  font-style: italic;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 15px;
}

/* 钻服务区 */
.services {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-top: 12px;
}
.svc {
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 4px;
  padding: 8px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 15px;
}
.svc-ico {
  font-size: 20px;
}
.svc-open {
  color: #43a047;
  font-weight: 700;
}
.svc-closed {
  color: #e53935;
}
.svc-name {
  color: #888;
  font-size: 13px;
}

/* 估值横幅 */
.value-banner {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 12px;
}
.crown-badge {
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  background: radial-gradient(circle at 50% 35%, #ffe082, #ffb300);
  border: 4px solid #ff8f00;
  border-radius: 50%;
  color: #e65100;
  font-size: 46px;
  font-weight: 900;
  text-align: center;
  line-height: 76px;
  box-shadow: 0 4px 10px rgba(255, 143, 0, 0.4);
}
.value-text {
  font-size: 30px;
  font-weight: 800;
  color: #ff7043;
}
.value-num {
  font-size: 52px;
  font-weight: 900;
  color: #d81b60;
}

/* 分析表格 */
.analysis-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  font-size: 16px;
}
.analysis-table th {
  color: #2e9e6b;
  font-size: 19px;
  font-weight: 800;
  padding: 10px;
  border: 1px solid #e0e0e0;
  text-align: left;
}
.analysis-table td {
  padding: 9px 10px;
  border: 1px solid #e8e8e8;
}
.col-name {
  color: #e91e63;
  font-weight: 700;
  width: 130px;
}
.col-red {
  color: #e53935;
  font-weight: 700;
}
.total-row td {
  border-top: 2px solid #bdbdbd;
  padding: 12px 10px;
}
.total-label {
  text-align: right;
  font-size: 19px;
  font-weight: 700;
  color: #333;
}
.total-value {
  color: #e53935;
  font-size: 24px;
  font-weight: 900;
}

.mem-usage {
  position: absolute;
  right: 14px;
  bottom: 10px;
  color: #bbb;
  font-size: 13px;
  text-align: right;
}

/* 工具说明 */
.tool-info {
  margin-top: 18px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 14px 18px;
  color: #666;
  line-height: 1.9;
}
.tool-info h5 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #333;
}

@media (max-width: 768px) {
  .qq-banner-title { font-size: 26px; }
  .qq-banner-format { font-size: 24px; }
  .profile { flex-direction: column; align-items: center; }
  .info-cells { grid-template-columns: 1fr; width: 100%; }
  .cell-span2 { grid-column: span 1; }
  .services { grid-template-columns: repeat(2, 1fr); }
  .value-text { font-size: 20px; }
  .value-num { font-size: 34px; }
}
</style>
