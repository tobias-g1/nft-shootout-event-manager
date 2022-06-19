import { ethers } from "ethers";
import { config } from "dotenv";
import { updateItem } from "../services/items.service.js";
import { marketplaceAbi } from "../abi/marketplace.js";
import abiDecoder from "abi-decoder";
import Items from "../models/item.model.js";
import Web3 from "web3";
import Web3WsProvider from "web3-providers-ws";
config();

const marketplaceAddress = process.env.MARKETPLACE_ADDRESS;
const web3 = new Web3(process.env.NODE_URL);
let transactionsToProcess = [];
let fromBlock = process.env.REPLAY_BLOCK;

abiDecoder.addABI(marketplaceAbi);

let wsProvider;
let contract;

const start = () => {
  wsProvider = new ethers.providers.WebSocketProvider(process.env.NODE_URL, {
    name: "binance-testnet",
    chainId: 97,
  });
  contract = new ethers.Contract(
    marketplaceAddress,
    marketplaceAbi,
    wsProvider
  );

  wsProvider._websocket.on("close", async (code) => {
    console.log("ws closed", code);
    wsProvider._websocket.terminate();
    await sleep(3000); // wait before reconnect
    start();
  });

  replay().then((res) => {
    wsProvider.on("block", (blockNumber) => {
      console.log("processing blocknumber: " + blockNumber);
      let filter = {
        address: marketplaceAddress,
      };
      wsProvider.on(filter, async (log, event) => {
        await wsProvider
          .waitForTransaction(log.transactionHash, 2)
          .then((res) => {
            if (transactionsToProcess.indexOf(log) === -1) {
              transactionsToProcess.push(log);
            }
          });
      });
    });
  });
};

function replay() {
  return new Promise(async function (resolve, reject) {
    if (!fromBlock) {
      await Items.find({})
        .sort({ lastKnownUpdate: -1 })
        .limit(1)
        .then((result, error) => {
          if (error) {
            console.log(error);
          }
          if (result.length !== 0) {
            fromBlock = result[0].lastKnownUpdate + 1;
          }
        });
    }
    let eventFilter = {
      address: marketplaceAddress,
    };
    let events = await contract.queryFilter(eventFilter, fromBlock, "latest");
    transactionsToProcess = transactionsToProcess.concat(events);
    resolve();
  });
}

setInterval(function () {
  if (transactionsToProcess.length !== 0) {
    processItem(transactionsToProcess[0]);
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
              lastKnownUpdate: trxData.blockNumber,
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
              lastKnownUpdate: trxData.blockNumber,
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
              lastKnownUpdate: trxData.blockNumber,
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
            item = {
              collectionAddress: retrieveValue(log.events, "collection"),
              owner: retrieveValue(log.events, "seller"),
              tokenId: retrieveValue(log.events, "tokenId"),
              listPrice: retrieveValue(log.events, "askPrice"),
              forSale: true,
              lastKnownUpdate: trxData.blockNumber,
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
      }
    );
  });
}

start();

export {};
