import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
  // 创建不指定数据库的连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    // 创建数据库
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log('数据库创建成功！');

    // 使用数据库
    await connection.query(`USE ${process.env.DB_NAME}`);

    // 创建汉字表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chinese_characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        character_text VARCHAR(10) NOT NULL UNIQUE,
        strokes INT NOT NULL,
        kangxi_strokes INT,
        five_elements VARCHAR(10),
        pinyin VARCHAR(50),
        meaning TEXT,
        is_name_char BOOLEAN DEFAULT FALSE,
        is_regular BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('汉字表创建成功！');

    // 创建五格数理规则表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS five_grid_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grid_type ENUM('天格', '人格', '地格', '外格', '总格') NOT NULL,
        strokes INT NOT NULL,
        score INT NOT NULL,
        meaning TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_grid_strokes (grid_type, strokes)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('五格数理规则表创建成功！');

    // 创建姓名评分记录表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS name_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        surname VARCHAR(1) NOT NULL,
        given_name VARCHAR(50) NOT NULL,
        gender ENUM('男', '女') NOT NULL,
        total_score INT NOT NULL,
        five_grid_score INT NOT NULL,
        five_elements_score INT NOT NULL,
        cultural_score INT NOT NULL,
        analysis TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('数据库初始化成功！');
  } catch (error) {
    console.error('数据库初始化失败：', error);
  } finally {
    await connection.end();
  }
}

initDatabase(); 