import Web3 from "web3";
import Items from "../models/item.model.js";

const image = 'https://i.ibb.co/pRysfRn/transparent.png';

const positions = ['DEF', 'ATT', 'MID'];
function getAttributes() { return [
  {
        "trait_type": "Position",
        "value": positions[Math.floor(Math.random() * positions.length)]
  },
  {
        "trait_type": "DefRating",
        "value": Math.floor(Math.random() * 99)
  },
  {
        "trait_type": "AttRating",
        "value": Math.floor(Math.random() * 99)
  },
  {
        "trait_type": "Nationality",
        "value": "Mexico"
  },
  {
        "trait_type": "Hairstyle",
        "value": "hair 4"
  },
  {
        "trait_type": "Eyes",
        "value": "eye 1"
  },
  {
        "trait_type": "Body",
        "value": "female 1"
  },
  {
        "trait_type": "Tshirt",
        "value": "blue"
  }
]}

let name = 'NFTshootout Legend Series'
let description = 'This NFT player card is Part of the NFTshootout Legend collection V1 Series, this player is part of our Unreal engine developed football game and can be used in conjunction with our play-to-earn game to earn daily SHOO token rewards. Find out more at https://nftshootout.com/'

async function updateItem(item) {
    
  return new Promise(async function (resolve, reject) {

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    item.attributes = getAttributes();
    item.image = image;
    item.name = name;
    item.description = description;

    if (item.listPrice) {
      item.listPrice = await Web3.utils.fromWei(item.listPrice.toString(), 'ether')
    }

    Items.findOneAndUpdate({collectionAddress: item.collectionAddress, tokenId: item.tokenId }, item, options, function (error, result) {
      if (error) reject(error);
      resolve(result);
    });
  });
}

export { updateItem };
