import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViem],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Cancun is the safe default target for current L1/L2 deployments.
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "contracts",
    tests: "test/contracts",
    cache: "cache",
    artifacts: "artifacts",
  },
};

export default config;
