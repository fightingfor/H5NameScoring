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
                maxlength="2"
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
          {{ result.analysis.general }}
        </div>
      </div>

      <div class="history-section">
        <h2>历史记录</h2>
        <div class="history-list">
          <div
            v-for="(record, index) in historyRecords"
            :key="index"
            class="history-item"
          >
            <span class="history-name">{{ record.fullName }}</span>
            <div class="history-score">
              <span class="score">{{ record.score }}分</span>
              <span class="level">{{ record.level }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Analysis {
  general: string;
}

interface AnalysisResult {
  totalScore: number;
  luckLevel: string;
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
}

.input-group {
  display: flex;
  gap: 0.8rem;
  flex: 1;
}

.input-group input {
  width: 5em;
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
  gap: 1rem;
}

.score-card {
  background: rgba(255, 255, 255, 0.98);
  padding: 1.2rem;
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
  font-size: 3.2rem;
  font-weight: bold;
  color: #2c3e50;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.total-score .label {
  font-size: 1.4rem;
  color: #7f8c8d;
  margin-left: 0.3rem;
  font-weight: 500;
}

.luck-level {
  font-size: 1.3rem;
  font-weight: bold;
  padding: 0.4rem 1.2rem;
  border-radius: 20px;
  background: #3498db;
  color: white;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.analysis-content {
  background: rgba(255, 255, 255, 0.98);
  padding: 1.4rem;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  line-height: 1.8;
  font-size: 1.1rem;
  color: #2c3e50;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
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

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.history-item:hover {
  background-color: rgba(52, 152, 219, 0.05);
  transform: translateX(4px);
}

.history-item:last-child {
  border-bottom: none;
}

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
</style> 