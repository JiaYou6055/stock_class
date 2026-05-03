const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// 產業代碼對照表 (簡略版，實際可從證交所官網獲取完整清單)
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

async function fetchFullStockList() {
    console.log('正在獲取上市(TWSE)與上櫃(TPEx)股票清單...');
    try {
        const twseUrl = 'https://openapi.twse.com.tw/v1/opendata/t187ap03_L';
        const tpexUrl = 'https://www.tpex.org.tw/openapi/v1/t187ap03_O';

        const [twseRes, tpexRes] = await Promise.all([
            axios.get(twseUrl),
            axios.get(tpexUrl)
        ]);

        const allStocks = [];
        
        // 處理上市
        const twseData = Array.isArray(twseRes.data) ? twseRes.data : [];
        twseData.forEach(s => {
            const indCode = s['產業別'];
            allStocks.push({
                code: s['公司代號'],
                name: s['公司名稱'],
                industry: INDUSTRY_MAP[indCode] || `其他(${indCode})`,
                market: '上市'
            });
        });

        // 處理上櫃
        const tpexData = Array.isArray(tpexRes.data) ? tpexRes.data : [];
        tpexData.forEach(s => {
            const indName = s['產業別'];
            allStocks.push({
                code: s['公司代號'],
                name: s['公司名稱'],
                industry: indName,
                market: '上櫃'
            });
        });

        const outputPath = path.join(__dirname, '../data/all_stocks.json');
        await fs.writeJson(outputPath, allStocks, { spaces: 2 });
        
        // 建立索引以利查詢
        const index = {};
        allStocks.forEach(s => {
            index[s.code] = s;
        });
        await fs.writeJson(path.join(__dirname, '../data/stock_index.json'), index, { spaces: 2 });

        console.log(`成功！共抓取 ${allStocks.length} 檔股票。`);
        console.log(`資料已建立索引。`);
        
    } catch (error) {
        console.error('抓取資料失敗:', error.message);
    }
}

fetchFullStockList();
