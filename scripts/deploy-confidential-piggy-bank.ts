import { network } from "hardhat";

const { viem } = await network.create();
const [deployer] = await viem.getWalletClients();
const publicClient = await viem.getPublicClient();

console.log(`Deploying ConfidentialPiggyBank from ${deployer.account.address}`);

const piggyBank = await viem.deployContract("ConfidentialPiggyBank");
const bytecode = await publicClient.getCode({
  address: piggyBank.address,
});
if (!bytecode || bytecode === "0x") {
  throw new Error("ConfidentialPiggyBank deployment produced no bytecode.");
}

console.log(`ConfidentialPiggyBank=${piggyBank.address}`);
console.log(`Owner=${deployer.account.address}`);
