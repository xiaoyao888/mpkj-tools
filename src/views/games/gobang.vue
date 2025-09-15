<template>
  <div class="gobang-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="header-wrapper">
      <h1 class="game-title" @dblclick="editTitle">
        {{ gameTitle }}
      </h1>

      <h3 class="sub-title" @dblclick="editSubTitle">
        {{ subTitle }}
      </h3>
    </div>

    <div class="control-buttons">
      <button class="control-btn" @click="toggleDarkMode" title="切换暗夜模式">
        <span v-if="!isDarkMode">🌙</span>
        <span v-else>☀️</span>
      </button>
      <button class="control-btn" @click="toggleFullscreen" title="全屏/退出全屏">
        <span>🔍</span>
      </button>
    </div>
    <div class="game-info">
      <p>当前玩家: 
        <span :class="currentPlayer === 'black' ? 'player-black' : 'player-white'">
          {{ currentPlayer === 'black' ? '黑棋' : '白棋' }}
        </span>
      </p>
    </div>

    <div class="board-container">
      <div class="chessboard-container">
        <canvas
          ref="canvasRef"
          class="chessboard"
          @click="handleCanvasClick"
          @touchstart="handleCanvasTouch"
        ></canvas>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <div class="button-group">
        <button class="reset-button" @click="resetGame">重新开始</button>
        <button class="undo-button" @click="undoMove" :disabled="history.length === 0">悔棋</button>
      </div>
    </div>

    <!-- 标题编辑弹窗 -->
    <a-modal
      v-model:open="isEditTitleVisible"
      title="编辑游戏标题"
      ok-text="确定"
      cancel-text="取消"
      @ok="saveTitle"
    >
      <a-input
        v-model:value="tempTitle"
        placeholder="请输入新的游戏标题"
        maxlength="20"
      />
    </a-modal>
    <a-modal
      v-model:open="isEditSubTitleVisible"
      title="编辑游戏子标题"
      ok-text="确定"
      cancel-text="取消"
      @ok="saveSubTitle"
    >
      <a-input
        v-model:value="tempSubTitle"
        placeholder="请输入新的游戏子标题"
        maxlength="20"
      />
    </a-modal>

    <!-- 游戏结束弹窗 -->
    <a-modal
      v-model:open="isGameOverVisible"
      title="游戏结束"
      ok-text="再来一局"
      cancel-text="关闭"
      @ok="resetGame"
      @cancel="isGameOverVisible = false"
    >
      <p class="game-over-message">
        {{ winner }}获胜！
      </p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Modal, Input } from 'ant-design-vue';
import zuobiaoData from '@/assets/zuobiaoData.json';
// 游戏状态
const boardSize = 15; // 15x15的棋盘
const isDarkMode = ref(false); // 暗夜模式状态
const board = ref(() => {
  // 初始化board为一个15x15的二维数组
  const initialBoard = [];
  for (let i = 0; i < boardSize; i++) {
    const row = [];
    for (let j = 0; j < boardSize; j++) {
      row.push('');
    }
    initialBoard.push(row);
  }
  return initialBoard;
});
const currentPlayer = ref('black'); // 'black'或'white'
const gameTitle = ref('五子棋游戏，连胜1把');
const tempTitle = ref('');
const subTitle = ref('眼镜连麦');
const tempSubTitle = ref('');
const isEditTitleVisible = ref(false);
const isEditSubTitleVisible = ref(false);
const isGameOverVisible = ref(false);
const winner = ref('');
const canvasRef = ref(null);
// 存储历史记录，用于悔棋功能
const history = ref([]);

// Canvas相关变量
let canvas = null;
let ctx = null;
let cellSize = 0; // 单元格大小
let padding = 0; // 内边距

// 初始化Canvas
const initCanvas = () => {
  if (!canvasRef.value) return;
  
  canvas = canvasRef.value;
  ctx = canvas.getContext('2d');
  
  // 设置Canvas尺寸
  const container = canvas.parentElement;
  const size = Math.min(container.clientWidth, container.clientHeight);
  canvas.width = size;
  canvas.height = size;
  
  // 计算单元格大小和内边距
  padding = size * 0.05;
  cellSize = (size - padding * 2) / (boardSize - 1);
  
  // 渲染棋盘
  renderBoard();
};

// 渲染棋盘
const renderBoard = () => {
  if (!ctx || !canvas) return;
  
  // 清空Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制棋盘背景
  ctx.fillStyle = isDarkMode.value ? '#666' : '#f0d9b5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制网格线
  ctx.strokeStyle = isDarkMode.value ? '#333' : '#8c7851';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < boardSize; i++) {
    // 横线
    ctx.beginPath();
    ctx.moveTo(padding, padding + i * cellSize);
    ctx.lineTo(canvas.width - padding, padding + i * cellSize);
    ctx.stroke();
    
    // 竖线
    ctx.beginPath();
    ctx.moveTo(padding + i * cellSize, padding);
    ctx.lineTo(padding + i * cellSize, canvas.height - padding);
    ctx.stroke();
  }
  
  // 绘制星位点
  drawStarPoints();
  
  // 绘制交叉点数字（从中心点开始顺时针显示12345）
  drawNumbers();
  
  // 绘制棋子
  drawPieces();
};

// 绘制星位点
const drawStarPoints = () => {
  if (!ctx) return;
  
  // 定义星位点位置（15x15棋盘的星位点坐标）
  const starPoints = [
    { row: 3, col: 3 },    // 左上星位
    { row: 3, col: 11 },   // 右上星位
    { row: 7, col: 7 },    // 天元
    { row: 11, col: 3 },   // 左下星位
    { row: 11, col: 11 }   // 右下星位
  ];
  
  ctx.fillStyle = isDarkMode.value ? '#333' : '#8c7851';
  
  for (const point of starPoints) {
    const x = padding + point.col * cellSize;
    const y = padding + point.row * cellSize;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
};

// 绘制交叉点数字（按照特定路径：1下方为2，2往左为3，3上方为4，4上方为5，5右方为6，以此类推）
const drawNumbers = () => {
  if (!ctx) return;

  // 设置字体样式
  ctx.font = '10px Arial';
  ctx.fillStyle = isDarkMode.value ? '#ccc' : '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 棋盘中心点坐标（天元位置）
  const centerRow = 7;
  const centerCol = 7;
  
  // 创建一个二维数组来存储每个位置的数字
  const numbers = [];
  for (let i = 0; i < boardSize; i++) {
    numbers[i] = [];
  }
  
  // 按照zuobiaoData数组中的row（行）、col（列）和num（值）分配数字
  // 先清空所有位置
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      numbers[i][j] = null;
    }
  }
  
  // 按照zuobiaoData数组中的顺序和值分配数字
  if (zuobiaoData && Array.isArray(zuobiaoData)) {
    for (const item of zuobiaoData) {
      const { row, col, num } = item;
      // 检查坐标是否在棋盘范围内
      if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
        numbers[row][col] = num;
      }
    }
  }
  
  // 绘制所有交叉点的数字
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const x = padding + j * cellSize;
      const y = padding + i * cellSize;
      const number = numbers[i][j];
      
      // 绘制数字背景（提高可读性）
      // ctx.fillStyle = isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      // ctx.fillRect(x - 8, y - 8, 16, 16);
      
      // 设置数字颜色并绘制
      ctx.fillStyle = isDarkMode.value ? '#ccc' : '#333';
      if(number>=1 && number<=9){
        ctx.font = '20px Arial';
      }else if(number>=10 && number<=99){
        ctx.font = '14px Arial';
      }else if(number>=100){
        ctx.font = '12px Arial';
      }
      if (number !== null) {
        ctx.fillText(number.toString(), x, y);
      }
    }
  }
};

// 绘制棋子
const drawPieces = () => {
  if (!ctx) return;
  
  const pieceRadius = cellSize * 0.45;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      const piece = board.value[i][j];
      if (piece) {
        const x = padding + j * cellSize;
        const y = padding + i * cellSize;
        
        // 绘制棋子阴影
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, pieceRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
        
        // 绘制棋子
        ctx.beginPath();
        ctx.arc(x, y, pieceRadius, 0, 2 * Math.PI);
        ctx.fillStyle = piece === 'black' ? '#000' : '#fff';
        ctx.fill();
        
        // 绘制白棋边框
        if (piece === 'white') {
          ctx.strokeStyle = '#ddd';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        
        // 绘制棋子高光效果
        if (piece === 'black') {
          const gradient = ctx.createRadialGradient(
            x - pieceRadius * 0.3, y - pieceRadius * 0.3, 0,
            x, y, pieceRadius
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.beginPath();
          ctx.arc(x, y, pieceRadius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }
    }
  }
};

// 根据点击坐标获取棋盘位置
const getBoardPosition = (x, y) => {
  // 检查是否在有效区域内
  if (x < padding - cellSize * 0.5 || x > canvas.width - padding + cellSize * 0.5 ||
      y < padding - cellSize * 0.5 || y > canvas.height - padding + cellSize * 0.5) {
    return null;
  }
  
  // 计算最近的交叉点
  const col = Math.round((x - padding) / cellSize);
  const row = Math.round((y - padding) / cellSize);
  
  // 检查是否在棋盘范围内
  if (col >= 0 && col < boardSize && row >= 0 && row < boardSize) {
    return { row, col };
  }
  
  return null;
};

// 处理Canvas点击事件
const handleCanvasClick = (event) => {
  if (winner.value !== '') return;
  
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const position = getBoardPosition(x, y);
  if (position) {
    handleCellClick(position.row, position.col);
  }
};

// 处理Canvas触摸事件（移动端）
const handleCanvasTouch = (event) => {
  event.preventDefault(); // 防止触发点击事件
  if (winner.value !== '') return;
  
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  const position = getBoardPosition(x, y);
  if (position) {
    handleCellClick(position.row, position.col);
  }
};

// 切换暗夜模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  renderBoard(); // 重新渲染棋盘
};

// 切换全屏模式
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    // 进入全屏
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('全屏请求失败:', err);
      });
    }
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// 初始化棋盘
const initBoard = () => {
  board.value = [];
  for (let i = 0; i < boardSize; i++) {
    const row = [];
    for (let j = 0; j < boardSize; j++) {
      row.push('');
    }
    board.value.push(row);
  }
  currentPlayer.value = 'black';
  winner.value = '';
  history.value = []; // 清空历史记录
  renderBoard(); // 重新渲染棋盘
};

// 立即初始化board，确保模板渲染时有正确的数据结构
initBoard();

// 处理落子
const handleCellClick = (row, col) => {
  // 检查是否可以落子
  if (board.value[row][col] !== '' || winner.value !== '') {
    return;
  }

  // 落子
  board.value[row][col] = currentPlayer.value;

  // 记录历史记录
  history.value.push({
    row,
    col,
    player: currentPlayer.value
  });

  // 重新渲染棋盘显示新棋子
  renderBoard();

  // 检查是否获胜
  if (checkWin(row, col)) {
    winner.value = currentPlayer.value === 'black' ? '黑棋' : '白棋';
    isGameOverVisible.value = true;
    return;
  }

  // 切换玩家
  currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black';
};

// 悔棋功能
const undoMove = () => {
  // 检查是否有可悔的步骤
  if (history.value.length === 0) {
    return;
  }

  // 游戏结束后不允许悔棋
  if (winner.value !== '') {
    isGameOverVisible.value = false;
    winner.value = '';
  }

  // 撤销上一步
  const lastMove = history.value.pop();
  board.value[lastMove.row][lastMove.col] = '';

  // 切换回上一个玩家
  currentPlayer.value = lastMove.player;
  
  // 重新渲染棋盘
  renderBoard();
};

// 检查是否获胜
const checkWin = (row, col) => {
  const directions = [
    [0, 1],  // 水平方向
    [1, 0],  // 垂直方向
    [1, 1],  // 对角线方向
    [1, -1]  // 反对角线方向
  ];

  const piece = board.value[row][col];

  for (const [dx, dy] of directions) {
    let count = 1; // 当前位置已经有一个棋子

    // 正方向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize &&
          board.value[newRow][newCol] === piece) {
        count++;
      } else {
        break;
      }
    }

    // 反方向检查
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize &&
          board.value[newRow][newCol] === piece) {
        count++;
      } else {
        break;
      }
    }

    // 五子连珠
    if (count >= 5) {
      return true;
    }
  }

  return false;
};

// 重新开始游戏
const resetGame = () => {
  initBoard();
  isGameOverVisible.value = false;
};

// 编辑标题
const editTitle = () => {
  tempTitle.value = gameTitle.value;
  isEditTitleVisible.value = true;
};

// 保存标题
const saveTitle = () => {
  if (tempTitle.value.trim()) {
    gameTitle.value = tempTitle.value.trim();
  }
  isEditTitleVisible.value = false;
};
// 编辑标题
const editSubTitle = () => {
  tempTitle.value = gameTitle.value;
  isEditSubTitleVisible.value = true;
};

// 保存标题
const saveSubTitle = () => {
  if (tempSubTitle.value.trim()) {
    subTitle.value = tempSubTitle.value.trim();
  }
  isEditSubTitleVisible.value = false;
};

// 监听窗口大小变化，重新调整Canvas
const handleResize = () => {
  initCanvas();
};

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    initCanvas();
    window.addEventListener('resize', handleResize);
  });
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.gobang-container {
  text-align: center;
  margin: 0;
  padding: 20px;
  background-color: #fff;
  height: 100vh;
  width: 100vw;
  transition: background-color 0.3s, color 0.3s;
}

.header-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.control-buttons {
  display: flex;
  gap: 10px;
  position: absolute;
  right: 10px;
  top: 10px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #f0f0f0;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background-color: #e0e0e0;
  transform: scale(1.05);
}

/* 暗夜模式样式 */
.dark-mode {
  background-color: #1e1e1e;
  color: #ffffff;
}

.dark-mode .control-btn {
  background-color: #444;
  color: #fff;
}

.dark-mode .control-btn:hover {
  background-color: #555;
}

.dark-mode .reset-button {
  background-color: #096dd9;
}

.dark-mode .reset-button:hover {
  background-color: #1890ff;
}

.dark-mode .undo-button {
  background-color: #531dab;
}

.dark-mode .undo-button:hover:not(:disabled) {
  background-color: #722ed1;
}

.dark-mode .undo-button:disabled {
  background-color: #444;
  color: #888;
}

.dark-mode .player-black {
  color: #ddd;
}

.dark-mode .player-white {
  color: #999;
}

.game-title {
  font-size: 28px;
  color: #333;
  cursor: pointer;
  transition: color 0.3s;
  text-align: center;
}

.game-title:hover {
  color: #1890ff;
}
.sub-title {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: color 0.3s;
  text-align: center;
}

.sub-title:hover {
  color: #1890ff;
}

.game-info {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.undo-button {
  padding: 8px 16px;
  background-color: #722ed1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.undo-button:hover:not(:disabled) {
  background-color: #9254de;
}

.undo-button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.game-info p {
  margin: 0;
  font-size: 16px;
}

.player-black {
  color: #000;
  font-weight: bold;
}

.player-white {
  color: #666;
  font-weight: bold;
}

.reset-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.reset-button:hover {
  background-color: #40a9ff;
}

.board-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-grow: 1;
  margin: 20px 0;
  position: relative;
}

.chessboard-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  width: calc(min(90vw, 90vh));
  height: calc(min(90vw, 90vh));
  border:3px solid #572b0c;
  border-radius:5px;
}

.chessboard {
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: block;
  width: 100%;
  height: 100%;
}

.game-over-message {
  font-size: 18px;
  text-align: center;
  color: #f5222d;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .gobang-container {
    padding: 10px;
    margin: 0;
  }

  .header-wrapper {
    margin-bottom: 15px;
  }

  .control-buttons {
    gap: 8px;
  }

  .control-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .game-title {
    font-size: 22px;
    margin-bottom: 15px;
  }

  .game-info {
    margin-bottom: 15px;
  }

  .game-info p {
    font-size: 14px;
  }

  .action-buttons {
    margin-top: 15px;
    margin-bottom: 15px;
  }

  .button-group {
    gap: 8px;
  }

  .reset-button,
  .undo-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 480px) {
  .gobang-container {
    padding: 8px;
    margin: 0;
  }

  .game-title {
    font-size: 20px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .reset-button,
  .undo-button {
    padding: 5px 10px;
    font-size: 11px;
  }

  .button-group {
    gap: 6px;
  }
}
</style>