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
  // init account
  // use yokai
  // calc deposit address

  // get CKB balance
  const polyjuiceConfig: PolyjuiceConfig = {
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
  // CKB decimal is 8, not 18 for ETH
  console.log(
    `deployer CKB balance: ${ethers.utils.formatUnits(
      await deployer.getBalance(),
      8
    )}`
  );
  console.log(
    `user CKB balance: ${ethers.utils.formatUnits(await user.getBalance(), 8)}`
  );
  // console.log(
  //   `CKB balance deployer addr: ${ethers.utils.formatUnits(
  //     await rpc.getBalance(deployer.address),
  //     8
  //   )}`
  // );
  // console.log(
  //   `CKB balance shortAddr: ${ethers.utils.formatUnits(
  //     await rpc.getBalance(deployerGodwokenAddr),
  //     8
  //   )}`
  // );

  // deploy erc20 contract
  const abi = require("../artifacts/contracts/erc20.sol/GLDToken.json").abi;
  const bytecode =
    require("../artifacts/contracts/erc20.sol/GLDToken.json").bytecode;
  deployer.addAbi([abi] as AbiItems);
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
  // const contractAddr = '0x6447650e0E117963B21397B3cd64Bc75A88A4a35';

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
  console.log(
    `deployer erc20Balance: ${ethers.utils.formatUnits(
      await erc20.balanceOf(deployerGodwokenAddr)
    )}`
  );
  console.log(
    `user erc20Balance: ${ethers.utils.formatUnits(
      await erc20.balanceOf(userGodwokenAddr)
    )}`
  );
  // await erc20.connect(deployer).transfer(user.address, ethers.utils.parseEther("10"));
  // console.log(`deployer erc20Balance: ${ethers.utils.formatUnits(await erc20.balanceOf(deployerGodwokenAddr))}`);
  // console.log(`user erc20Balance: ${ethers.utils.formatUnits(await erc20.balanceOf(userGodwokenAddr))}`);
  // await erc20
  //   .connect(deployer)
  //   .transfer(userGodwokenAddr, ethers.utils.parseEther("0.1"), txOverrides);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
