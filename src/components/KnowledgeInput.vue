<template>
  <div class="knowledge-input">
    <div class="input-header">
      <h2>生物知识输入</h2>
      <p class="subtitle">输入生物教材章节、课程大纲或知识点文本，自动生成思维导图</p>
    </div>

    <div class="input-section">
      <div class="form-row">
        <div class="form-group half">
          <label for="module-select">📚 知识模块：</label>
          <select id="module-select" v-model="selectedModule" class="module-select">
            <option value="分子与细胞">分子与细胞</option>
            <option value="遗传与进化">遗传与进化</option>
            <option value="稳态与调节">稳态与调节</option>
            <option value="生物与环境">生物与环境</option>
          </select>
        </div>

        <div class="form-group half">
          <label for="level-select">🎓 学段水平：</label>
          <select id="level-select" v-model="userLevel" class="module-select">
            <option value="初中">初中（基础概念）</option>
            <option value="高中">高中（详细过程）</option>
            <option value="大学">大学（分子机制）</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="weak-topics">💡 薄弱知识点（可选）：</label>
        <input
          id="weak-topics"
          v-model="weakTopicsInput"
          type="text"
          placeholder="例如：有丝分裂后期、光合作用暗反应（用逗号分隔）"
          class="weak-input"
        />
        <div v-if="weakTopics.length > 0" class="weak-tags">
          <span v-for="(topic, index) in weakTopics" :key="index" class="weak-tag">
            {{ topic }}
            <button @click="removeWeakTopic(index)" class="remove-tag">×</button>
          </span>
        </div>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="enableImplicit" />
          <span>🔗 启用隐性关联挖掘（推荐）</span>
          <span class="hint">- 自动发现概念间的深层逻辑关系</span>
        </label>
      </div>

      <div class="form-group">
        <label for="knowledge-text">知识文本：</label>
        <textarea
          id="knowledge-text"
          v-model="knowledgeText"
          placeholder="请输入生物知识文本，例如：&#10;&#10;细胞是生物体的基本结构和功能单位。细胞由细胞膜、细胞质和细胞核组成。细胞质中含有多种细胞器，如线粒体、叶绿体、核糖体、内质网、高尔基体等。线粒体是有氧呼吸的主要场所，叶绿体是光合作用的场所。光合作用和呼吸作用在能量转化上互补..."
          rows="12"
          class="knowledge-textarea"
        ></textarea>
      </div>

      <div class="example-section">
        <h3>示例模板：</h3>
        <div class="example-buttons">
          <button @click="loadExample('cell')" class="example-btn">细胞结构</button>
          <button @click="loadExample('division')" class="example-btn">细胞分裂</button>
          <button @click="loadExample('genetics')" class="example-btn">遗传基础</button>
          <button @click="loadExample('photosynthesis')" class="example-btn">光合作用</button>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="generateMindMap" class="generate-btn" :disabled="!knowledgeText.trim()">
          <span class="btn-icon">🧬</span>
          生成思维导图
        </button>
        <button @click="clearInput" class="clear-btn">
          <span class="btn-icon">🗑️</span>
          清空内容
        </button>
      </div>
    </div>

    <div v-if="generatedData" class="result-info">
      <h3>生成结果：</h3>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">节点数量：</span>
          <span class="stat-value">{{ generatedData.metadata.totalNodes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">关联关系：</span>
          <span class="stat-value">{{ generatedData.metadata.totalLinks }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">所属模块：</span>
          <span class="stat-value">{{ generatedData.metadata.module }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KnowledgeInput',
  data() {
    return {
      selectedModule: '分子与细胞',
      userLevel: '高中',
      knowledgeText: '',
      weakTopicsInput: '',
      weakTopics: [],
      enableImplicit: true,
      generatedData: null,
      examples: {
        cell: `细胞是生物体的基本结构和功能单位。细胞由细胞膜、细胞质和细胞核组成。

细胞膜是细胞的边界，控制物质进出。细胞质中含有多种细胞器，包括线粒体、叶绿体、核糖体、内质网、高尔基体等。

线粒体是有氧呼吸的主要场所，为细胞提供能量。叶绿体是植物细胞特有的细胞器，是光合作用的场所。核糖体是蛋白质合成的场所。内质网参与物质的合成与运输。高尔基体负责物质的加工和分泌。

细胞核是遗传信息库，内含DNA和RNA。DNA是遗传物质，携带遗传信息。基因是DNA上具有遗传效应的片段。`,

        division: `细胞分裂是细胞增殖的方式，主要包括有丝分裂和减数分裂。

有丝分裂是体细胞的分裂方式，分为间期、前期、中期、后期和末期五个阶段。有丝分裂保持染色体数目恒定。

减数分裂是生殖细胞形成过程中的特殊分裂方式。减数分裂过程中，同源染色体分离，染色体数目减半。减数分裂形成配子，为有性生殖提供基础。`,

        genetics: `遗传的基本规律包括分离定律和自由组合定律。

基因位于染色体上，染色体是DNA的载体。DNA通过复制传递遗传信息，通过转录和翻译表达遗传信息。

基因表达的过程是：DNA转录形成RNA，RNA翻译形成蛋白质。蛋白质是生命活动的主要承担者。核糖体是蛋白质合成的场所。`,

        photosynthesis: `光合作用是植物、藻类等生物利用光能，将二氧化碳和水转化为有机物，并释放氧气的过程。

光合作用在叶绿体中进行，包括光反应和暗反应两个阶段。光反应在类囊体薄膜上进行，暗反应在叶绿体基质中进行。

呼吸作用是细胞分解有机物，释放能量的过程。有氧呼吸主要在线粒体中进行。光合作用和呼吸作用在能量转化上相互补充。`
      }
    };
  },
  methods: {
    loadExample(type) {
      this.knowledgeText = this.examples[type];
      if (type === 'cell') {
        this.selectedModule = '分子与细胞';
      } else if (type === 'division') {
        this.selectedModule = '分子与细胞';
      } else if (type === 'genetics') {
        this.selectedModule = '遗传与进化';
      } else if (type === 'photosynthesis') {
        this.selectedModule = '分子与细胞';
      }
    },

    generateMindMap() {
      if (!this.knowledgeText.trim()) {
        alert('请输入知识文本');
        return;
      }

      // 解析薄弱知识点
      if (this.weakTopicsInput.trim()) {
        this.weakTopics = this.weakTopicsInput.split(/[,，]/).map(t => t.trim()).filter(t => t);
      }

      const data = {
        text: this.knowledgeText,
        module: this.selectedModule,
        options: {
          userLevel: this.userLevel,
          weakTopics: this.weakTopics,
          enableImplicit: this.enableImplicit
        }
      };

      this.$emit('generate', data);
    },

    removeWeakTopic(index) {
      this.weakTopics.splice(index, 1);
      this.weakTopicsInput = this.weakTopics.join('，');
    },

    clearInput() {
      this.knowledgeText = '';
      this.generatedData = null;
    },

    setGeneratedData(data) {
      this.generatedData = data;
    }
  }
};
</script>

<style scoped>
.knowledge-input {
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 900px;
  margin: 0 auto;
}

.input-header {
  text-align: center;
  margin-bottom: 30px;
}

.input-header h2 {
  color: #2196f3;
  margin: 0 0 10px 0;
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.input-section {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group.half {
  flex: 1;
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

.weak-input {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.weak-input:focus {
  outline: none;
  border-color: #2196f3;
}

.weak-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.weak-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: #fff3e0;
  color: #e65100;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.remove-tag {
  background: none;
  border: none;
  color: #e65100;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
}

.remove-tag:hover {
  background: rgba(230, 81, 0, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  transition: background 0.3s;
}

.checkbox-label:hover {
  background: #e9ecef;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label span {
  font-size: 14px;
  color: #333;
}

.hint {
  color: #666;
  font-size: 12px;
  font-weight: normal;
}

.module-select {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.module-select:focus {
  outline: none;
  border-color: #2196f3;
}

.knowledge-textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
  line-height: 1.6;
}

.knowledge-textarea:focus {
  outline: none;
  border-color: #2196f3;
}

.example-section {
  margin: 25px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.example-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.example-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.example-btn {
  padding: 8px 16px;
  background: white;
  border: 2px solid #2196f3;
  color: #2196f3;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.example-btn:hover {
  background: #2196f3;
  color: white;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

.generate-btn,
.clear-btn {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-btn {
  background: #f5f5f5;
  color: #666;
}

.clear-btn:hover {
  background: #e0e0e0;
}

.btn-icon {
  font-size: 20px;
}

.result-info {
  margin-top: 30px;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.result-info h3 {
  margin: 0 0 15px 0;
  color: #1976d2;
  font-size: 16px;
}

.stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  color: #2196f3;
  font-weight: 600;
  font-size: 16px;
}
</style>
