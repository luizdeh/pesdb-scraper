import * as cheerio from "cheerio";
import fetch from "node-fetch";
import fs from "fs";
// import { writefile } from "node:fs"
import fsPromises from "node:fs";

const output = "./output";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchPromiseUrl = async (items, url) => {
  let results = [];
  for (let index = 1; index <= items.length; index++) {
    await delay(1000);
    console.log(`=> Got links from page ${index} out of ${items.length} pages`)
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
    pageNumberArray = [...Array(Number(max)).keys()];
    pageNumberArray.shift();

    console.log(`=> Generating numbered array
      .
      .
      .`);
    // const testArray = [1,2];
    const testArray = Array.from(Array(51).keys())
    testArray.shift()
    return testArray;
    // return pageNumberArray
  } catch (e) {
    console.error(`[ ERROR - getPageNumbers ] : ${e}`);
  }
}

async function getPlayersFromPage() {
  try {
    const pageNumbers = await getPageNumbers();
    console.log(`=> Searching for links on ${pageNumbers.length} pages
      .
      .
      .`)
    const baseUrl = "https://pesdb.net/pes2021/?page=";
    const urls = await fetchPromiseUrl(pageNumbers, baseUrl);
    const tr = Promise.all(
      urls.map(async (res, index) => {
        let playersId = [];
        const data = await res.text();
        const $ = cheerio.load(data);
        $(".players tbody tr").each((i, elem) => {
          const links = $(elem).find("td a").attr("href");
          if (links) {
            playersId.push(links.slice(6));
          }
        });
        console.log(`=> Fetching player links from page ${index + 1}
          .
          .
          .`);
        return playersId.flat();
      })
    );
    return tr;
  } catch (e) {
    console.error(`[ ERROR - getPlayersFromPage ] : ${e}`);
  }
}

async function getPlayerStats(data) {
  try {
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
      el && val ? arr.push({ [el]: val }) : null
    }
    // get the player's information and push to the array
    playerInfo.find("table tbody tr").each((i, elem) => {
      pushStat(elem, info)
    })
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
    items.push({ BestPositions: [...bestPos] });
    items.push({ GoodPositions: [...goodPos] });

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
    newStyles.shift()
    items.push({ PlayingStyles: [...newStyles] });

    // get the player's stats and push to the array
    playerStatsOne
      .find("table tbody tr")
      .each((i, elem) => pushStat(elem, stats));
    playerStatsTwo
      .find("table tbody tr")
      .each((i, elem) => pushStat(elem, stats));
    items.push(stats);

    return items;
  } catch (e) {
    console.error(`[ ERROR - getPlayerStats ] : ${e}`);
  }
}

async function mcdur() {
  try {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output);
      console.log(`=> Directory 'output' created successfully!
        .
        .
        .`);
    } else {
      console.log(`=> Directory 'output' already exists, no worries.  
        .
        .
        .`)
    }
  } catch (e) {
    console.error(e);
  }
}

const fetchPlayers = async (items, url) => {
  try {
    let results = [];
    let time = items.length * 2.5
    for (let index = 0; index <= items.length - 1; index++) {
      const seconds = time - (index*2.5)
      const minutes = Math.round(seconds/60)
      const ids = items[index];
      const res = await fetch(`${url}${ids}`);
      if (index % 2 === 0) {
        await delay(3000);
        console.log(`=> Fetching player ID : ${ids}
            => ${index+1} of ${items.length} players ( ~${minutes.toFixed(0)} minute(s) to go )
          `);
        results.push(res);
      } else {
        await delay(2000);
        console.log(`=> Fetching player ID : ${ids}
            => ${index+1} of ${items.length} players ( ~${minutes.toFixed(0)} minute(s) to go )
          `);
        results.push(res);
      }
    }
    return results;
  } catch (e) {
    console.error(`[ ERROR - fetchPlayers ] : ${e}`);
  }
};

async function assemblePlayers() {
  try {
    console.log(`=> Getting ready to scrape pesdb.net (2021)
      .
      .
      .
      `)
    const playerLinks = await getPlayersFromPage();
    const players = playerLinks.flat();
    const url = "https://pesdb.net/pes2021/?id=";
    const links = await fetchPlayers(players, url);
    let result = [];
    for (let i = 0; i <= links.length - 1; i++) {
      const data = await links[i].text();
      const player = await getPlayerStats(data);
      const playerUnd = player[0].PlayerName;
      if (!playerUnd) console.log(links[i]);
      console.log(`
        => Fetched player : ${player[0].PlayerName}
          => ${i+1} of ${links.length} players
        `);
      result.push(player);
    }
    mcdur()
    console.log(`=> Writing to file: ./output/players.json
    .
    .
    .`);
    fsPromises.writeFile(
      "./output/players.json",
      JSON.stringify(result),
      (e) => {
        if (e) throw e;
      }
    );
    console.log(`=> Done!

      CAUTION: File is probably huge. Take care now, bye bye.`);
  } catch (e) {
    console.error(`[ ERROR - assemblePlayers ] : ${e}`);
  }
}

assemblePlayers();
