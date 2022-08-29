import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function getPageNumbers() {
  try {
	  const response = await fetch('https://pesdb.net/pes2021/');
	  const data = await response.text();
    const $ = cheerio.load(data)

  	let pageNumberArray = [];
  	$('.pages > a').each((_, e) => {
      const number = Number($(e).text());
      console.log(number)
  		pageNumberArray.push(number)
  	});
  	const max = Math.max(...pageNumberArray);
  	pageNumberArray = [...Array(Number(max)).keys()];
  	pageNumberArray.shift();

  	const pageNumbersArray = [];
  	pageNumberArray.forEach((item) => {
  		const link = 'https://pesdb.net/pes2021/?page=';
  		const linkNumber = String(item);
  		pageNumbersArray.push(link.concat(linkNumber));
  	});
    return pageNumbersArray

  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`)
  }
}
// getPageNumbers()
// getPageNumbers().then((data) => data.forEach((page) => getPlayersFromPage(page)))

async function getPlayersFromPage(index) {
  try {
  const response = await fetch(`https://pesdb.net/pes2021/?page=${Number(index)}`)
  const data = await response.text()
  const $ = cheerio.load(data)

  let playerId = []
  $('.players tbody tr').each((i, elem) => {
    const link = $(elem).find('td a').attr('href')
    link 
      ? playerId.push(link.slice(6))
      : null
  })
  // console.log(playerId)
  return playerId

  } catch(e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`)
  }
}

async function getPlayerStats(id) {
  try {
    // fetch the player's page and load cheerio
    const page = `https://pesdb.net/pes2021/?id=${id}`
    const response = await fetch(page)
    const data = await response.text()
    const $ = cheerio.load(data)

    // store the cheerio values of the elements we want to traverse in
    const table = $('.player tbody tr').first()
    const playerInfo = table.find('td').first()
    const playerStatsOne = playerInfo.next()
    const playerStatsTwo = playerStatsOne.next() 
    const playerStyles = playerStatsTwo.next()

    // create empty arrays to store the information we want
    let info = []
    let stats = []
    let items = []

    // function to get the information we need and the way we want it
    function pushStat(element, arr) {
      let el = $(element).find('th').text().trim().slice(0,-1)
      el = el.replace(/\s/g,'')
      let val = $(element).find('td').text().trim()
      el && val 
        ? arr.push({[el]: val})
        : null 
    }
    // get the player's information and push to the array
    playerInfo.find('table tbody tr').each((i, elem) => pushStat(elem, info))
    items.push(info)

    // get player's playable positions and push to the info array
    let bestPos = []
    let goodPos = []
    const positions = playerInfo.find('.positions div span')
    positions.each((i, elem) => {
      if ($(elem).attr('class') === 'pos2') {
        const pos = $(elem).text().trim()
        bestPos.push({pos})
      }
      if ($(elem).attr('class') === 'pos1') {
        const pos = $(elem).text().trim()
        goodPos.push({pos})
      }
    })
    info.push({ BestPositions: bestPos })
    info.push({ GoodPositions: goodPos })

    // get player's playing styles and push to the array
    let styles = []
    playerStyles.find('table tbody tr').each((index, elem) => {
      const item = $(elem).text()
      styles.push({index, style: item})
    })
    const ids = styles.map(obj => obj.index)
    const idToRemove = styles.findIndex((item) => item.style === 'COM Playing Styles')
    const highestId = Math.max.apply(null,ids)
    styles.splice(idToRemove,highestId)
    const newStyles = styles.map(item => item.style)
    info.push({PlayingStyles: [newStyles]})

    // get the player's stats and push to the array
    playerStatsOne.find('table tbody tr').each((i, elem) => pushStat(elem, stats))
    playerStatsTwo.find('table tbody tr').each((i, elem) => pushStat(elem, stats))
    items.push(stats)
  
    // console.log(items)

  } catch (e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`)
  }
}

function delay(t, val) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(val)
    }, t)
  })
}

async function main() {
  try {
    // for each page number, run getPlayersFromPage with a timeout
   
    const pageNumbers = await getPageNumbers()

    // this works but only returns the first page
    // await pageNumbers.reduce(async (promise, page) => {
    //   await promise
    //   const players = await getPlayersFromPage(page)
    //   console.log(players)
    // }, Promise.resolve())
    //

    pageNumbers.forEach(async (page) => {
      const players = await getPlayersFromPage(page)
      console.log(players)
    }) 

  } catch(e) {
    console.error(`[ DEU RUIM AQUI Ó JOGADOR ] : ${e}`)
  }
}
// main()
