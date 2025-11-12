<template>
  <div class="mind-map-viewer">
    <div class="toolbar">
      <button @click="zoomIn">放大 +</button>
      <button @click="zoomOut">缩小 -</button>
      <button @click="resetView">重置视图</button>
      <button @click="toggleExpandAll">{{ allExpanded ? '全部折叠' : '全部展开' }}</button>
    </div>

    <div class="map-container" ref="mapContainer">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        @mousedown="startPan"
        @mousemove="doPan"
        @mouseup="endPan"
        @mouseleave="endPan"
      >
        <!-- 定义箭头标记 -->
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#999" />
          </marker>
        </defs>

        <!-- 绘制关联线 -->
        <g :transform="transformString">
          <g v-for="link in visibleLinks" :key="`${link.source}-${link.target}`">
            <line
              :x1="getNodePosition(link.source).x"
              :y1="getNodePosition(link.source).y"
              :x2="getNodePosition(link.target).x"
              :y2="getNodePosition(link.target).y"
              stroke="#999"
              stroke-width="2"
              stroke-dasharray="5,5"
              marker-end="url(#arrowhead)"
            />
            <text
              :x="(getNodePosition(link.source).x + getNodePosition(link.target).x) / 2"
              :y="(getNodePosition(link.source).y + getNodePosition(link.target).y) / 2 - 5"
              class="link-label"
              text-anchor="middle"
            >
              {{ link.label }}
            </text>
          </g>

          <!-- 绘制节点 -->
          <g v-for="node in visibleNodes" :key="node.id">
            <g :transform="`translate(${node.x}, ${node.y})`">
              <!-- 节点背景 -->
              <rect
                :width="getNodeWidth(node)"
                :height="nodeHeight"
                :x="-getNodeWidth(node) / 2"
                :y="-nodeHeight / 2"
                :rx="8"
                :fill="node.hasMistakes ? '#ffebee' : getNodeColor(node.level)"
                :stroke="selectedNode === node.id ? '#ff6b6b' : (node.hasMistakes ? '#f44336' : '#333')"
                :stroke-width="selectedNode === node.id ? 3 : (node.hasMistakes ? 2 : 1)"
                class="node-rect"
                :class="{ 'mistake-node': node.hasMistakes, 'supplement-node': node.isSupplement }"
                @click="selectNode(node)"
              />

              <!-- 易错点标记 -->
              <text
                v-if="node.hasMistakes"
                :x="getNodeWidth(node) / 2 - 15"
                :y="-nodeHeight / 2 + 15"
                class="mistake-badge"
              >
                ⚠️
              </text>

              <!-- 优先级标记 -->
              <text
                v-if="node.priority"
                :x="-getNodeWidth(node) / 2 + 10"
                :y="-nodeHeight / 2 + 15"
                class="priority-text"
                :class="getPriorityClass(node.priority)"
              >
                {{ node.priority === '基础级' ? '基' : node.priority === '重点级' ? '重' : '拓' }}
              </text>

              <!-- 节点文本 -->
              <text
                text-anchor="middle"
                y="-8"
                class="node-name"
                @click="selectNode(node)"
              >
                {{ node.name }}
              </text>

              <!-- 节点定义 -->
              <text
                text-anchor="middle"
                y="8"
                class="node-definition"
                @click="selectNode(node)"
              >
                {{ truncateText(node.definition, 15) }}
              </text>

              <!-- 展开/折叠按钮 -->
              <circle
                v-if="hasChildren(node.id)"
                :cy="nodeHeight / 2 + 15"
                r="10"
                fill="#4CAF50"
                class="expand-btn"
                @click="toggleExpand(node)"
              />
              <text
                v-if="hasChildren(node.id)"
                :y="nodeHeight / 2 + 15"
                dy="4"
                text-anchor="middle"
                class="expand-icon"
                @click="toggleExpand(node)"
              >
                {{ node.expanded ? '-' : '+' }}
              </text>
            </g>
          </g>
        </g>
      </svg>

      <!-- 节点详情面板 -->
      <div v-if="selectedNodeData" class="detail-panel">
        <div class="detail-header">
          <h3>{{ selectedNodeData.name }}</h3>
          <button @click="closeDetail">×</button>
        </div>
        <div class="detail-content">
          <p><strong>定义：</strong>{{ selectedNodeData.definition }}</p>
          <p><strong>所属模块：</strong>{{ selectedNodeData.module }}</p>
          <p><strong>层级：</strong>第 {{ selectedNodeData.level }} 层</p>

          <!-- 学习优先级 -->
          <div v-if="selectedNodeData.priority" class="priority-badge" :class="getPriorityClass(selectedNodeData.priority)">
            {{ selectedNodeData.priority }}
          </div>

          <!-- 易错点提示 -->
          <div v-if="selectedNodeData.hasMistakes" class="mistakes-section">
            <h4>⚠️ 易错点提示</h4>
            <div v-for="(mistake, index) in selectedNodeData.mistakes" :key="index" class="mistake-item">
              <p class="mistake-wrong">❌ {{ mistake.mistake }}</p>
              <p class="mistake-correct">✅ {{ mistake.correct }}</p>
              <p class="mistake-example">💡 {{ mistake.example }}</p>
            </div>
          </div>

          <!-- 智能推荐 -->
          <div v-if="recommendations.length > 0" class="recommendations-section">
            <h4>🔗 智能推荐</h4>
            <div v-for="(rec, index) in recommendations" :key="index" class="recommendation-item">
              <div class="rec-header">
                <span class="rec-name" @click="jumpToNode(rec.node.id)">{{ rec.node.name }}</span>
                <span class="rec-priority" :class="getPriorityClass(rec.priority)">{{ rec.priority }}</span>
              </div>
              <p class="rec-reason">{{ rec.reason }}</p>
              <span class="rec-type">{{ getRecTypeLabel(rec.type) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MindMapViewer',
  props: {
    mindMapData: {
      type: Object,
      required: true,
      default: () => ({ nodes: [], links: [] })
    }
  },
  data() {
    return {
      svgWidth: 1200,
      svgHeight: 800,
      nodeHeight: 60,
      nodeBaseWidth: 120,
      levelSpacing: 200,
      nodeSpacing: 100,
      scale: 1,
      translateX: 0,
      translateY: 0,
      isPanning: false,
      panStartX: 0,
      panStartY: 0,
      selectedNode: null,
      allExpanded: true,
      nodePositions: {},
      recommendations: []
    };
  },
  computed: {
    visibleNodes() {
      if (!this.mindMapData.nodes) return [];
      return this.mindMapData.nodes.filter(node => this.isNodeVisible(node));
    },
    visibleLinks() {
      if (!this.mindMapData.links) return [];
      return this.mindMapData.links.filter(link => {
        const sourceVisible = this.visibleNodes.find(n => n.id === link.source);
        const targetVisible = this.visibleNodes.find(n => n.id === link.target);
        return sourceVisible && targetVisible;
      });
    },
    selectedNodeData() {
      if (!this.selectedNode) return null;
      return this.mindMapData.nodes.find(n => n.id === this.selectedNode);
    },
    transformString() {
      return `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`;
    }
  },
  mounted() {
    this.calculateLayout();
    this.centerView();
  },
  watch: {
    mindMapData: {
      deep: true,
      handler() {
        this.calculateLayout();
      }
    }
  },
  methods: {
    calculateLayout() {
      if (!this.mindMapData.nodes || this.mindMapData.nodes.length === 0) return;

      const nodes = this.mindMapData.nodes;
      const levelGroups = {};

      // 按层级分组
      nodes.forEach(node => {
        if (!levelGroups[node.level]) {
          levelGroups[node.level] = [];
        }
        levelGroups[node.level].push(node);
      });

      // 计算每个节点的位置
      Object.keys(levelGroups).forEach(level => {
        const nodesInLevel = levelGroups[level];
        const levelY = parseInt(level) * this.levelSpacing + 100;

        nodesInLevel.forEach((node, index) => {
          const totalWidth = nodesInLevel.length * (this.nodeBaseWidth + this.nodeSpacing);
          const startX = (this.svgWidth - totalWidth) / 2;
          const nodeX = startX + index * (this.nodeBaseWidth + this.nodeSpacing) + this.nodeBaseWidth / 2;

          this.$set(node, 'x', nodeX);
          this.$set(node, 'y', levelY);
          this.nodePositions[node.id] = { x: nodeX, y: levelY };
        });
      });
    },

    getNodePosition(nodeId) {
      return this.nodePositions[nodeId] || { x: 0, y: 0 };
    },

    getNodeWidth(node) {
      const textLength = node.name.length;
      return Math.max(this.nodeBaseWidth, textLength * 12 + 40);
    },

    getNodeColor(level) {
      const colors = ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3'];
      return colors[level % colors.length];
    },

    isNodeVisible(node) {
      if (node.level === 0) return true;
      if (!node.parentId) return true;

      const parent = this.mindMapData.nodes.find(n => n.id === node.parentId);
      if (!parent) return true;

      return parent.expanded !== false && this.isNodeVisible(parent);
    },

    hasChildren(nodeId) {
      return this.mindMapData.nodes.some(n => n.parentId === nodeId);
    },

    toggleExpand(node) {
      this.$set(node, 'expanded', !node.expanded);
      this.calculateLayout();
    },

    toggleExpandAll() {
      this.allExpanded = !this.allExpanded;
      this.mindMapData.nodes.forEach(node => {
        if (this.hasChildren(node.id)) {
          this.$set(node, 'expanded', this.allExpanded);
        }
      });
      this.calculateLayout();
    },

    selectNode(node) {
      this.selectedNode = node.id;
      this.$emit('node-selected', node);

      // 获取智能推荐
      this.loadRecommendations(node);
    },

    closeDetail() {
      this.selectedNode = null;
      this.recommendations = [];
    },

    loadRecommendations(node) {
      // 通过事件请求推荐数据
      this.$emit('request-recommendations', node.id);
    },

    setRecommendations(recs) {
      this.recommendations = recs;
    },

    jumpToNode(nodeId) {
      const node = this.mindMapData.nodes.find(n => n.id === nodeId);
      if (node) {
        this.selectNode(node);
        // 滚动到节点位置
        const pos = this.getNodePosition(nodeId);
        this.translateX = this.svgWidth / 2 - pos.x * this.scale;
        this.translateY = this.svgHeight / 2 - pos.y * this.scale;
      }
    },

    getPriorityClass(priority) {
      const map = {
        'high': 'priority-high',
        'medium': 'priority-medium',
        'low': 'priority-low',
        '基础级': 'priority-basic',
        '重点级': 'priority-key',
        '拓展级': 'priority-extend'
      };
      return map[priority] || 'priority-medium';
    },

    getRecTypeLabel(type) {
      const labels = {
        'direct': '直接关联',
        'implicit': '隐性关联',
        'sibling': '同层概念'
      };
      return labels[type] || type;
    },

    truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },

    zoomIn() {
      this.scale = Math.min(this.scale * 1.2, 3);
    },

    zoomOut() {
      this.scale = Math.max(this.scale / 1.2, 0.3);
    },

    resetView() {
      this.scale = 1;
      this.centerView();
    },

    centerView() {
      this.translateX = 0;
      this.translateY = 0;
    },

    startPan(event) {
      this.isPanning = true;
      this.panStartX = event.clientX - this.translateX;
      this.panStartY = event.clientY - this.translateY;
    },

    doPan(event) {
      if (!this.isPanning) return;
      this.translateX = event.clientX - this.panStartX;
      this.translateY = event.clientY - this.panStartY;
    },

    endPan() {
      this.isPanning = false;
    }
  }
};
</script>

<style scoped>
.mind-map-viewer {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.toolbar {
  padding: 15px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  gap: 10px;
}

.toolbar button {
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.toolbar button:hover {
  background: #1976d2;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
}

svg {
  cursor: grab;
}

svg:active {
  cursor: grabbing;
}

.node-rect {
  cursor: pointer;
  transition: all 0.3s;
}

.node-rect:hover {
  filter: brightness(0.95);
  stroke-width: 2;
}

.mistake-node {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.supplement-node {
  stroke-dasharray: 5,5;
}

.mistake-badge {
  font-size: 16px;
  pointer-events: none;
}

.priority-text {
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
}

.node-name {
  font-size: 14px;
  font-weight: bold;
  fill: #333;
  pointer-events: none;
}

.node-definition {
  font-size: 11px;
  fill: #666;
  pointer-events: none;
}

.link-label {
  font-size: 10px;
  fill: #666;
  background: white;
  padding: 2px 4px;
}

.expand-btn {
  cursor: pointer;
  transition: all 0.3s;
}

.expand-btn:hover {
  fill: #45a049;
  transform: scale(1.1);
}

.expand-icon {
  font-size: 16px;
  font-weight: bold;
  fill: white;
  cursor: pointer;
  pointer-events: none;
}

.detail-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.detail-header {
  padding: 15px;
  background: #2196f3;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
}

.detail-header button {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
}

.detail-header button:hover {
  background: rgba(255,255,255,0.2);
}

.detail-content {
  padding: 15px;
}

.detail-content p {
  margin: 10px 0;
  line-height: 1.6;
  color: #333;
}

.detail-content strong {
  color: #2196f3;
}

.priority-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 10px;
}

.priority-high, .priority-key {
  background: #ffebee;
  color: #c62828;
}

.priority-medium, .priority-basic {
  background: #e3f2fd;
  color: #1565c0;
}

.priority-low, .priority-extend {
  background: #f3e5f5;
  color: #6a1b9a;
}

.mistakes-section {
  margin-top: 15px;
  padding: 15px;
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  border-radius: 4px;
}

.mistakes-section h4 {
  margin: 0 0 10px 0;
  color: #e65100;
  font-size: 14px;
}

.mistake-item {
  margin-bottom: 12px;
  padding: 10px;
  background: white;
  border-radius: 4px;
}

.mistake-wrong {
  color: #d32f2f;
  margin: 5px 0;
  font-size: 13px;
}

.mistake-correct {
  color: #388e3c;
  margin: 5px 0;
  font-size: 13px;
}

.mistake-example {
  color: #1976d2;
  margin: 5px 0;
  font-size: 12px;
  font-style: italic;
}

.recommendations-section {
  margin-top: 15px;
  padding: 15px;
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
}

.recommendations-section h4 {
  margin: 0 0 10px 0;
  color: #2e7d32;
  font-size: 14px;
}

.recommendation-item {
  margin-bottom: 12px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recommendation-item:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.rec-name {
  font-weight: 600;
  color: #1976d2;
  cursor: pointer;
  text-decoration: underline;
}

.rec-name:hover {
  color: #0d47a1;
}

.rec-priority {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.rec-reason {
  margin: 5px 0;
  font-size: 13px;
  color: #555;
}

.rec-type {
  display: inline-block;
  padding: 2px 8px;
  background: #e0e0e0;
  color: #616161;
  border-radius: 8px;
  font-size: 11px;
}
</style>

