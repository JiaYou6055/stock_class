const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

async function fetchWantGooThemes() {
    console.log('正在從玩股網獲取概念題材分類...');
    
    const THEMES_PATH = path.join(__dirname, '../data/themes.json');
    let themeMap = {};
    if (await fs.exists(THEMES_PATH)) {
        themeMap = await fs.readJson(THEMES_PATH);
    }

    const urls = [
        { name: '類股報價首頁', url: 'https://www.wantgoo.com/stock/class' }
    ];
    
    const categoryList = [];

    try {
        for (const target of urls) {
            console.log(`正在掃描 ${target.name} 以尋找分類連結...`);
            const response = await axios.get(target.url, {
                headers: { 
                    'User-Agent': USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            });

            const $ = cheerio.load(response.data);
            
            // 找出所有可能的分類連結 (概念股、族群、集團)
            $('a').each((i, el) => {
                const name = $(el).text().trim();
                const link = $(el).attr('href');
                
                // 排除一些非具體分類的連結
                if (link && (link.includes('/stock/class/concept/') || link.includes('/stock/class/group/') || (link.includes('/stock/class/industry/') && !link.includes('/industry/上市') && !link.includes('/industry/上櫃')))) {
                    const fullLink = link.startsWith('http') ? link : `https://www.wantgoo.com${link}`;
                    if (!categoryList.find(c => c.link === fullLink)) {
                        categoryList.push({ name, link: fullLink });
                    }
                }
            });
        }

        if (categoryList.length === 0) {
            console.log('無法自動偵測到分類，嘗試使用預設熱門分類...');
            const fallbacks = [
                { name: 'AI概念股', link: 'https://www.wantgoo.com/stock/class/concept/^647' },
                { name: '半導體', link: 'https://www.wantgoo.com/stock/class/industry/半導體' },
                { name: '記憶體', link: 'https://www.wantgoo.com/stock/class/concept/^494' },
                { name: '電動車', link: 'https://www.wantgoo.com/stock/class/concept/^474' }
            ];
            categoryList.push(...fallbacks);
        }

        console.log(`共找到 ${categoryList.length} 個分類項目。`);

        // 為了避免過多請求，這裡我們循序處理，並加入延遲
        for (let i = 0; i < categoryList.length; i++) {
            const category = categoryList[i];
            process.stdout.write(`正在處理 (${i+1}/${categoryList.length}): ${category.name} ... \r`);
            
            try {
                const detailResponse = await axios.get(category.link, {
                    headers: { 'User-Agent': USER_AGENT }
                });
                const $detail = cheerio.load(detailResponse.data);

                $detail('table tbody tr').each((j, row) => {
                    const code = $detail(row).find('td:nth-child(1) a').text().trim();
                    if (code && /^\d+$/.test(code)) { // 確保是數字代碼
                        if (!themeMap[code]) {
                            themeMap[code] = [];
                        }
                        if (!themeMap[code].includes(category.name)) {
                            themeMap[code].push(category.name);
                        }
                    }
                });

                // 稍微延遲避免被封鎖 (正式環境建議 1-2 秒，這裡為了測試速度設短一點)
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`\n抓取 ${category.name} 失敗: ${err.message}`);
            }
        }

        console.log('\n抓取完成！正在儲存資料...');

        const outputPath = path.join(__dirname, '../data/themes.json');
        await fs.writeJson(outputPath, themeMap, { spaces: 2 });
        
        console.log(`成功！已更新 ${Object.keys(themeMap).length} 檔股票的題材資料。`);
        
    } catch (error) {
        console.error('執行失敗:', error.message);
    }
}

fetchWantGooThemes();
