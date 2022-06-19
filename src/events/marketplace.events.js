import Web3 from "web3";
import { config } from "dotenv";
import { updateItem } from "../services/items.service.js";
import { marketplaceAbi } from "../abi/marketplace.js";
import abiDecoder from "abi-decoder";
import Items from "../models/item.model.js";

config();

const web3 = new Web3(process.env.NODE_URL);

const marketplaceAddress = process.env.MARKETPLACE_ADDRESS;
const transactionsToProcess = [];
const fromBlock = process.env.REPLAY_BLOCK;

abiDecoder.addABI(marketplaceAbi);

 async function start() {
  var subscription = web3.eth
    .subscribe(
      "logs",
      {
        address: marketplaceAddress,
        topics: [],
        fromBlock,
      },
      function (error, result) {
        if (error) console.log(error);
      }
    )
    .on("data", async function (trxData) {
      transactionsToProcess.push(trxData)
    })
    .on("error", function (data) {
      console.log(data)
    })
    .on("connected", function (data) {
      console.log(data)
    })
};

setInterval(function () {
  if (transactionsToProcess.length !== 0) {
    processItem(transactionsToProcess[0])
    transactionsToProcess.shift();
  }
}, 750);

function retrieveValue(array, name) {
  return array.filter((item) => item.name === name)[0].value;
}

function processItem(trxData) {
  return new Promise(async function (resolve, reject) {
    await web3.eth.getTransactionReceipt(
      trxData.transactionHash,
      function (e, receipt) {
        const decodedLogs = abiDecoder.decodeLogs(receipt.logs);
        const log = decodedLogs[0];
        let item;
        switch (log.name) {

          case "AskUpdate":
            item = {
              collectionAddress: retrieveValue(log.events, "collection"),
              owner: retrieveValue(log.events, "seller"),
              tokenId: retrieveValue(log.events, "tokenId"),
              listPrice: retrieveValue(log.events, "askPrice"),
              forSale: true,
              lastKnownUpdate: trxData.blockNumber
            };
            updateItem(item)
              .then((res) => {
                console.log("Ask Update Saved");
              })
              .catch((err) => {
                console.log(err);
              });
            break;
          case "AskCancel":
            item = {
              collectionAddress: retrieveValue(log.events, "collection"),
              owner: retrieveValue(log.events, "seller"),
              tokenId: retrieveValue(log.events, "tokenId"),
              listPrice: null,
              forSale: false,
              lastKnownUpdate: trxData.blockNumber
            };
            updateItem(item)
              .then((res) => {
                console.log("Cancel Event saved");
              })
              .catch((err) => {
                console.log(err);
              });
            break;
          case "Trade":
            item = {
              collectionAddress: retrieveValue(log.events, "collection"),
              owner: retrieveValue(log.events, "buyer"),
              tokenId: retrieveValue(log.events, "tokenId"),
              listPrice: null,
              forSale: false,
              lastKnownUpdate: trxData.blockNumber
            };
            updateItem(item)
              .then((res) => {
                console.log("Trade Event saved");
              })
              .catch((err) => {
                console.log(err);
              });
            break;
          case "AskNew":
            console.log(log.events)
            item = {
              collectionAddress: retrieveValue(log.events, "collection"),
              owner: retrieveValue(log.events, "seller"),
              tokenId: retrieveValue(log.events, "tokenId"),
              listPrice: retrieveValue(log.events, "askPrice"),
              forSale: true,
              lastKnownUpdate: trxData.blockNumber
            };
            updateItem(item)
              .then((res) => {
                console.log("Ask New Event saved");
              })
              .catch((err) => {
                console.log(err);
              });
            break;
        }
        resolve();
      })
  })

}

start();

export {};
