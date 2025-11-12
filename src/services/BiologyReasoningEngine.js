/**
 * 生物学智能推理引擎
 * 实现隐性关联推理、对比分析、易错点识别等AI驱动功能
 */

class BiologyReasoningEngine {
  constructor() {
    // 隐性关联知识库
    this.implicitRelations = {
      '线粒体': [
        { target: '主动运输', reason: '线粒体产生的ATP为主动运输供能', type: 'ENERGY_SUPPLY', priority: 'high' },
        { target: '细胞凋亡', reason: '线粒体释放细胞色素c触发凋亡', type: 'SIGNAL', priority: 'medium' },
        { target: '有氧呼吸', reason: '有氧呼吸的主要场所', type: 'LOCATION', priority: 'high' },
        { target: '内共生学说', reason: '双层膜结构支持内共生起源假说', type: 'EVOLUTION', priority: 'medium' }
      ],
      '叶绿体': [
        { target: '光合作用', reason: '光合作用的场所', type: 'LOCATION', priority: 'high' },
        { target: '线粒体', reason: '光合作用产生的有机物在线粒体中分解', type: 'COOPERATE', priority: 'high' },
        { target: '内共生学说', reason: '双层膜结构支持内共生起源假说', type: 'EVOLUTION', priority: 'medium' },
        { target: 'CO₂浓度', reason: '暗反应需要CO₂作为原料', type: 'MATERIAL', priority: 'medium' }
      ],
      '光合作用': [
        { target: '呼吸作用', reason: 'O₂和CO₂互为原料和产物，能量转化互补', type: 'COOPERATE', priority: 'high' },
        { target: 'ATP', reason: '光反应产生ATP供暗反应使用', type: 'ENERGY', priority: 'high' },
        { target: '光照强度', reason: '光反应速率受光照强度影响', type: 'FACTOR', priority: 'medium' }
      ],
      '呼吸作用': [
        { target: '光合作用', reason: 'CO₂和O₂互为原料和产物', type: 'COOPERATE', priority: 'high' },
        { target: 'ATP', reason: '有氧呼吸产生大量ATP', type: 'ENERGY', priority: 'high' },
        { target: '温度', reason: '酶活性受温度影响', type: 'FACTOR', priority: 'medium' }
      ],
      '基因': [
        { target: 'DNA', reason: '基因是DNA上具有遗传效应的片段', type: 'INCLUDE', priority: 'high' },
        { target: '蛋白质', reason: '基因通过表达控制蛋白质合成', type: 'EXPRESSION', priority: 'high' },
        { target: '性状', reason: '基因控制生物性状', type: 'CONTROL', priority: 'high' },
        { target: '突变', reason: '基因突变是生物变异的根本来源', type: 'VARIATION', priority: 'medium' }
      ],
      '有丝分裂': [
        { target: '减数分裂', reason: '染色体行为不同：有丝分裂染色体数目不变，减数分裂减半', type: 'COMPARE', priority: 'high' },
        { target: '细胞周期', reason: '有丝分裂是细胞周期的M期', type: 'INCLUDE', priority: 'medium' },
        { target: '染色体', reason: '染色体复制、分离是有丝分裂的核心', type: 'CORE', priority: 'high' }
      ],
      '减数分裂': [
        { target: '有丝分裂', reason: '对比：减数分裂染色体数目减半，有丝分裂不变', type: 'COMPARE', priority: 'high' },
        { target: '配子', reason: '减数分裂形成配子', type: 'PRODUCT', priority: 'high' },
        { target: '基因重组', reason: '减数分裂过程中发生基因重组', type: 'PROCESS', priority: 'high' }
      ]
    };

    // 易混淆概念对比库
    this.confusableComparisons = [
      {
        concepts: ['极体', '极核'],
        differences: [
          { aspect: '来源', detail: '极体来自卵原细胞减数分裂；极核来自胚囊细胞有丝分裂' },
          { aspect: '染色体数', detail: '极体为n；极核为n' },
          { aspect: '功能', detail: '极体退化消失；极核参与受精形成胚乳' },
          { aspect: '位置', detail: '极体在卵细胞外；极核在胚囊中央' }
        ],
        commonMistake: '混淆两者的来源和功能'
      },
      {
        concepts: ['有丝分裂', '减数分裂'],
        differences: [
          { aspect: '染色体数目变化', detail: '有丝分裂：2n→2n；减数分裂：2n→n' },
          { aspect: '分裂次数', detail: '有丝分裂：1次；减数分裂：2次' },
          { aspect: '同源染色体行为', detail: '有丝分裂：不配对；减数分裂：配对、分离' },
          { aspect: '发生部位', detail: '有丝分裂：体细胞；减数分裂：生殖细胞' },
          { aspect: '结果', detail: '有丝分裂：2个子细胞；减数分裂：4个配子' }
        ],
        commonMistake: '混淆染色体行为和数目变化'
      },
      {
        concepts: ['光反应', '暗反应'],
        differences: [
          { aspect: '场所', detail: '光反应：类囊体薄膜；暗反应：叶绿体基质' },
          { aspect: '条件', detail: '光反应：需要光；暗反应：不需要光（但需光反应产物）' },
          { aspect: '物质变化', detail: '光反应：水光解产生O₂；暗反应：CO₂固定合成糖' },
          { aspect: '能量变化', detail: '光反应：光能→ATP；暗反应：ATP→化学能' }
        ],
        commonMistake: '认为暗反应只能在黑暗中进行'
      },
      {
        concepts: ['原核细胞', '真核细胞'],
        differences: [
          { aspect: '细胞核', detail: '原核细胞：无成形细胞核；真核细胞：有核膜包被的细胞核' },
          { aspect: '细胞器', detail: '原核细胞：只有核糖体；真核细胞：多种细胞器' },
          { aspect: '染色体', detail: '原核细胞：拟核区DNA；真核细胞：染色体' },
          { aspect: '代表生物', detail: '原核细胞：细菌、蓝藻；真核细胞：动植物、真菌' }
        ],
        commonMistake: '认为病毒是原核生物'
      }
    ];

    // 易错点知识库
    this.commonMistakes = {
      '食物链': [
        { mistake: '食物链起点不是生产者', correct: '食物链必须从生产者开始', example: '错误：蛇→鹰；正确：草→兔→蛇→鹰' },
        { mistake: '食物链包含分解者', correct: '食物链不包含分解者，分解者属于食物网', example: '分解者分解各营养级的遗物' }
      ],
      '有丝分裂': [
        { mistake: '后期染色体数目加倍', correct: '后期着丝粒分裂，染色单体变为染色体，数目暂时加倍', example: '2n→4n（暂时）→2n' },
        { mistake: '间期不重要', correct: '间期进行DNA复制和蛋白质合成，是分裂的准备阶段', example: '间期占细胞周期90%以上时间' }
      ],
      '光合作用': [
        { mistake: '暗反应只能在黑暗中进行', correct: '暗反应不需要光，但可在有光时进行', example: '暗反应需要光反应的产物ATP和NADPH' },
        { mistake: '光合作用只在白天进行', correct: '光反应需要光，暗反应可持续进行', example: '夜间暗反应可利用白天储存的ATP' }
      ],
      '基因': [
        { mistake: '基因就是DNA', correct: '基因是DNA上具有遗传效应的片段', example: 'DNA包含基因和非编码区' },
        { mistake: '一个基因控制一个性状', correct: '基因与性状关系复杂：一因一效、一因多效、多因一效', example: '人的身高受多个基因控制' }
      ],
      '呼吸作用': [
        { mistake: '只有线粒体能进行呼吸作用', correct: '无氧呼吸在细胞质基质，有氧呼吸主要在线粒体', example: '酵母菌无氧呼吸产生酒精和CO₂' },
        { mistake: '呼吸作用就是吸入O₂呼出CO₂', correct: '呼吸作用是细胞内有机物氧化分解释放能量', example: '细胞呼吸≠呼吸运动' }
      ]
    };

    // 学段知识深度配置
    this.knowledgeDepth = {
      '初中': {
        maxLevel: 2,
        keywords: ['基本概念', '主要功能', '简单结构'],
        excludeTopics: ['分子机制', '信号通路', '基因表达调控']
      },
      '高中': {
        maxLevel: 4,
        keywords: ['详细过程', '分子基础', '调控机制'],
        includeTopics: ['ATP', 'DNA复制', '基因表达', '细胞信号']
      },
      '大学': {
        maxLevel: 6,
        keywords: ['分子机制', '信号通路', '最新研究'],
        includeTopics: ['表观遗传', '蛋白质组学', '系统生物学']
      }
    };
  }

  /**
   * 挖掘隐性关联
   * @param {Array} concepts - 概念数组
   * @returns {Array} 隐性关联数组
   */
  mineImplicitRelations(concepts) {
    const implicitLinks = [];

    concepts.forEach(concept => {
      const relations = this.implicitRelations[concept.name];
      if (relations) {
        relations.forEach(relation => {
          const targetConcept = concepts.find(c => c.name === relation.target);
          if (targetConcept) {
            implicitLinks.push({
              source: concept.id,
              target: targetConcept.id,
              label: relation.reason,
              type: relation.type,
              priority: relation.priority,
              implicit: true // 标记为隐性关联
            });
          }
        });
      }
    });

    return implicitLinks;
  }

  /**
   * 生成对比关联
   * @param {Array} concepts - 概念数组
   * @returns {Array} 对比关联数组
   */
  generateComparisons(concepts) {
    const comparisonLinks = [];

    this.confusableComparisons.forEach(comparison => {
      const concept1 = concepts.find(c => c.name === comparison.concepts[0]);
      const concept2 = concepts.find(c => c.name === comparison.concepts[1]);

      if (concept1 && concept2) {
        comparisonLinks.push({
          source: concept1.id,
          target: concept2.id,
          label: '易混淆对比',
          type: 'COMPARE',
          differences: comparison.differences,
          commonMistake: comparison.commonMistake,
          isComparison: true
        });
      }
    });

    return comparisonLinks;
  }

  /**
   * 识别易错点
   * @param {Array} concepts - 概念数组
   * @returns {Array} 带易错点标记的概念数组
   */
  identifyMistakes(concepts) {
    return concepts.map(concept => {
      const mistakes = this.commonMistakes[concept.name];
      if (mistakes) {
        return {
          ...concept,
          hasMistakes: true,
          mistakes: mistakes,
          highlight: true
        };
      }
      return concept;
    });
  }

  /**
   * 根据学段调整层级深度
   * @param {Array} nodes - 节点数组
   * @param {string} level - 学段（初中/高中/大学）
   * @returns {Array} 调整后的节点数组
   */
  adjustDepthByLevel(nodes, level = '高中') {
    const config = this.knowledgeDepth[level];
    if (!config) return nodes;

    return nodes.filter(node => {
      // 过滤超出最大层级的节点
      if (node.level > config.maxLevel) return false;

      // 排除不适合该学段的主题
      if (config.excludeTopics) {
        const shouldExclude = config.excludeTopics.some(topic =>
          node.name.includes(topic) || node.definition.includes(topic)
        );
        if (shouldExclude) return false;
      }

      return true;
    });
  }

  /**
   * 智能推荐相关节点
   * @param {Object} currentNode - 当前节点
   * @param {Array} allNodes - 所有节点
   * @param {Array} allLinks - 所有关联
   * @returns {Array} 推荐节点数组
   */
  recommendNodes(currentNode, allNodes, allLinks) {
    const recommendations = [];

    // 1. 查找直接关联的节点
    const directLinks = allLinks.filter(link =>
      link.source === currentNode.id || link.target === currentNode.id
    );

    directLinks.forEach(link => {
      const targetId = link.source === currentNode.id ? link.target : link.source;
      const targetNode = allNodes.find(n => n.id === targetId);
      if (targetNode) {
        recommendations.push({
          node: targetNode,
          reason: link.label,
          priority: link.priority || 'medium',
          type: 'direct'
        });
      }
    });

    // 2. 查找隐性关联
    const implicitRelations = this.implicitRelations[currentNode.name] || [];
    implicitRelations.forEach(relation => {
      const targetNode = allNodes.find(n => n.name === relation.target);
      if (targetNode && !recommendations.find(r => r.node.id === targetNode.id)) {
        recommendations.push({
          node: targetNode,
          reason: relation.reason,
          priority: relation.priority,
          type: 'implicit'
        });
      }
    });

    // 3. 查找同层级的兄弟节点
    if (currentNode.parentId) {
      const siblings = allNodes.filter(n =>
        n.parentId === currentNode.parentId && n.id !== currentNode.id
      );
      siblings.slice(0, 2).forEach(sibling => {
        if (!recommendations.find(r => r.node.id === sibling.id)) {
          recommendations.push({
            node: sibling,
            reason: '同层级相关概念',
            priority: 'low',
            type: 'sibling'
          });
        }
      });
    }

    // 按优先级排序
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) =>
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );

    return recommendations.slice(0, 5); // 返回前5个推荐
  }

  /**
   * 计算节点学习优先级
   * @param {Object} node - 节点
   * @param {string} userLevel - 用户学段
   * @returns {string} 优先级（基础级/重点级/拓展级）
   */
  calculatePriority(node, userLevel = '高中') {
    // 基础概念
    const basicConcepts = ['细胞', '细胞膜', '细胞质', '细胞核', 'DNA', '基因', '染色体'];
    if (basicConcepts.includes(node.name)) {
      return '基础级';
    }

    // 高中重点
    const highSchoolKey = ['有丝分裂', '减数分裂', '光合作用', '呼吸作用', '基因表达', '遗传定律'];
    if (userLevel === '高中' && highSchoolKey.includes(node.name)) {
      return '重点级';
    }

    // 拓展内容
    if (node.level > 3) {
      return '拓展级';
    }

    return '重点级';
  }

  /**
   * 生成补全节点（针对薄弱点）
   * @param {string} weakTopic - 薄弱知识点
   * @param {Array} existingNodes - 已有节点
   * @returns {Array} 补全节点数组
   */
  generateSupplementNodes(weakTopic, existingNodes) {
    const supplements = [];
    let idCounter = existingNodes.length + 1;

    // 根据薄弱点生成补充内容
    if (weakTopic.includes('有丝分裂')) {
      const mitosisNode = existingNodes.find(n => n.name === '有丝分裂');
      if (mitosisNode) {
        supplements.push({
          id: `supplement_${idCounter++}`,
          name: '有丝分裂后期特征',
          definition: '着丝粒分裂，染色体移向两极',
          module: mitosisNode.module,
          level: mitosisNode.level + 1,
          parentId: mitosisNode.id,
          isSupplement: true,
          highlight: true,
          supplementReason: '针对薄弱点补充'
        });

        supplements.push({
          id: `supplement_${idCounter++}`,
          name: '与减数第二次分裂后期对比',
          definition: '相同点：着丝粒分裂；不同点：染色体数目',
          module: mitosisNode.module,
          level: mitosisNode.level + 1,
          parentId: mitosisNode.id,
          isSupplement: true,
          isComparison: true,
          supplementReason: '对比学习强化理解'
        });
      }
    }

    return supplements;
  }

  /**
   * 动态扩展节点
   * @param {Object} parentNode - 父节点
   * @param {string} userQuestion - 用户问题
   * @returns {Array} 新增节点数组
   */
  expandNode(parentNode, userQuestion) {
    const expansions = [];

    // 根据问题关键词动态生成扩展节点
    if (userQuestion.includes('为什么') && parentNode.name === '线粒体') {
      if (userQuestion.includes('双层膜')) {
        expansions.push({
          id: `expand_${Date.now()}`,
          name: '线粒体膜结构功能',
          definition: '外膜：通透性高；内膜：嵴增大表面积',
          module: parentNode.module,
          level: parentNode.level + 1,
          parentId: parentNode.id,
          isExpansion: true,
          expandReason: '回答用户问题'
        });

        expansions.push({
          id: `expand_${Date.now() + 1}`,
          name: '内共生学说',
          definition: '推测线粒体源于原始真核细胞吞噬的需氧细菌',
          module: parentNode.module,
          level: parentNode.level + 1,
          parentId: parentNode.id,
          isExpansion: true,
          expandReason: '解释双层膜起源'
        });
      }
    }

    return expansions;
  }
}

export default BiologyReasoningEngine;