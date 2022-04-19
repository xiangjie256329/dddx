const { Contract, getDefaultProvider, Wallet,BigNumber } = require('ethers');
const { ethers } = require("hardhat");
let web3 = require('web3');

const provider = getDefaultProvider('https://eth.bd.evmos.dev:8545');
const wallet = new Wallet('0x7ed0406c0ac231bb75288ec906c1284c902583c7baf098bf662faedbbc32d336', provider);

const GasLimit = 1050000;
const Unit = 1000000000000000000n
let unit = ethers.BigNumber.from("1000000000000000000");

const BaseV1_contractAddr = "0x3118A3152bc99f6f8d7eFcd7E90C3d80C033ACab";
let BaseV1_json = require('../artifacts/contracts/BaseV1-token.sol/BaseV1.json');
const BaseV1_abi = BaseV1_json.abi;
const BaseV1_contractHandler = new Contract(BaseV1_contractAddr, BaseV1_abi, wallet);

const BaseV1GaugeFactory_contractAddr = "0xF62e82D7C293a996763784DA0D1db066032C9b41";
let BaseV1GaugeFactory_json = require('../artifacts/contracts/BaseV1-gauges.sol/BaseV1GaugeFactory.json');
const BaseV1GaugeFactory_abi = BaseV1GaugeFactory_json.abi;
const BaseV1GaugeFactory_contractHandler = new Contract(BaseV1GaugeFactory_contractAddr, BaseV1GaugeFactory_abi, wallet);

const BaseV1BribeFactory_contractAddr = "0xA5b1624d1F9a317f9D5FC963628A2224c284A053";
let BaseV1BribeFactory_json = require('../artifacts/contracts/BaseV1-bribes.sol/BaseV1BribeFactory.json');
const BaseV1BribeFactory_abi = BaseV1BribeFactory_json.abi;
const BaseV1BribeFactory_contractHandler = new Contract(BaseV1BribeFactory_contractAddr, BaseV1BribeFactory_abi, wallet);

const BaseV1Factory_contractAddr = "0xd1ad2Eac761C47d898D6d15e7AE36B5C2168CC55";
let BaseV1Factory_json = require('../artifacts/contracts/BaseV1-core.sol/BaseV1Factory.json');
const BaseV1Factory_abi = BaseV1Factory_json.abi;
const BaseV1Factory_contractHandler = new Contract(BaseV1Factory_contractAddr, BaseV1Factory_abi, wallet);

const BaseV1Router01_contractAddr = "0x64069685DEe0Aff487326f4D5dF80a48F0CC4226";
let BaseV1Router01_json = require('../artifacts/contracts/BaseV1-periphery.sol/BaseV1Router01.json');
const BaseV1Router01_abi = BaseV1Router01_json.abi;
const BaseV1Router01_contractHandler = new Contract(BaseV1Router01_contractAddr, BaseV1Router01_abi, wallet);

const VE_contractAddr = "0x9B7047aa4caE8f7Bf3a2556E23431F5e5f851f61";
let ve_json = require('../artifacts/contracts/ve.sol/ve.json');
const ve_abi = ve_json.abi;
const VE_contractHandler = new Contract(VE_contractAddr, ve_abi, wallet);

const VE_dist_contractAddr = "0x29c11FF8cD76B7179AcCb725370E91C73E5171d2";
let ve_dist_json = require('../artifacts/contracts/ve_dist.sol/ve_dist.json');
const ve_dist_abi = ve_dist_json.abi;
const VE_dist_contractHandler = new Contract(VE_dist_contractAddr, ve_dist_abi, wallet);

const BaseV1Voter_contractAddr = "0x832951c4cF40f7AEC1B3077683debF537A49C148";
let BaseV1Voter_json = require('../artifacts/contracts/BaseV1-voter.sol/BaseV1Voter.json');
const BaseV1Voter_abi = BaseV1Voter_json.abi;
const BaseV1Voter_contractHandler = new Contract(BaseV1Voter_contractAddr, BaseV1Voter_abi, wallet);

const BaseV1Minter_contractAddr = "0x33900c2e8aabBacD790Ec6e33F9e2D8Dd9fC6928";
let BaseV1Minter_json = require('../artifacts/contracts/BaseV1-minter.sol/BaseV1Minter.json');
const BaseV1Minter_abi = BaseV1Minter_json.abi;
const BaseV1Minter_contractHandler = new Contract(BaseV1Minter_contractAddr, BaseV1Minter_abi, wallet);

async function Test_BaseV1Mint() {
    try {
        console.log("----------- Test_BaseV1 token-----------");
        //await token.mint(receiver, ethers.BigNumber.from("1000000000000000000000000000"));
        //let hash = await BaseV1_contractHandler.mint("0x07e2aA78C573f7e3C15be6432B0e0911c95Deff6",ethers.BigNumber.from("10000000000000000000000000"), { gasLimit: GasLimit });
        let minter = await BaseV1_contractHandler.minter();
        console.log("minter:",minter);
        //console.log("mint hash:",hash);
        console.log("successful Test_BaseV1!");        
    } catch (e) {
        console.log("Test_BaseV1 err ==>",e);
    }
}

async function Test_BaseV1() {
    try {
        console.log("----------- Test_BaseV1 token-----------");
        let name = await BaseV1_contractHandler.name();
        let symbol = await BaseV1_contractHandler.symbol();
        console.log("token name:",name);
        console.log("token symbol:",symbol);
        console.log("successful Test_BaseV1!");        
    } catch (e) {
        console.log("Test_BaseV1 err ==>",e);
    }
}

async function Test_BaseV1GaugeFactory() {
    try {
        console.log("----------- Test_BaseV1GaugeFactory -----------");
        let last_gauge = await BaseV1BribeFactory_contractHandler.last_gauge();
        console.log("last_gauge:",last_gauge);
        console.log("successful Test_BaseV1GaugeFactory!");        
    } catch (e) {
        console.log("Test_BaseV1GaugeFactory err ==>",e);
    }
}

async function Test_BaseV1BribeFactory() {
    try {
        console.log("----------- Test_BaseV1BribeFactory -----------");
        let last_gauge = await BaseV1GaugeFactory_contractHandler.last_gauge();
        console.log("last_gauge:",last_gauge);
        console.log("successful Test_BaseV1BribeFactory!");        
    } catch (e) {
        console.log("Test_BaseV1BribeFactory err ==>",e);
    }
}

async function Test_BaseV1Factory() {
    try {
        console.log("----------- Test_BaseV1Factory -----------");
        let allPairsLength = await BaseV1Factory_contractHandler.allPairsLength();
        console.log("allPairsLength:",allPairsLength);
        console.log("successful Test_BaseV1Factory!");        
    } catch (e) {
        console.log("Test_BaseV1Factory err ==>",e);
    }
}

async function Test_BaseV1Router01() {
    try {
        console.log("----------- Test_BaseV1Router01 -----------");
        let factory = await BaseV1Router01_contractHandler.factory();
        console.log("factory:",factory);
        let wftm = await BaseV1Router01_contractHandler.wftm();
        console.log("wftm:",wftm);
        console.log("successful Test_BaseV1Router01!");        
    } catch (e) {
        console.log("Test_BaseV1Router01 err ==>",e);
    }
}

async function Test_VE() {
    try {
        console.log("----------- Test_VE -----------");
        let supply = await VE_contractHandler.supply();
        console.log("ve supply:",supply.toString());
        console.log("balanceOfNFT:",await VE_contractHandler.balanceOfNFT(0));
        console.log("successful Test_VE!");        
    } catch (e) {
        console.log("Test_VE err ==>",e);
    }
}

async function Test_VE_Dist() {
    try {
        console.log("----------- Test_VE_Dist -----------");
        let start_time = await VE_dist_contractHandler.start_time();
        console.log("start_time:",start_time.toString());
        console.log("time_cursor:",await VE_dist_contractHandler.time_cursor());
        console.log("successful Test_VE_Dist!");        
    } catch (e) {
        console.log("Test_VE_Dist err ==>",e);
    }
}

async function Test_BaseV1Voter() {
    try {
        console.log("----------- Test_BaseV1Voter -----------");
        let _ve = await BaseV1Voter_contractHandler._ve();
        console.log("_ve:",_ve);
        let gaugefactory = await BaseV1Voter_contractHandler.gaugefactory();
        console.log("gaugefactory:",gaugefactory);
        console.log("successful Test_BaseV1Voter!");        
    } catch (e) {
        console.log("Test_BaseV1Voter err ==>",e);
    }
}

async function Test_BaseV1Minter() {
    try {
        console.log("----------- Test_BaseV1Minter -----------");
        let _token = await BaseV1Minter_contractHandler._token();
        console.log("_token:",_token);
        let _voter = await BaseV1Minter_contractHandler._voter();
        console.log("_voter:",_voter);
        console.log("successful Test_BaseV1Minter!");        
    } catch (e) {
        console.log("Test_BaseV1Minter err ==>",e);
    }
}


async function main() {
    //Test_BaseV1Minter();
    //Test_BaseV1Voter();
    //Test_BaseV1Mint();
    //Test_BaseV1();
    //Test_BaseV1GaugeFactory();
    //Test_BaseV1BribeFactory();
    //Test_BaseV1Factory();
    //Test_BaseV1Router01();
    //Test_VE();
    //Test_VE_Dist();
    
}

main().catch(err => {
    console.log("error", err);
})