const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.join(__dirname, '../data');
const SCRAPER_DIR = path.join(__dirname, '../scrapers');
const UTILS_DIR = __dirname;

const FILES = {
    index: path.join(DATA_DIR, 'stock_index.json'),
    all: path.join(DATA_DIR, 'all_stocks.json'),
    themes: path.join(DATA_DIR, 'themes.json'),
    industries: path.join(DATA_DIR, 'twse_industries.json')
};

async function checkAndUpdate() {
    console.log('=== 股票資料完整性檢查系統 ===');

    // 1. 檢查基礎索引檔案 (stock_index.json, all_stocks.json)
    if (!await fs.exists(FILES.index) || !await fs.exists(FILES.all)) {
        console.log('[!] 基礎索引檔案缺失，正在執行 twseScraper.js...');
        try {
            execSync(`node ${path.join(SCRAPER_DIR, 'twseScraper.js')}`, { stdio: 'inherit' });
        } catch (e) {
            console.error('執行 twseScraper 失敗:', e.message);
            return;
        }
    } else {
        console.log('[OK] 基礎索引檔案已存在。');
    }

    // 2. 檢查題材檔案 (themes.json)
    if (!await fs.exists(FILES.themes)) {
        console.log('[!] themes.json 缺失，正在初始化並同步產業資料...');
        await fs.writeJson(FILES.themes, {}, { spaces: 2 });
        runSync();
    } else {
        const index = await fs.readJson(FILES.index);
        const themes = await fs.readJson(FILES.themes);
        const stockCodes = Object.keys(index);
        const themeCodes = Object.keys(themes);
        
        const missingCount = stockCodes.filter(code => !themes[code]).length;
        
        if (missingCount > stockCodes.length * 0.1) { // 如果超過 10% 沒資料就同步一次
            console.log(`[!] 偵測到 ${missingCount} 檔股票缺乏分類，正在執行同步...`);
            runSync();
        } else {
            console.log(`[OK] 分類資料完整性良好 (缺失數: ${missingCount}/${stockCodes.length})。`);
        }
    }

    // 3. 檢查玩股網資料 (可選擇性更新)
    console.log('\n是否要更新玩股網的熱門題材資料？(這可能需要幾分鐘)');
    console.log('若需更新，請手動執行: node src/scrapers/wantgooScraper.js');
    
    console.log('\n=== 檢查完成 ===');
}

function runSync() {
    try {
        console.log('正在執行 syncData.js...');
        execSync(`node ${path.join(UTILS_DIR, 'syncData.js')}`, { stdio: 'inherit' });
    } catch (e) {
        console.error('執行 syncData 失敗:', e.message);
    }
}

checkAndUpdate();
