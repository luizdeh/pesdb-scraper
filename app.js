import * as cheerio from "cheerio";
import fetch from "node-fetch";
import fs from 'fs'
// import { writefile } from "node:fs"
import fsPromises from "node:fs"

const output = './output'

const delay = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

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

    const testArray = [1,2,3];
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
    return tr;
  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`);
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
      el && val ? arr.push({ [el]: val }) : null;
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
    items.push({ PlayingStyles: [...newStyles] });

    // get the player's stats and push to the array
    playerStatsOne
      .find("table tbody tr")
      .each((i, elem) => pushStat(elem, stats));
    playerStatsTwo
      .find("table tbody tr")
      .each((i, elem) => pushStat(elem, stats));
    items.push(stats);

    console.log(`=> Fetched player : ${items[0].PlayerName}`);

    return items;

  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`);
  }
}

async function mcdur() {
  try {
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output)
      console.log(`Directory 'output' created successfully!`)
    }
  // await fs.promises.mkdir(path, { recursive: true })
  } catch(e) {
    console.error(e)
  }
}
mcdur()

const fetchPlayers = async (items, url) => {
  let results = [];
  for (let index = 0; index <= items.length - 1; index++) {
    await delay();
    const ids = items[index];
    console.log(`=> Fetching player ID : ${ids}`);
    const res = await fetch(`${url}${ids}`);
    results.push(res);
  }
  return results;
};

async function assemblePlayers() {
  const playerLinks = await getPlayersFromPage();
  const players = playerLinks.flat();
  const url = "https://pesdb.net/pes2021/?id=";
  const links = await fetchPlayers(players, url);
  let result = [];
  for (let i = 0; i <= links.length - 1; i++) {
    await delay();
    const data = await links[i].text();
    const player = await getPlayerStats(data);
    result.push(player);
  }
  console.log(result)
  return result
}

const getEm = async () => {
  const players = await assemblePlayers();
  console.log(`writing to file
    .
    .
    .`)
  fsPromises.writeFile('./output/players.json', JSON.stringify(players), (e) => { if (e) throw e })
  console.log(`Done!`)
}
getEm()
