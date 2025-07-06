// console.log("hello amigos")

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import urlParser from "url";

// cache seen URLs
const seenUrl = {};


const getUrl = (link, base) => {
  try {
    const final = new URL(link, base).href;
    return final;
  } catch (e) {
    console.warn(`Skipping invalid URL → link: '${link}' base: '${base}'`);
    return null;
  }
};

const crawl = async ({ url }) => {
  if (seenUrl[url]) return;

  console.log("Visiting :", url);
  seenUrl[url] = true;

  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  // collext a tag
  const links = $("a")
    .map((i, link) => link.attribs.href)
    .get();

  // create image folder
  if (!fs.existsSync("images")) {
    fs.mkdirSync("images", { recursive: true });
  }

  // collext image url
  const imageUrls = $("img")
    .map((i, img) => img.attribs.src)
    .get()
    .filter(
      (src) => src && !src.startsWith("data:") && !src.startsWith("javascript:")
    );

  for (const imageSrc of imageUrls) {
    const imageFullUrl = getUrl(imageSrc, url);
    if (!imageFullUrl) continue;

    try {
      const res = await fetch(imageFullUrl);
      const filename = path.basename(imageFullUrl);
      const dest = fs.createWriteStream(`images/${filename}`);
      res.body.pipe(dest);
      console.log(`Downloaded: ${filename}`);
    } catch (err) {
      console.error(`Failed to download ${imageFullUrl}:`, err.message);
    }
  }

  console.log("Image URLs:", imageUrls);

  
  const { host } = urlParser.parse(url);

  for (const link of links) {
    const fullUrl = getUrl(link, url);
    if (fullUrl && fullUrl.includes(host)) {
      crawl({ url: fullUrl });
    }
  }
};


//url:pass you url to crawl

// crawl({ url: "https://ayuzhk.vercel.app" });
// crawl({ url: "https://milind537.vercel.app/gallery" });
crawl({ url: "https://stevescooking.blogspot.com/" });
// crawl({ url: "https://www.w3schools.com/html/html_images.asp" });
