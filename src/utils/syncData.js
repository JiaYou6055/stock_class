const fs = require('fs-extra');
const path = require('path');

const THEMES_PATH = path.join(__dirname, '../data/themes.json');
const INDUSTRIES_PATH = path.join(__dirname, '../data/twse_industries.json');
const STOCK_INDEX_PATH = path.join(__dirname, '../data/stock_index.json');

const INDUSTRY_MAP = {
    '01': '水泥工業', '02': '食品工業', '03': '塑膠工業', '04': '紡織纖維',
    '05': '電機機械', '06': '電器電纜', '08': '玻璃陶瓷', '09': '造紙工業',
    '10': '鋼鐵工業', '11': '橡膠工業', '12': '汽車工業', '14': '建材營造',
    '15': '航運業', '16': '觀光事業', '17': '金融保險', '18': '貿易百貨',
    '20': '化學工業', '21': '其他', '22': '生技醫療業', '23': '油電燃氣業',
    '24': '半導體業', '25': '電腦及週邊設備業', '26': '光電業', '27': '通信網路業',
    '28': '電子零組件業', '29': '電子通路業', '30': '資訊服務業', '31': '其他電子業',
    '35': '綠能環保', '36': '數位雲端', '37': '運動休閒', '38': '居家生活',
    '91': '存託憑證'
};

async function syncIndustriesToThemes() {
    console.log('正在將產業分類同步至題材資料庫...');
    
    const themes = await fs.readJson(THEMES_PATH);
    const industries = await fs.readJson(INDUSTRIES_PATH);
    const stockIndex = await fs.readJson(STOCK_INDEX_PATH);

    let updatedCount = 0;

    // 從 twse_industries.json 同步
    for (const [code, stocks] of Object.entries(industries)) {
        const industryName = INDUSTRY_MAP[code] || `產業(${code})`;
        for (const stock of stocks) {
            if (!themes[stock.code]) {
                themes[stock.code] = [];
            }
            if (!themes[stock.code].includes(industryName)) {
                themes[stock.code].push(industryName);
                updatedCount++;
            }
        }
    }

    // 確保 stock_index 中的產業也被加入
    for (const [code, stock] of Object.entries(stockIndex)) {
        if (!themes[code]) {
            themes[code] = [];
        }
        const ind = stock.industry.replace('業', '');
        if (!themes[code].includes(ind) && ind !== '其他') {
            themes[code].push(ind);
            updatedCount++;
        }
    }

    // 手動補強：常見的重要細分類 (如記憶體)
    const manualPatches = {
        '2337': ['記憶體', 'Flash記憶體'],
        '2344': ['記憶體', 'DRAM', 'Flash記憶體'],
        '2408': ['記憶體', 'DRAM'],
        '3006': ['記憶體', 'DRAM', 'Flash記憶體'],
        '8271': ['記憶體'],
        '3260': ['記憶體', 'DRAM', 'Flash記憶體'],
        '4967': ['記憶體'],
        '8299': ['記憶體', 'Flash記憶體'],
        '8088': ['記憶體'],
        '4973': ['記憶體'],
        '6531': ['記憶體', 'IC設計'],
        // 封測相關
        '6239': ['封測相關', '半導體封測'],
        '6257': ['封測相關', '半導體封測'],
        // 半導體設備
        '2467': ['半導體設備'],
        '6438': ['半導體設備'],
        '6664': ['半導體設備'],
        '6937': ['半導體設備'],
        '6953': ['半導體設備'],
        '7822': ['半導體設備'],
        // III-V族
        '2455': ['III-V族', '砷化鎵'],
        '3081': ['III-V族', '砷化鎵'],
        '3105': ['III-V族', '砷化鎵'],
        '4991': ['III-V族', '砷化鎵'],
        '8086': ['III-V族', '砷化鎵'],
        // 品牌ODM
        '2317': ['品牌ODM', '鴻海集團'],
        '2382': ['品牌ODM', '廣達集團'],
        // 半導體檢測
        '3289': ['半導體檢測'],
        '3587': ['半導體檢測']
    };

    for (const [code, categories] of Object.entries(manualPatches)) {
        if (!themes[code]) {
            themes[code] = [];
        }
        for (const cat of categories) {
            if (!themes[code].includes(cat)) {
                themes[code].push(cat);
                updatedCount++;
            }
        }
    }

    await fs.writeJson(THEMES_PATH, themes, { spaces: 2 });
    console.log(`同步完成！共更新/新增了 ${updatedCount} 筆分類關聯。`);
    console.log(`目前題材資料庫共有 ${Object.keys(themes).length} 檔股票資料。`);
}

syncIndustriesToThemes();
