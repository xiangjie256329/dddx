const { Contract, getDefaultProvider, Wallet,BigNumber } = require('ethers');
const { ethers } = require("hardhat");
let web3 = require('web3');
const env = require("../constants");

const provider = getDefaultProvider('https://eth.bd.evmos.dev:8545');
const wallet = new Wallet(env.PRIVATE_KEY, provider);

const GasLimit = 1050000;
const Unit = 1000000000000000000n
let unit = ethers.BigNumber.from("1000000000000000000");

const BaseV1_contractAddr = "0xDF794699EEf4D23A2E064d1d431F9BaC34AFc1f0";
const BaseV1GaugeFactory_contractAddr = "0x6676F1834c394b18Ac85A0166403fE3188C61ce7";
const BaseV1BribeFactory_contractAddr = "0xd9f82c41E7DE6b3B72Bf38B97BAaAc5aF957F4bd";
const BaseV1Factory_contractAddr = "0xaa3cBD0Abd62cdC283b1B1536050387070534A22";
const BaseV1Router01_contractAddr = "0xFE1ACbAFEccb2AEBd1253F333E6631316298EE79";
const VE_contractAddr = "0x053A00745AAFeFCDc9AF7dF5F6271C45B656f6C9";
const VE_dist_contractAddr = "0x8F22b40ceBc5c9010Bb9bD83A3E39D584E6B773c";
const BaseV1Voter_contractAddr = "0xD72f9fdFF71FD8ae4001133eca63F10c789C2B3B";
const BaseV1Minter_contractAddr = "0x57586873100C519FB1ACDc5E76a02539bAc83731";

let BaseV1_json = require('../artifacts/contracts/BaseV1-token.sol/BaseV1.json');
const BaseV1_abi = BaseV1_json.abi;
const BaseV1_contractHandler = new Contract(BaseV1_contractAddr, BaseV1_abi, wallet);


let BaseV1GaugeFactory_json = require('../artifacts/contracts/BaseV1-gauges.sol/BaseV1GaugeFactory.json');
const BaseV1GaugeFactory_abi = BaseV1GaugeFactory_json.abi;
const BaseV1GaugeFactory_contractHandler = new Contract(BaseV1GaugeFactory_contractAddr, BaseV1GaugeFactory_abi, wallet);


let BaseV1BribeFactory_json = require('../artifacts/contracts/BaseV1-bribes.sol/BaseV1BribeFactory.json');
const BaseV1BribeFactory_abi = BaseV1BribeFactory_json.abi;
const BaseV1BribeFactory_contractHandler = new Contract(BaseV1BribeFactory_contractAddr, BaseV1BribeFactory_abi, wallet);

let BaseV1Factory_json = require('../artifacts/contracts/BaseV1-core.sol/BaseV1Factory.json');
const BaseV1Factory_abi = BaseV1Factory_json.abi;
const BaseV1Factory_contractHandler = new Contract(BaseV1Factory_contractAddr, BaseV1Factory_abi, wallet);

let BaseV1Router01_json = require('../artifacts/contracts/BaseV1-periphery.sol/BaseV1Router01.json');
const BaseV1Router01_abi = BaseV1Router01_json.abi;
const BaseV1Router01_contractHandler = new Contract(BaseV1Router01_contractAddr, BaseV1Router01_abi, wallet);

let ve_json = require('../artifacts/contracts/ve.sol/ve.json');
const ve_abi = ve_json.abi;
const VE_contractHandler = new Contract(VE_contractAddr, ve_abi, wallet);

let ve_dist_json = require('../artifacts/contracts/ve_dist.sol/ve_dist.json');
const ve_dist_abi = ve_dist_json.abi;
const VE_dist_contractHandler = new Contract(VE_dist_contractAddr, ve_dist_abi, wallet);

let BaseV1Voter_json = require('../artifacts/contracts/BaseV1-voter.sol/BaseV1Voter.json');
const BaseV1Voter_abi = BaseV1Voter_json.abi;
const BaseV1Voter_contractHandler = new Contract(BaseV1Voter_contractAddr, BaseV1Voter_abi, wallet);

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

async function Test_BaseV1Router01_ADD_Liquid() {
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
        console.log("balanceOfNFT:",await VE_contractHandler.balanceOfNFT(2));
        console.log("balanceof:",await VE_contractHandler.balanceOf("0x07e2aA78C573f7e3C15be6432B0e0911c95Deff6"))
        console.log("tx:",await VE_contractHandler.transferFrom("0x07e2aA78C573f7e3C15be6432B0e0911c95Deff6","0xAFB883c65A006718307cdaEE7e72ac6e4a0C99b2",2));
        //console.log("balanceOfNFT:",await VE_contractHandler.balanceOfNFT(2));
        console.log("balanceof:",await VE_contractHandler.balanceOf("0x07e2aA78C573f7e3C15be6432B0e0911c95Deff6"))
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

async function Test_BaseV1Voter_distro() {
    try {
        console.log("----------- Test_BaseV1Voter -----------");
        // let _ve = await BaseV1Voter_contractHandler._ve();
        // console.log("_ve:",_ve);
        let length = await BaseV1Voter_contractHandler.length();
        let bwhite = await BaseV1Voter_contractHandler.distro();
        console.log("length:",length);
        //console.log("createGauge:",createGauge);
        console.log("successful Test_BaseV1Voter!");        
    } catch (e) {
        console.log("Test_BaseV1Voter err ==>",e);
    }
}

async function Test_BaseV1Voter() {
    try {
        console.log("----------- Test_BaseV1Voter -----------");
        // let _ve = await BaseV1Voter_contractHandler._ve();
        // console.log("_ve:",_ve);
        // let gaugefactory = await BaseV1Voter_contractHandler.gaugefactory();
        // let bwhite = await BaseV1Voter_contractHandler.isWhitelisted("0x39021459f4E229F102B097Dc508a680400Af14EA");//DAI
        // //let createGauge = await BaseV1Voter_contractHandler.createGauge("0x9d070Ca12dF106A6823Fc77eAf6b050138A46A0a",{ gasLimit: GasLimit });
        // //let createGauge = await BaseV1Voter_contractHandler
        // console.log("gaugefactory:",gaugefactory);
        // console.log("bwhite:",bwhite);

        //query gauge by lp
        let gaugeAddr1 = await BaseV1Voter_contractHandler.gauges("0x42b93c56978d2394A14A6ca2f564B94031e0A9f4");
        let gaugeAddr2 = await BaseV1Voter_contractHandler.gauges("0x1f89De500EE943524b06155056b0e435702e888f");
        console.log("gaugeAddr1:",gaugeAddr1)
        console.log("gaugeAddr2:",gaugeAddr2)

        //query bribe by gauge
        let bribeAddr1 = await BaseV1Voter_contractHandler.bribes("0x1023f7d820a7A99dF9B0681c1f55F1AA4F88BEB2");
        let bribeAddr2 = await BaseV1Voter_contractHandler.bribes("0xD9751c693E8E9fc223e39Be7cF1691Ab73c96F87");
        console.log("bribeAddr1:",bribeAddr1)
        console.log("bribeAddr2:",bribeAddr2)
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
    //Test_BaseV1Voter_distro();
    //Test_BaseV1Minter();
    //Test_BaseV1Voter();
    //Test_BaseV1Mint();
    //Test_BaseV1();
    //Test_BaseV1GaugeFactory();
    //Test_BaseV1BribeFactory();
    //Test_BaseV1Factory();
    //Test_BaseV1Router01();
    Test_VE();
    //Test_VE_Dist();
    
}

main().catch(err => {
    console.log("error", err);
})