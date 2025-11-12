<template>
  <div id="app">
    <header class="app-header">
      <h1>🧬 生物知识网络思维导图生成器</h1>
      <p class="app-subtitle">将生物学知识转化为可视化思维导图，帮助学生直观理解概念关联</p>
    </header>

    <div class="app-container">
      <div class="input-panel" :class="{ collapsed: showMindMap }">
        <button v-if="showMindMap" @click="togglePanel" class="toggle-btn">
          {{ panelCollapsed ? '展开输入面板 ▼' : '收起输入面板 ▲' }}
        </button>
        <KnowledgeInput
          ref="knowledgeInput"
          @generate="handleGenerate"
          v-show="!panelCollapsed"
        />
      </div>

      <div v-if="showMindMap" class="mindmap-panel">
        <div class="panel-header">
          <h2>思维导图可视化</h2>
          <button @click="backToInput" class="back-btn">← 返回编辑</button>
        </div>
        <MindMapViewer
          ref="mindMapViewer"
          :mindMapData="mindMapData"
          @node-selected="handleNodeSelected"
          @request-recommendations="handleRecommendationRequest"
        />
      </div>

      <div v-else class="welcome-section">
        <div class="welcome-content">
          <div class="welcome-icon">🔬</div>
          <h2>欢迎使用生物知识思维导图生成器</h2>
          <p>本工具可以帮助您：</p>
          <ul class="feature-list">
            <li>✅ 自动提取生物学核心概念</li>
            <li>✅ 构建清晰的知识层级结构</li>
            <li>✅ 识别概念间的关联关系</li>
            <li>✅ 生成可交互的可视化思维导图</li>
          </ul>
          <p class="tip">👆 请在上方输入生物知识文本，或选择示例模板开始体验</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KnowledgeInput from './components/KnowledgeInput.vue';
import MindMapViewer from './components/MindMapViewer.vue';
import BiologyMindMapGenerator from './services/BiologyMindMapGenerator.js';

export default {
  name: 'App',
  components: {
    KnowledgeInput,
    MindMapViewer
  },
  data() {
    return {
      mindMapData: null,
      showMindMap: false,
      panelCollapsed: false,
      generator: null
    };
  },
  created() {
    this.generator = new BiologyMindMapGenerator();
  },
  methods: {
    handleGenerate(data) {
      // 使用智能生成器生成思维导图数据（支持AI功能）
      const result = this.generator.generate(data.text, data.module, data.options);

      this.mindMapData = result;
      this.showMindMap = true;

      // 更新输入组件的生成结果信息
      this.$nextTick(() => {
        if (this.$refs.knowledgeInput) {
          this.$refs.knowledgeInput.setGeneratedData(result);
        }
      });
    },

    handleNodeSelected(node) {
      console.log('选中节点:', node);
    },

    handleRecommendationRequest(nodeId) {
      if (!this.generator || !this.mindMapData) return;

      // 获取智能推荐
      const recommendations = this.generator.getRecommendations(nodeId, this.mindMapData);

      // 将推荐数据传递给MindMapViewer
      if (this.$refs.mindMapViewer) {
        this.$refs.mindMapViewer.setRecommendations(recommendations);
      }
    },

    backToInput() {
      this.showMindMap = false;
      this.panelCollapsed = false;
    },

    togglePanel() {
      this.panelCollapsed = !this.panelCollapsed;
    }
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: white;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.app-header h1 {
  color: #2196f3;
  font-size: 32px;
  margin-bottom: 10px;
}

.app-subtitle {
  color: #666;
  font-size: 16px;
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.input-panel {
  margin-bottom: 30px;
  transition: all 0.3s ease;
}

.input-panel.collapsed {
  margin-bottom: 10px;
}

.toggle-btn {
  width: 100%;
  padding: 12px;
  background: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #2196f3;
  margin-bottom: 15px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toggle-btn:hover {
  background: #f5f5f5;
}

.mindmap-panel {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.panel-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 24px;
}

.back-btn {
  padding: 10px 20px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.back-btn:hover {
  transform: translateX(-3px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.welcome-section {
  background: white;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.welcome-content {
  max-width: 600px;
  margin: 0 auto;
}

.welcome-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.welcome-section h2 {
  color: #333;
  font-size: 28px;
  margin-bottom: 20px;
}

.welcome-section p {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
}

.feature-list {
  list-style: none;
  text-align: left;
  display: inline-block;
  margin: 20px 0;
}

.feature-list li {
  padding: 10px 0;
  font-size: 16px;
  color: #333;
}

.tip {
  margin-top: 30px;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 8px;
  color: #1976d2;
  font-weight: 600;
}
</style>
