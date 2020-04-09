const https = require('https');
const jsdom = require('jsdom');
const fs = require('fs');

async function httpRequest(url) {
  const promiseFunc = new Promise( (resolve, reject) => {
    https.get(url, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => { body += data; });
      res.on("end", () => { resolve(body); });
    });
  });
  return promiseFunc;
}

async function webCrawler(url, selector) {
  console.log('webCrawler: ', url);
  const htmlSource = await httpRequest(url);
  const htmlDom = new jsdom.JSDOM(htmlSource);
  const list = selector(htmlDom);
  
  const data = list.reduce((prev, curr) => {
    if(curr.tagName === 'A') {
      const href = curr.getAttribute('href');
      const title = curr.textContent;
      prev.push({ title, href });
    } else {
      const href = curr.firstElementChild.getAttribute('href');
      const title = curr.firstElementChild.textContent;
      prev.push({ title, href });
    }
    return prev;
  }, []);
  console.log('webCrawler data: ', data);
  return data;
}

const catSelector = (dom) => {
  const aa = [...dom.window.document.querySelector('.catList').children];
  return aa;
};

const listSelector = (dom) => {
  let aa = [...dom.window.document.querySelector('.list').children];
  aa = aa.filter(a => a.getAttribute('class') === 'fl odd');
  return aa;
};

const dwnSelector = (dom) => {
  let aa = [dom.window.document.querySelector('.fInfo').querySelector('.fi')];
  return aa;
};

async function movies() {
  const rootUrl = 'https://djsathi.me';
  const url = rootUrl + '/categorylist/3139/new-bollywood-movie-2020-mp3-songs/default/1';
  let mov = await webCrawler(url, catSelector);
  // mov = mov.slice(0, 2);
  for (const m of mov) {
    const songs = await webCrawler(rootUrl + m.href, listSelector);
    for (const s of songs) {
      const dwn = await webCrawler(rootUrl + s.href, dwnSelector);
      s.dwn = dwn[0].href;
    }
    m.songs = songs;
  }
  fs.writeFile('api/songs.json', JSON.stringify(mov, null, 2), function (err) {
    if (err) throw err;
  });
}

movies();
