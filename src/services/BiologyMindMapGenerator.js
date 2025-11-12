/**
 * 智能生物知识网络思维导图生成器（AI驱动版）
 * 将生物学知识文本转化为结构化、智能关联的思维导图数据
 * 支持动态适配、隐性关联挖掘、易错点识别等AI功能
 */

import BiologyReasoningEngine from './BiologyReasoningEngine.js';

class BiologyMindMapGenerator {
  constructor() {
    // 初始化智能推理引擎
    this.reasoningEngine = new BiologyReasoningEngine();
    // 生物学知识模块分类
    this.modules = {
      '分子与细胞': ['细胞的分子组成', '细胞的基本结构', '细胞的物质输入和输出', '细胞的能量供应和利用', '细胞的生命历程'],
      '遗传与进化': ['遗传的细胞基础', '遗传的分子基础', '基因的表达', '生物的变异', '人类遗传病', '生物的进化'],
      '稳态与调节': ['植物的激素调节', '动物生命活动的调节', '人体的内环境与稳态', '免疫调节'],
      '生物与环境': ['种群和群落', '生态系统', '生态环境的保护']
    };

    // 概念关系类型
    this.relationTypes = {
      CAUSE: '因果关系',
      COMPARE: '对比关系',
      COOPERATE: '协同关系',
      INCLUDE: '包含关系',
      PROCESS: '过程关系'
    };
  }

  /**
   * 生成智能思维导图数据（AI驱动版）
   * @param {string} knowledgeText - 生物知识文本
   * @param {string} module - 所属模块
   * @param {Object} options - 配置选项
   * @param {string} options.userLevel - 用户学段（初中/高中/大学）
   * @param {Array} options.weakTopics - 薄弱知识点
   * @param {boolean} options.enableImplicit - 是否启用隐性关联
   * @returns {Object} 思维导图数据 {nodes, links, recommendations}
   */
  generate(knowledgeText, module = '分子与细胞', options = {}) {
    const {
      userLevel = '高中',
      weakTopics = [],
      enableImplicit = true
    } = options;

    // 1. 提取概念
    let concepts = this.extractConcepts(knowledgeText, module);

    // 2. 识别易错点
    concepts = this.reasoningEngine.identifyMistakes(concepts);

    // 3. 构建层级结构
    let hierarchy = this.buildHierarchy(concepts);

    // 4. 根据学段调整层级深度
    hierarchy = this.reasoningEngine.adjustDepthByLevel(hierarchy, userLevel);

    // 5. 为每个节点计算学习优先级
    hierarchy = hierarchy.map(node => ({
      ...node,
      priority: this.reasoningEngine.calculatePriority(node, userLevel)
    }));

    // 6. 识别显性关联
    let links = this.identifyRelations(concepts);

    // 7. 挖掘隐性关联
    if (enableImplicit) {
      const implicitLinks = this.reasoningEngine.mineImplicitRelations(hierarchy);
      links = [...links, ...implicitLinks];
    }

    // 8. 生成对比关联
    const comparisonLinks = this.reasoningEngine.generateComparisons(hierarchy);
    links = [...links, ...comparisonLinks];

    return {
      nodes: hierarchy,
      links: links,
      metadata: {
        module: module,
        userLevel: userLevel,
        generatedAt: new Date().toISOString(),
        totalNodes: hierarchy.length,
        totalLinks: links.length,
        implicitLinksCount: links.filter(l => l.implicit).length,
        comparisonLinksCount: links.filter(l => l.isComparison).length
      },
      aiFeatures: {
        enableImplicit: enableImplicit,
        weakTopics: weakTopics,
        mistakeNodes: hierarchy.filter(n => n.hasMistakes).length
      }
    };
  }

  /**
   * 从文本中提取生物概念
   * @param {string} text - 输入文本
   * @param {string} module - 所属模块
   * @returns {Array} 概念数组
   */
  extractConcepts(text, module) {
    // 这里使用简化的关键词匹配，实际应用可接入NLP或AI模型
    const concepts = [];
    let idCounter = 1;

    // 预定义的生物概念库（示例）
    const conceptPatterns = [
      { name: '细胞', definition: '生物体基本结构单位', keywords: ['细胞', '细胞结构'] },
      { name: '细胞膜', definition: '细胞边界', keywords: ['细胞膜', '质膜'] },
      { name: '细胞质', definition: '细胞膜内的物质', keywords: ['细胞质', '胞质'] },
      { name: '细胞核', definition: '遗传信息库', keywords: ['细胞核', '核膜'] },
      { name: '线粒体', definition: '有氧呼吸主要场所', keywords: ['线粒体'] },
      { name: '叶绿体', definition: '光合作用场所', keywords: ['叶绿体'] },
      { name: '核糖体', definition: '蛋白质合成场所', keywords: ['核糖体'] },
      { name: '内质网', definition: '物质合成与运输', keywords: ['内质网'] },
      { name: '高尔基体', definition: '物质加工与分泌', keywords: ['高尔基体'] },
      { name: 'DNA', definition: '遗传物质', keywords: ['DNA', '脱氧核糖核酸'] },
      { name: 'RNA', definition: '核糖核酸', keywords: ['RNA', '核糖核酸'] },
      { name: '蛋白质', definition: '生命活动主要承担者', keywords: ['蛋白质', '多肽'] },
      { name: '酶', definition: '生物催化剂', keywords: ['酶', '催化'] },
      { name: '光合作用', definition: '光能转化为化学能', keywords: ['光合作用', '光反应', '暗反应'] },
      { name: '呼吸作用', definition: '分解有机物释放能量', keywords: ['呼吸作用', '有氧呼吸', '无氧呼吸'] },
      { name: '有丝分裂', definition: '体细胞分裂方式', keywords: ['有丝分裂', '间期', '前期', '中期', '后期', '末期'] },
      { name: '减数分裂', definition: '生殖细胞形成', keywords: ['减数分裂', '同源染色体'] },
      { name: '基因', definition: '遗传信息单位', keywords: ['基因', '等位基因'] },
      { name: '染色体', definition: 'DNA载体', keywords: ['染色体', '染色质'] },
      { name: '遗传定律', definition: '遗传规律', keywords: ['分离定律', '自由组合定律'] }
    ];

    // 匹配概念
    conceptPatterns.forEach(pattern => {
      const matched = pattern.keywords.some(keyword => text.includes(keyword));
      if (matched) {
        concepts.push({
          id: `c${idCounter++}`,
          name: pattern.name,
          definition: pattern.definition,
          module: module,
          level: 0, // 将在buildHierarchy中确定
          expandable: true,
          clickable: true
        });
      }
    });

    return concepts;
  }

  /**
   * 构建层级结构
   * @param {Array} concepts - 概念数组
   * @returns {Array} 带层级关系的节点数组
   */
  buildHierarchy(concepts) {
    const nodes = [];
    
    // 添加根节点
    const rootNode = {
      id: 'm1',
      name: '生物学',
      definition: '研究生命现象的科学',
      module: '总纲',
      level: 0,
      parentId: null,
      expandable: true,
      clickable: true,
      expanded: true
    };
    nodes.push(rootNode);

    // 根据概念名称判断层级关系
    const hierarchyRules = {
      '细胞': { parentName: '生物学', level: 1 },
      '细胞膜': { parentName: '细胞', level: 2 },
      '细胞质': { parentName: '细胞', level: 2 },
      '细胞核': { parentName: '细胞', level: 2 },
      '线粒体': { parentName: '细胞质', level: 3 },
      '叶绿体': { parentName: '细胞质', level: 3 },
      '核糖体': { parentName: '细胞质', level: 3 },
      '内质网': { parentName: '细胞质', level: 3 },
      '高尔基体': { parentName: '细胞质', level: 3 },
    };

    // 为每个概念分配父节点
    concepts.forEach(concept => {
      const rule = hierarchyRules[concept.name];
      if (rule) {
        const parent = nodes.find(n => n.name === rule.parentName);
        if (parent) {
          concept.parentId = parent.id;
          concept.level = rule.level;
        }
      } else {
        // 默认挂在根节点下
        concept.parentId = 'm1';
        concept.level = 1;
      }
      nodes.push(concept);
    });

    return nodes;
  }

  /**
   * 识别概念间的关联关系
   * @param {Array} concepts - 概念数组
   * @returns {Array} 关联关系数组
   */
  identifyRelations(concepts) {
    const links = [];
    
    // 预定义的关联关系规则
    const relationRules = [
      { source: '光合作用', target: '叶绿体', label: '发生场所', type: 'INCLUDE' },
      { source: '呼吸作用', target: '线粒体', label: '主要场所', type: 'INCLUDE' },
      { source: '光合作用', target: '呼吸作用', label: '能量转化互补', type: 'COOPERATE' },
      { source: '有丝分裂', target: '减数分裂', label: '分裂方式对比', type: 'COMPARE' },
      { source: 'DNA', target: '基因', label: '包含关系', type: 'INCLUDE' },
      { source: '基因', target: '蛋白质', label: '表达产物', type: 'PROCESS' },
      { source: '染色体', target: 'DNA', label: '载体关系', type: 'INCLUDE' },
      { source: '核糖体', target: '蛋白质', label: '合成场所', type: 'PROCESS' }
    ];

    // 匹配关联关系
    relationRules.forEach(rule => {
      const sourceNode = concepts.find(c => c.name === rule.source);
      const targetNode = concepts.find(c => c.name === rule.target);
      
      if (sourceNode && targetNode) {
        links.push({
          source: sourceNode.id,
          target: targetNode.id,
          label: rule.label,
          type: rule.type
        });
      }
    });

    return links;
  }

  /**
   * 获取节点的智能推荐
   * @param {string} nodeId - 节点ID
   * @param {Object} mindMapData - 完整的思维导图数据
   * @returns {Array} 推荐节点数组
   */
  getRecommendations(nodeId, mindMapData) {
    const currentNode = mindMapData.nodes.find(n => n.id === nodeId);
    if (!currentNode) return [];

    return this.reasoningEngine.recommendNodes(
      currentNode,
      mindMapData.nodes,
      mindMapData.links
    );
  }

  /**
   * 动态扩展节点（基于用户问题）
   * @param {string} nodeId - 父节点ID
   * @param {string} userQuestion - 用户问题
   * @param {Object} mindMapData - 当前思维导图数据
   * @returns {Object} 更新后的思维导图数据
   */
  expandNodeDynamically(nodeId, userQuestion, mindMapData) {
    const parentNode = mindMapData.nodes.find(n => n.id === nodeId);
    if (!parentNode) return mindMapData;

    // 使用推理引擎生成扩展节点
    const expansions = this.reasoningEngine.expandNode(parentNode, userQuestion);

    return {
      ...mindMapData,
      nodes: [...mindMapData.nodes, ...expansions],
      metadata: {
        ...mindMapData.metadata,
        totalNodes: mindMapData.nodes.length + expansions.length,
        lastExpanded: new Date().toISOString()
      }
    };
  }

  /**
   * 根据薄弱点生成补充内容
   * @param {Array} weakTopics - 薄弱知识点列表
   * @param {Object} mindMapData - 当前思维导图数据
   * @returns {Object} 更新后的思维导图数据
   */
  supplementWeakTopics(weakTopics, mindMapData) {
    let supplements = [];

    weakTopics.forEach(topic => {
      const newSupplements = this.reasoningEngine.generateSupplementNodes(
        topic,
        mindMapData.nodes
      );
      supplements = [...supplements, ...newSupplements];
    });

    return {
      ...mindMapData,
      nodes: [...mindMapData.nodes, ...supplements],
      metadata: {
        ...mindMapData.metadata,
        totalNodes: mindMapData.nodes.length + supplements.length,
        supplementsCount: supplements.length
      }
    };
  }
}

export default BiologyMindMapGenerator;

