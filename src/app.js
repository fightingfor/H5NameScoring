const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const nameAnalysisRoutes = require('./routes/nameAnalysis');

// 创建 Express 应用
const app = express();

// 中间件配置
app.use(cors()); // 启用 CORS
app.use(morgan('dev')); // 请求日志
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码的请求体

// API 路由
app.use('/api', nameAnalysisRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '未找到请求的资源'
    });
});

module.exports = app; 