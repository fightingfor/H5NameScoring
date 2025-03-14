<template>
  <div class="home">
    <header class="header">
      <h1>免费姓名打分</h1>
    </header>

    <main class="main">
      <div class="input-section">
        <form @submit.prevent="analyzeName" class="name-form">
          <div class="input-wrapper">
            <div class="input-group">
              <input
                v-model="form.surname"
                type="text"
                placeholder="姓"
                maxlength="3"
                @keyup.enter="focusGivenName"
                ref="surnameInput"
                :disabled="loading"
              />
              <input
                v-model="form.givenName"
                type="text"
                placeholder="名"
                maxlength="2"
                ref="givenNameInput"
                :disabled="loading"
              />
            </div>
            <button type="submit" :disabled="!isValid || loading">
              {{ loading ? "分析中..." : "开始分析" }}
            </button>
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </form>
      </div>

      <div v-if="result" class="result-section">
        <div class="score-card">
          <div class="score-wrapper">
            <div class="total-score">
              <span class="number">{{ result.totalScore }}</span>
              <span class="label">分</span>
            </div>
            <div class="luck-level">{{ result.luckLevel }}</div>
          </div>
        </div>

        <div class="analysis-content">
          <div class="total-grid">{{ result.analysis.general }}</div>
        </div>
      </div>

      <div
        class="history-section"
        @mouseenter="pauseScroll"
        @mouseleave="resumeScroll"
        ref="historySection"
      >
        <div class="history-list" ref="historyList">
          <div
            class="history-list-inner"
            :class="{
              paused: !isScrolling,
            }"
            @animationiteration="handleAnimationIteration"
          >
            <div
              v-for="(record, index) in displayRecords"
              :key="record.id"
              class="history-item"
              :class="{ highlight: isHighlighted(index) }"
              :ref="
                (el) => {
                  if (el) itemRefs[index] = el;
                }
              "
            >
              <span class="history-name">{{ record.fullName }}</span>
              <div class="history-score">
                <span class="score">{{ record.score }}分</span>
                <span class="level">{{ record.level }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from "vue";

interface Analysis {
  general: string;
}

interface AnalysisResult {
  totalScore: number;
  luckLevel: string;
  zongGe: string;
  analysis: Analysis;
}

interface HistoryRecord {
  fullName: string;
  score: number;
  level: string;
}

const form = ref({
  surname: "",
  givenName: "",
});

const surnameInput = ref<HTMLInputElement | null>(null);
const givenNameInput = ref<HTMLInputElement | null>(null);
const result = ref<AnalysisResult | null>(null);
const loading = ref(false);
const error = ref("");
const historyRecords = ref<HistoryRecord[]>([]);
const isScrolling = ref(true);
const displayRecords = ref<HistoryRecord[]>([]);
const historyList = ref<HTMLElement | null>(null);
const topItemIndex = ref(-1);
const itemRefs = ref<{ [key: number]: HTMLElement }>({});
const highlightedIndex = ref(-1);

const isValid = computed(() => {
  return form.value.surname && form.value.givenName;
});

const focusGivenName = () => {
  givenNameInput.value?.focus();
};

const analyzeName = async () => {
  if (!isValid.value) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        surname: form.value.surname,
        givenName: form.value.givenName,
      }),
    });

    const data = await response.json();

    if (data.success) {
      const resultData = {
        totalScore: data.data.score.average,
        luckLevel: data.data.score.luckLevel,
        zongGe: data.data.fiveGrid.numbers.zongGe,
        analysis: {
          general: data.data.fiveGrid.rules.zongGe.general_meaning,
        },
      };

      result.value = resultData;

      // 添加到历史记录
      historyRecords.value.unshift({
        fullName: form.value.surname + form.value.givenName,
        score: resultData.totalScore,
        level: resultData.luckLevel,
      });

      // 只保留最近的10条记录
      if (historyRecords.value.length > 10) {
        historyRecords.value = historyRecords.value.slice(0, 10);
      }

      error.value = "";
    } else {
      error.value = data.message || "分析失败，请稍后重试";
    }
  } catch (err) {
    console.error("Analysis failed:", err);
    error.value = "服务器连接失败，请确保后端服务正在运行";
  } finally {
    loading.value = false;
  }
};

// 自动聚焦姓氏输入框
setTimeout(() => {
  surnameInput.value?.focus();
}, 100);

const shouldScroll = computed(() => {
  return historyRecords.value.length > 5;
});

const pauseScroll = () => {
  isScrolling.value = false;
  stopHighlightTracking();
};

const resumeScroll = () => {
  if (shouldScroll.value) {
    isScrolling.value = true;
    startHighlightTracking();
  }
};

const updateDisplayRecords = () => {
  if (shouldScroll.value) {
    displayRecords.value = [...historyRecords.value, ...historyRecords.value];
  } else {
    displayRecords.value = historyRecords.value;
  }
};

onMounted(() => {
  updateDisplayRecords();
  startHighlightTracking();
});

watch(
  historyRecords,
  (newRecords: HistoryRecord[]) => {
    updateDisplayRecords();
    if (newRecords.length > 0) {
      nextTick(() => {
        const historySection = document.querySelector(".history-section");
        if (historySection) {
          historySection.scrollTop = 0;
        }
      });
    }
  },
  { deep: true }
);

// 检查元素是否在顶部位置
const isItemAtTop = (index: number) => {
  if (!historyList.value) return false;
  const itemHeight = 60; // 预估每个条目的高度
  const scrollTop = historyList.value.scrollTop;
  const itemPosition = index * itemHeight;
  const tolerance = 10; // 允许的误差范围

  return Math.abs(scrollTop - itemPosition) <= tolerance;
};

// 处理滚动事件
const handleScroll = () => {
  if (!historyList.value) return;
  const scrollTop = historyList.value.scrollTop;
  const itemHeight = 60; // 预估每个条目的高度
  const currentTopIndex = Math.round(scrollTop / itemHeight);
  topItemIndex.value = currentTopIndex;
};

// 检查元素是否应该高亮
const isHighlighted = (index: number) => {
  return index === highlightedIndex.value;
};

// 更新高亮索引
const updateHighlight = () => {
  if (!historyList.value) return;

  const containerRect = historyList.value.getBoundingClientRect();
  const topPosition = containerRect.top;

  // 找到最接近顶部的元素
  let closestIndex = -1;
  let minDistance = Infinity;

  Object.entries(itemRefs.value).forEach(([index, element]) => {
    const rect = element.getBoundingClientRect();
    const distance = Math.abs(rect.top - topPosition);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = parseInt(index);
    }
  });

  highlightedIndex.value = closestIndex;
};

// 监听动画帧
let animationFrameId: number;
const startHighlightTracking = () => {
  const track = () => {
    updateHighlight();
    animationFrameId = requestAnimationFrame(track);
  };
  track();
};

// 停止监听
const stopHighlightTracking = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
};

// 处理动画循环
const handleAnimationIteration = () => {
  // 重置高亮状态
  highlightedIndex.value = -1;
};

// 在组件卸载时清理
onUnmounted(() => {
  stopHighlightTracking();
});
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
}

.header {
  text-align: center;
  padding: 1rem 0;
  position: relative;
}

.header h1 {
  font-size: 1.8rem;
  color: #fff;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.05em;
  font-weight: 600;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.input-section {
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.name-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-wrapper {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  gap: 0.8rem;
  flex: 1;
  min-width: 200px;
}

.input-group input {
  width: 5em;
  min-width: 60px;
  padding: 0.9rem;
  font-size: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
  transition: all 0.3s ease;
  font-weight: 500;
}

.input-group input:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  transform: translateY(-1px);
}

button {
  padding: 0.9rem 1.5rem;
  font-size: 1.2rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  width: 100%;
  max-width: 120px;
}

button:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(52, 152, 219, 0.25);
}

button:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.score-card {
  background: rgba(255, 255, 255, 0.98);
  padding: 0.8rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.score-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #3498db;
}

.score-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.total-score {
  display: flex;
  align-items: baseline;
}

.total-score .number {
  font-size: 2.6rem;
  font-weight: bold;
  color: #2c3e50;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.total-score .label {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-left: 0.3rem;
  font-weight: 500;
}

.luck-level {
  font-size: 1.1rem;
  font-weight: bold;
  padding: 0.3rem 1rem;
  border-radius: 20px;
  background: #3498db;
  color: white;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.analysis-content {
  background: rgba(255, 255, 255, 0.98);
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  line-height: 1.6;
  font-size: 1rem;
  color: #2c3e50;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-height: 80px;
}

.analysis-content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #3498db;
}

.history-section {
  padding: 0.5rem;
  position: relative;
  overflow: hidden;
  height: 300px;
}

.history-section h2 {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem 0.5rem;
  font-weight: 500;
}

.history-list {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.history-list-inner {
  animation: scrollUpAnimation 20s linear infinite;
  animation-play-state: running;
}

.history-list-inner.paused {
  animation-play-state: paused;
}

@keyframes scrollUpAnimation {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  background: #fff;
  transform-origin: center left;
}

.history-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #fff8f0 0%, #fff 100%);
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.history-item.highlight {
  transform: scale(1.04) translateX(8px);
  box-shadow: 0 8px 24px rgba(230, 126, 34, 0.15);
  z-index: 2;
  border-radius: 12px;
  margin: 0.4rem;
  border: 1px solid rgba(230, 126, 34, 0.2);
  padding: 1.1rem 1.3rem;
}

.history-item.highlight::before {
  opacity: 1;
}

/* 高亮状态下的名字样式 */
.history-item .history-name {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 500;
}

.history-item.highlight .history-name {
  font-size: 1.2rem;
  color: #c0392b;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* 高亮状态下的分数样式 */
.history-item .history-score .score {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
}

.history-item.highlight .history-score .score {
  font-size: 1.2rem;
  font-weight: 800;
  color: #e67e22;
  text-shadow: 0 1px 2px rgba(230, 126, 34, 0.2);
}

/* 高亮状态下的运势等级样式 */
.history-item .history-score .level {
  font-size: 1rem;
  color: #3498db;
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 20px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-item.highlight .history-score .level {
  font-size: 1.05rem;
  color: white;
  font-weight: 700;
  padding: 0.4rem 1.2rem;
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 添加柔和的发光效果 */
.history-item::after {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  border-radius: 12px;
  z-index: -2;
  opacity: 0;
  filter: blur(6px);
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1.02);
}

.history-item.highlight::after {
  opacity: 0.08;
  animation: gentleGlow 3s ease-in-out infinite;
}

@keyframes gentleGlow {
  0%,
  100% {
    opacity: 0.08;
    transform: scale(1.02);
  }
  50% {
    opacity: 0.12;
    transform: scale(1.03);
  }
}

/* 普通状态的样式保持不变 */
.history-name {
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 500;
}

.history-score {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.history-score .score {
  font-size: 1.1rem;
  font-weight: bold;
  color: #2c3e50;
}

.history-score .level {
  font-size: 1rem;
  color: #3498db;
  font-weight: 600;
  padding: 0.3rem 0.8rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 12px;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 0.5rem;
  font-size: 1rem;
  background: rgba(231, 76, 60, 0.1);
  padding: 0.8rem;
  border-radius: 12px;
  font-weight: 500;
}

.input-group input:disabled {
  background: rgba(255, 255, 255, 0.8);
  cursor: not-allowed;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.total-grid {
  font-size: 1rem;
  line-height: 1.5;
  color: #333;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-top: 0;
  overflow-y: auto;
  max-height: 60px;
  scrollbar-width: thin;
  scrollbar-color: rgba(52, 152, 219, 0.5) transparent;
}

.total-grid::-webkit-scrollbar {
  width: 6px;
}

.total-grid::-webkit-scrollbar-track {
  background: transparent;
}

.total-grid::-webkit-scrollbar-thumb {
  background-color: rgba(52, 152, 219, 0.5);
  border-radius: 3px;
}

@media (max-width: 480px) {
  .input-wrapper {
    flex-direction: column;
  }

  .input-group {
    width: 100%;
    justify-content: center;
  }

  button {
    max-width: 100%;
  }

  .score-wrapper {
    gap: 1rem;
  }

  .total-score .number {
    font-size: 2.2rem;
  }

  .total-score .label {
    font-size: 1rem;
  }

  .luck-level {
    font-size: 1rem;
    padding: 0.3rem 0.8rem;
  }
}
</style> 