
console.log('程序开始运行，不要瞎关闭')
//爬虫利器puppeteer
const puppeteer = require('puppeteer');
//处理用户输入的模块
const readline = require('readline');
//导出为excel的模块
const xlsx=require('node-xlsx');

const fs = require('fs');

setDate();
function setDate(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('输入你想查询的日期(格式：2018-01-01)? ', (answer) => {
        // TODO: Log the answer in a database
        console.log(`正在查找: ${answer} 的数据，别关窗口 `);
        formDate(answer);
        getData();
        rl.close();
    });
}


//基础url
let date='';
let url='https://www.qimai.cn/rank/index/brand/grossing/genre/6014/device/iphone/country/cn/date/';

function formDate(newDate){
    date=newDate;
    url+=newDate;
}

function getData(){
    let scrape = async () => {
        //创建浏览器实例
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto(url,{ waitUntil: 'networkidle2'});
        await page.waitFor(2000);
        //引入jquery方便选择元素
        await page.addScriptTag({
            url: "https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js"
        });
    
        //模拟滚动到底部获取异步加载的数据
        for(let i=0;i<3;i++){
            await page.evaluate(()=>{
                let $=window.$;
                let h = $(document).height()-$(window).height();
                $(document).scrollTop(h);
            });  
    
            await page.waitFor(2000); 
        }
    
        // 获取数据
        const result = await page.evaluate(() => {
            let $=window.$;
            let data=[];
            let reg=/[\r\n\s]/g;

            $('table tbody tr').each(function(){
                let rank=$(this).find('td:eq(0) div:eq(0)').text();
                let name=$(this).find('td:eq(1) .name').text();
                let company=$(this).find('td:eq(7) a').text();
                name=name.replace(reg,'')
                data.push([rank,name,company]);
            })

            return data
        });
        browser.close();
        return result;
    };
    scrape().then((value) => {
        console.log('获取信息成功');
        console.log(value); // 成功！
        exportExcel(value)
    });
}

//导出为excel文件
function exportExcel(data){
    // const data = [[1, 2, 3], [true, false, null, 'sheetjs'], ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'], ['baz', null, 'qux']];
    let buffer = xlsx.build([{name: "mySheetName", data: data}]); // Returns a buffer
    fs.writeFileSync(`${date}.xlsx`, buffer, 'binary');
    console.log('获取数据成功');
}
