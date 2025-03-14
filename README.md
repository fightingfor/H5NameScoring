# 姓名打分系统 (Name Scoring System)

这是一个基于传统姓名学的姓名打分系统，支持单姓双名和复姓双名的分析。系统采用前后端分离架构，提供专业的姓名五格分析和运势评估。

## 项目架构

```
├── frontend/              # 前端 Vue.js 项目
│   └── src/
│       ├── views/        # 页面组件
│       └── components/   # 通用组件
└── src/                  # 后端 Node.js 项目
    └── services/         # 业务逻辑服务
```

## 核心功能

### 1. 姓名分析
- 支持单姓（如：张、王）和复姓（如：诸葛、欧阳）
- 支持双字名
- 五格数理分析
- 运势评估
- 历史记录保存（最近10条）

### 2. 五格计算规则
系统实现了传统姓名学的五格计算法则：

#### 2.1 单姓计算规则
- 天格：姓氏笔画数 + 1
- 人格：姓氏笔画数 + 名字第一字笔画数
- 地格：名字所有字笔画总和
- 外格：姓氏笔画数 + 名字最后一字笔画数
- 总格：姓名所有字笔画总和

#### 2.2 复姓计算规则
- 天格：复姓两字笔画总和 + 1
- 人格：复姓第二字笔画数 + 名字第一字笔画数
- 地格：名字所有字笔画总和
- 外格：复姓第一字笔画数 + 名字最后一字笔画数
- 总格：姓名所有字笔画总和

## 数据库设计

### 数据库名：name_scoring

#### 表结构

1. **chinese_characters** - 汉字信息表
```sql
CREATE TABLE chinese_characters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    character_text CHAR(1) NOT NULL,
    strokes INT NOT NULL,
    UNIQUE KEY (character_text)
);
```
- 用途：存储汉字及其笔画数
- 字段说明：
  - character_text: 汉字
  - strokes: 笔画数

2. **five_grid_rules_new** - 五格规则表
```sql
CREATE TABLE five_grid_rules_new (
    id INT PRIMARY KEY AUTO_INCREMENT,
    grid_type VARCHAR(10) NOT NULL,
    strokes INT NOT NULL,
    score INT NOT NULL,
    luck_level VARCHAR(10) NOT NULL,
    general_meaning TEXT,
    career_meaning TEXT,
    wealth_meaning TEXT,
    marriage_meaning TEXT,
    health_meaning TEXT
);
```
- 用途：存储五格数理的评分规则和解释
- 字段说明：
  - grid_type: 格类型（天格/人格/地格/外格/总格）
  - strokes: 笔画数
  - score: 分数（0-100）
  - luck_level: 吉凶等级
  - *_meaning: 各方面的详细解释

## 核心文件说明

### 后端服务 (src/)

1. **FiveGridAnalyzer.js**
- 位置：`src/services/FiveGridAnalyzer.js`
- 功能：实现五格数理的核心计算逻辑
- 主要方法：
  - calculateFiveGrid(): 计算五格数理
  - getStrokes(): 获取汉字笔画数
  - getGridRule(): 获取五格规则
  - analyzeName(): 综合分析姓名

2. **NameScorer.js**
- 位置：`src/services/NameScorer.js`
- 功能：姓名综合评分服务
- 主要方法：
  - calculateScore(): 计算总体评分
  - generateDetailedReport(): 生成详细报告
  - 包含默认评分和评语逻辑

### 前端页面 (frontend/)

1. **Home.vue**
- 位置：`frontend/src/views/Home.vue`
- 功能：主页面组件
- 特点：
  - 响应式设计
  - 实时分析展示
  - 历史记录管理
  - 错误处理和加载状态

## 错误处理机制

1. **字符处理**
- 对找不到笔画数的汉字使用默认值（15画）
- 保持系统正常运行，不影响整体分析

2. **评分规则**
- 当找不到对应规则时，返回默认评分（80分）
- 提供中性、积极的默认评语

3. **用户界面**
- 优雅的错误提示
- 加载状态显示
- 输入验证

## 部署说明

1. **数据库配置**
- 确保MySQL服务运行
- 创建name_scoring数据库
- 导入必要的汉字和规则数据

2. **后端服务**
- 配置数据库连接（FiveGridAnalyzer.js中的dbConfig）
- 启动Node.js服务

3. **前端部署**
- 构建Vue.js项目
- 配置API端点

## 维护建议

1. **数据库维护**
- 定期备份数据
- 更新汉字笔画数据
- 优化五格规则

2. **性能优化**
- 考虑缓存常用汉字的笔画数
- 优化数据库查询
- 监控API响应时间

3. **功能扩展**
- 添加更多姓名分析维度
- 扩展历史记录功能
- 增加用户账户系统

## 注意事项

1. 确保数据库中包含足够的汉字数据，特别是生僻字和复姓
2. 定期检查和更新五格规则数据
3. 保持错误处理机制的有效性
4. 注意数据库连接的管理和释放

## 技术栈

- 前端：Vue.js 3
- 后端：Node.js
- 数据库：MySQL
- API：RESTful

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 许可证

[待定] - 请添加适当的许可证

## 联系方式

[待定] - 请添加项目维护者的联系方式 