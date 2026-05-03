const axios = require('axios');
const cheerio = require('cheerio');

async function debugYahoo() {
    const url = 'https://tw.stock.yahoo.com/class';
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(response.data);
        console.log('Yahoo 頁面標題:', $('title').text());
        console.log('找到的分類:');
        $('a[href*="/class-quote/"]').slice(0, 20).each((i, el) => {
            console.log($(el).text().trim(), '->', $(el).attr('href'));
        });
    } catch (e) {
        console.error('Yahoo Debug 失敗:', e.message);
    }
}
debugYahoo();
