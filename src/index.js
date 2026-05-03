const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const STOCK_INDEX_PATH = path.join(__dirname, 'data/stock_index.json');
const THEMES_PATH = path.join(__dirname, 'data/themes.json');

async function main() {
    if (!await fs.exists(STOCK_INDEX_PATH)) {
        console.log('找不到資料庫，請先執行爬蟲: node src/scrapers/twseScraper.js');
        return;
    }

    const stockIndex = await fs.readJson(STOCK_INDEX_PATH);
    
    // 初始化一些範例題材資料 (實際可由爬蟲或手動更新)
    let themeMapping = {};
    if (await fs.exists(THEMES_PATH)) {
        themeMapping = await fs.readJson(THEMES_PATH);
    } else {
        // 預設範例
        themeMapping = {
            '2330': ['AI 概念股', '晶圓代工', '台積電大聯盟'],
            '2317': ['電動車', '蘋果供應鏈', '鴻海家族'],
            '2454': ['IC 設計', '手機晶片', 'AI 手機'],
            '2308': ['電源供應器', 'AI 伺服器', '綠能']
        };
        await fs.writeJson(THEMES_PATH, themeMapping, { spaces: 2 });
    }

    console.log('========================================');
    console.log('   台灣股票族群與題材分類系統 v1.0');
    console.log('========================================');
    console.log('指令說明:');
    console.log('1. 輸入股票代號 (如: 2330) 查詢詳細資訊');
    console.log('2. 輸入 "theme [題材名稱]" 查詢該題材所有成份股');
    console.log('3. 輸入 "exit" 退出系統');
    console.log('提示: 若資料不全，請執行: node src/utils/syncData.js');
    console.log('----------------------------------------');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '查詢> '
    });

    rl.prompt();

    rl.on('line', (line) => {
        const input = line.trim();
        
        if (input.toLowerCase() === 'exit') {
            rl.close();
            return;
        }

        if (input.startsWith('theme ')) {
            const themeName = input.replace('theme ', '').trim();
            const stocksWithTheme = Object.entries(themeMapping)
                .filter(([code, themes]) => themes.includes(themeName))
                .map(([code, themes]) => {
                    const s = stockIndex[code];
                    return s ? `${s.code} - ${s.name}` : `${code} (未知)`;
                });

            if (stocksWithTheme.length > 0) {
                console.log(`\n題材 [${themeName}] 的成份股 (${stocksWithTheme.length} 檔):`);
                stocksWithTheme.forEach(s => console.log(s));
            } else {
                // 模糊搜尋題材名稱
                const allThemes = [...new Set(Object.values(themeMapping).flat())];
                const matchedThemes = allThemes.filter(t => t.includes(themeName));
                
                if (matchedThemes.length > 0) {
                    console.log(`\n找不到精確題材 "${themeName}"，你是指？`);
                    matchedThemes.forEach(t => console.log(`- ${t}`));
                } else {
                    console.log(`\n找不到相關題材 "${themeName}"。`);
                }
            }
            console.log('----------------------------------------');
            rl.prompt();
            return;
        }

        if (stockIndex[input]) {
            const s = stockIndex[input];
            const themes = themeMapping[input] || ['尚無題材資料'];
            
            console.log(`\n[${s.code}] ${s.name}`);
            console.log(`市場: ${s.market}`);
            console.log(`產業: ${s.industry}`);
            console.log(`相關題材: ${themes.join(', ')}`);
            console.log('----------------------------------------');
        } else {
            // 嘗試模糊搜尋名稱
            const matches = Object.values(stockIndex).filter(s => s.name.includes(input));
            if (matches.length > 0) {
                console.log(`找到 ${matches.length} 筆相似結果:`);
                matches.forEach(m => console.log(`${m.code} - ${m.name} (${m.industry})`));
            } else {
                console.log('找不到該股票，請確認輸入是否正確。');
            }
        }
        
        rl.prompt();
    }).on('close', () => {
        console.log('謝謝使用，祝您投資順利！');
        process.exit(0);
    });
}

main();
