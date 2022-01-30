// eslint-disable-next-line node/no-unpublished-import
import * as dotenv from "dotenv";
import { ContractFactory, ethers } from "ethers";
import { PolyjuiceConfig, AbiItems } from "@polyjuice-provider/base";
import {
  PolyjuiceWallet,
  PolyjuiceJsonRpcProvider,
} from "@polyjuice-provider/ethers";

dotenv.config();

const txOverrides = {
  gasPrice: 0,
  gasLimit: 100_000_000,
};

async function main() {
  console.log("-----start-----");

  // init provider
  const abi = require("../artifacts/contracts/erc20.sol/GLDToken.json").abi;
  const bytecode =
    require("../artifacts/contracts/erc20.sol/GLDToken.json").bytecode;
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: abi,
    web3Url: process.env.RPC_URL,
  };
  const rpc = new PolyjuiceJsonRpcProvider(
    polyjuiceConfig,
    polyjuiceConfig.web3Url
  );
  await rpc.godwoker.init();
  const deployer = new PolyjuiceWallet(
    process.env.DEPLOYER_PRIVATE_KEY!,
    polyjuiceConfig,
    rpc
  );
  const user = new PolyjuiceWallet(
    process.env.USER_PRIVATE_KEY!,
    polyjuiceConfig,
    rpc
  );
  const deployerGodwokenAddr = rpc.godwoker.computeShortAddressByEoaEthAddress(
    deployer.address
  );
  const userGodwokenAddr = rpc.godwoker.computeShortAddressByEoaEthAddress(
    user.address
  );
  console.log(`deployer ETH eoa address: ${deployer.address}`);
  console.log(`deployer godwoken short address: ${deployerGodwokenAddr}`);
  console.log(`user ETH eoa address: ${user.address}`);
  console.log(`user godwoken short address: ${userGodwokenAddr}`);

  // deploy erc20 contract
  console.log("---- deploy erc20 contract");
  const erc20Factory = new ContractFactory(abi, bytecode, deployer);
  const deployArgs = [ethers.utils.parseEther("100")];
  const newDeployArgs = await deployer.convertDeployArgs(
    deployArgs,
    abi as AbiItems,
    bytecode
  );
  const tx = erc20Factory.getDeployTransaction(...newDeployArgs);
  tx.gasPrice = 0;
  tx.gasLimit = 100_000_000;
  const txResp = await deployer.sendTransaction(tx);
  console.log(`txHash: ${txResp.hash}`);
  const receipt = await txResp.wait();
  const contractAddr = receipt.contractAddress;
  console.log(`contractAddr: ${contractAddr}`);

  // get balance and transfer erc20
  const erc20 = await erc20Factory.attach(contractAddr);
  console.log(
    `deployer erc20Balance: ${ethers.utils.formatUnits(
      await erc20.balanceOf(deployer.address)
    )}`
  );
  console.log(
    `user erc20Balance: ${ethers.utils.formatUnits(
      await erc20.balanceOf(user.address)
    )}`
  );
  console.log("---- transfer from deployer to user");
  const tmpTx = await erc20
    .connect(deployer)
    .transfer(user.address, ethers.utils.parseEther("0.1"), txOverrides);
  await tmpTx.wait();
  console.log(
    `deployer erc20Balance: ${ethers.utils.formatUnits(
      await erc20.balanceOf(deployer.address)
    )}`
  );
  console.log(
    `user erc20Balance: ${ethers.utils.formatUnits(
      await erc20.balanceOf(user.address)
    )}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
