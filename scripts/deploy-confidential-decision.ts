import { network } from "hardhat";

const { viem } = await network.create();
const [deployer] = await viem.getWalletClients();

console.log(`Deploying from ${deployer.account.address}`);
const engine = await viem.deployContract("ConfidentialDecisionEngine");

console.log(`ConfidentialDecisionEngine=${engine.address}`);
