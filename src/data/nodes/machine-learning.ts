import type { KnowledgeNode } from '../../types';

/** 机器学习与深度学习框架层 */
export const machineLearningNodes: KnowledgeNode[] = [
  {
    id: 'ml-basics',
    title: '机器学习基础',
    category: 'ml',
    summary: '监督学习、损失函数、过拟合与泛化，建立建模方法论。',
    why: '大模型仍遵循机器学习的基本范式。',
    description: [
      '在冲向 Transformer 之前，必须先建立一套可靠的建模直觉：什么是训练集与测试集的分布差异、什么是偏差与方差的权衡、为什么模型在训练集上完美却在真实场景崩溃。这些问题在大模型时代没有消失，只是换了尺度。',
      '核心内容包括：监督学习与无监督学习的区别、线性回归与逻辑回归（最小的完整模型）、损失函数与正则化、训练 / 验证 / 测试集的划分、交叉验证、过拟合与欠拟合的识别与应对、特征工程与评价指标（准确率、精确率、召回率、F1、AUC）。',
      '一个常被低估的收获是“基线意识”。任何复杂模型都需要和简单基线对比才有意义。大模型项目里大量的无效优化，本质是因为没人先跑一个逻辑回归或关键词匹配的基线。',
    ],
    purposes: [
      '判断一个任务是否适合用机器学习解决',
      '正确划分数据集并识别数据泄漏',
      '诊断过拟合、欠拟合并选择应对策略',
      '为复杂模型建立可对比的简单基线',
      '选择与业务目标匹配的评价指标',
    ],
    resources: [
      {
        title: '动手学深度学习 · 线性神经网络',
        type: 'book',
        url: 'https://zh.d2l.ai/chapter_linear-networks/index.html',
        note: '中文开源教材，从线性回归讲到 softmax 分类。',
      },
      {
        title: 'scikit-learn User Guide',
        type: 'doc',
        url: 'https://scikit-learn.org/stable/user_guide.html',
        note: '经典算法的权威文档，适合边读边动手。',
      },
      {
        title: 'CS229: Machine Learning（Stanford）',
        type: 'course',
        url: 'https://cs229.stanford.edu/',
        note: '偏理论推导，想打扎实数学基础可选。',
      },
      {
        title: 'Rules of Machine Learning（Google）',
        type: 'article',
        url: 'https://developers.google.com/machine-learning/guides/rules-of-ml',
        note: 'Google 工程实践总结，43 条规则极具实战价值。',
      },
    ],
    zhihuKeywords: ['机器学习 入门 学习路线', '过拟合 欠拟合 如何判断'],
    prerequisites: ['linear-algebra', 'probability', 'python'],
  },
  {
    id: 'neural-net',
    title: '神经网络基础',
    category: 'ml',
    summary: '前馈网络、激活函数、反向传播与正则化技巧。',
    why: 'Transformer 是神经网络的一种特化结构。',
    description: [
      '神经网络的核心思想简单到近乎粗暴：把线性变换和非线性激活函数交替堆叠起来，就能逼近相当复杂的函数。难点从来不在表达能力，而在“怎么把它训练起来”。',
      '需要掌握：感知机与多层感知机的结构、常见激活函数（ReLU、GELU、SiLU）及其选择理由、前向传播与反向传播的完整计算过程、权重初始化（Xavier、Kaiming）、批归一化与层归一化、Dropout 与权重衰减、残差连接。',
      '建议动手从零实现一个两层网络的前向与反向传播，只用 NumPy，不借助自动微分。这个练习的价值极高：它会把链式法则、形状对齐、数值稳定性这些抽象概念变成肌肉记忆，之后看任何框架代码都不再是黑箱。',
    ],
    purposes: [
      '理解深度模型的前向与反向计算流程',
      '选择合适的激活函数与初始化方案',
      '用归一化与残差连接稳定深层网络训练',
      '通过 Dropout、权重衰减等手段抑制过拟合',
      '为理解 Transformer 的层结构做准备',
    ],
    resources: [
      {
        title: 'Neural Networks（3Blue1Brown）',
        type: 'video',
        url: 'https://www.3blue1brown.com/topics/neural-networks',
        note: '可视化讲解网络结构与反向传播直觉。',
      },
      {
        title: "Neural Networks: Zero to Hero（Karpathy）",
        type: 'course',
        url: 'https://karpathy.ai/zero-to-hero.html',
        note: '从零手写自动微分到 GPT，本路径中性价比最高的课程。',
      },
      {
        title: '动手学深度学习 · 多层感知机',
        type: 'book',
        url: 'https://zh.d2l.ai/chapter_multilayer-perceptrons/index.html',
        note: '含过拟合、初始化、数值稳定性的系统讲解。',
      },
      {
        title: 'Deep Learning（Goodfellow 等）',
        type: 'book',
        url: 'https://www.deeplearningbook.org/',
        note: '免费在线阅读的深度学习圣经，适合查阅理论细节。',
      },
    ],
    zhihuKeywords: ['反向传播 推导 详解', '层归一化 批归一化 区别'],
    prerequisites: ['ml-basics', 'calculus'],
  },
  {
    id: 'pytorch',
    title: '深度学习框架 PyTorch',
    category: 'programming',
    summary: '张量操作、自动微分、nn.Module 与训练循环工程实践。',
    why: '大模型训练与推理的主流工具链。',
    description: [
      'PyTorch 的设计哲学是“Python 优先”：计算图动态构建，调试体验接近普通 Python 代码。这让它在研究领域几乎一统天下，而大模型生态（Hugging Face、DeepSpeed、vLLM）也全部构建在它之上。',
      '需要掌握的能力层次：张量操作与设备管理（CPU / GPU / 显存）、autograd 自动微分机制与计算图、nn.Module 的组织方式、Dataset 与 DataLoader、优化器与学习率调度器、完整训练循环的编写、混合精度训练（AMP）、模型保存与加载、分布式训练入门（DDP）。',
      '强烈建议把注意力放在显存管理与形状调试上。实际工作中遇到的问题八成是 CUDA out of memory 和 shape mismatch，而不是算法本身。掌握梯度累积、梯度检查点、torch.cuda 显存统计这些工具，比多读一篇论文更有产出。',
    ],
    purposes: [
      '实现自定义模型结构与完整训练循环',
      '使用 autograd 调试梯度与排查数值问题',
      '通过混合精度与梯度累积在有限显存下训练',
      '加载、微调并保存 Hugging Face 上的开源模型',
      '为分布式训练与推理优化打下工具基础',
    ],
    resources: [
      {
        title: 'PyTorch Tutorials',
        type: 'doc',
        url: 'https://pytorch.org/tutorials/',
        note: '官方教程，Learn the Basics 一节覆盖全部核心概念。',
      },
      {
        title: 'PyTorch 官方文档',
        type: 'doc',
        url: 'https://pytorch.org/docs/stable/index.html',
        note: 'API 权威参考，autograd 与 cuda 章节值得细读。',
      },
      {
        title: 'Hugging Face Transformers 文档',
        type: 'doc',
        url: 'https://huggingface.co/docs/transformers/index',
        note: '开源模型加载与微调的事实标准库。',
      },
      {
        title: 'nanoGPT',
        type: 'article',
        url: 'https://github.com/karpathy/nanoGPT',
        note: 'Karpathy 的极简 GPT 实现，约 300 行读懂训练全流程。',
      },
    ],
    zhihuKeywords: ['PyTorch 入门 教程 推荐', 'CUDA out of memory 解决'],
    prerequisites: ['python', 'neural-net'],
  },
];
