import * as cheerio from "cheerio";
import fetch from "node-fetch";

const delay = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

const fetchPromiseUrl = async (items, url) => {
  let results = [];
  for (let index = 1; index <= items.length; index++) {
    await delay();
    const res = await fetch(`${url}${index}`);
    results.push(res);
  }
  return results;
};

async function getPageNumbers() {
  try {
    const response = await fetch("https://pesdb.net/pes2021/");
    const data = await response.text();
    const $ = cheerio.load(data);

    let pageNumberArray = [];
    $(".pages > a").each((_, e) => {
      const number = Number($(e).text());
      pageNumberArray.push(number);
    });
    const max = Math.max(...pageNumberArray);
    pageNumberArray = [...Array(Number(max + 1)).keys()];
    pageNumberArray.shift();

    const testArray = [1, 2];
    return testArray;
    // return pageNumberArray
  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`);
  }
}

async function getPlayersFromPage() {
  try {
    const pageNumbers = await getPageNumbers();

    const baseUrl = "https://pesdb.net/pes2021/?page=";

    const urls = await fetchPromiseUrl(pageNumbers, baseUrl);

    const tr = Promise.all(
      urls.map(async (res) => {
        let playersId = [];
        const data = await res.text();
        const $ = cheerio.load(data);
        $(".players tbody tr").each((i, elem) => {
          const links = $(elem).find("td a").attr("href");
          if (links) {
            playersId.push(links.slice(6));
          }
        });
        return playersId.flat();
      })
    );
  
    return tr

    // tr.then((val) => {
    //   val.map(async (arr) => {
    //     const baseUrl = "https://pesdb.net/pes2021/?id=";
    //     const links = await fetchPromiseUrl(arr, baseUrl);
    //     const stats = Promise.all(
    //       links.map(async (res) => {
    //         const data = await res.text();
    //         const players = getPlayerStats(data)
    //         console.log(players)
    //       })
    //     );
    //     console.log(stats);
    //   });
    // });
  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`);
  }
}

async function test() {
  const playerLinks = await getPlayersFromPage();
  playerLinks.flat().map(async (link) => {
    const url = "https://pesdb.net/pes2021/?id="
    const links = await fetchPromiseUrl(link, url)
    links.map(async (res) => {
      const data = await res.text()
      console.log(data)
      // const player = await getPlayerStats(data)


    })
    return player
  })
}
test();

async function getPlayerStats(id) {
  try {
    // fetch the player's page and load cheerio
    // const page = `https://pesdb.net/pes2021/?id=${id}`;
    const page = await fetchPromiseUrl(id)
    const response = await fetch(page)
    // const response = await fetchPromiseUrl(id, page);
    const data = await response.text();
    const $ = cheerio.load(data);

    // store the cheerio values of the elements we want to traverse in
    const table = $(".player tbody tr").first();
    const playerInfo = table.find("td").first();
    const playerStatsOne = playerInfo.next();
    const playerStatsTwo = playerStatsOne.next();
    const playerStyles = playerStatsTwo.next();

    // create empty arrays to store the information we want
    let info = [];
    let stats = [];
    let items = [];

    // function to get the information we need and the way we want it
    function pushStat(element, arr) {
      let el = $(element).find("th").text().trim().slice(0, -1);
      el = el.replace(/\s/g, "");
      let val = $(element).find("td").text().trim();
      el && val ? arr.push({[el]: val}) : null;
    }
    // get the player's information and push to the array
    playerInfo.find("table tbody tr").each((i, elem) => pushStat(elem, info));
    items.push(...info);

    // get player's playable positions and push to the info array
    let bestPos = [];
    let goodPos = [];
    const positions = playerInfo.find(".positions div span");
    positions.each((i, elem) => {
      if ($(elem).attr("class") === "pos2") {
        const pos = $(elem).text().trim();
        bestPos.push(pos);
      }
      if ($(elem).attr("class") === "pos1") {
        const pos = $(elem).text().trim();
        goodPos.push(pos);
      }
    });
    items.push({BestPositions: [...bestPos]});
    items.push({GoodPositions: [...goodPos]});

    // get player's playing styles and push to the array
    let styles = [];
    playerStyles.find("table tbody tr").each((index, elem) => {
      const item = $(elem).text();
      styles.push({ index, style: item });
    });
    const ids = styles.map((obj) => obj.index);
    const idToRemove = styles.findIndex(
      (item) => item.style === "COM Playing Styles"
    );
    const highestId = Math.max.apply(null, ids);
    styles.splice(idToRemove, highestId);
    const newStyles = styles.map((item) => item.style);
    items.push({ PlayingStyles: [...newStyles] });

    // get the player's stats and push to the array
    playerStatsOne
      .find("table tbody tr")
      .each((i, elem) => pushStat(elem, stats));
    playerStatsTwo
      .find("table tbody tr")
      .each((i, elem) => pushStat(elem, stats));
    items.push(stats);
    
    console.log(`=> FECTHED PLAYER : ${items[0].PlayerName}`)
    return items;
  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`);
  }
}

async function main() {
  try {
    const pageNumbers = await getPageNumbers();

    let playerLinks = [];
    async function players() {
      try {
        for (const page of pageNumbers) {
          // const link = await promiseTimeout(getPlayersFromPage(page),2000)
          // const link = await getPlayersFromPage(page)
          // playerLinks.push(...link)

          setDelay(page);
        }

        // return Promise.all(playerLinks)
      } catch (e) {
        console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`);
      }
    }
    await players();

    // async function stats(list) {
    //   let playerStats = []
    //   try {
    //     for (const player of list) {
    //       const stats = await getPlayerStats(player)
    //       playerStats.push(stats)
    //     }
    //     return Promise.all(playerStats)
    //     } catch(e) {
    //     console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`)
    //   }
    // }

    // const res = await pageNumbers.reduce(async (promise, page) => {
    //   await promise
    //   await promiseTimeout(getPlayersFromPage(page),4000)
    //   // console.log(players)
    // }, Promise.resolve())

    // console.log(res)
    // return res
  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`);
  }
}
// main()
// const pages = await getPageNumbers()
// console.log(pages)
// const links = await getPlayersFromPage(2)
// console.log(links)
// const messi = await getPlayerStats(7511)
// console.log(messi)
