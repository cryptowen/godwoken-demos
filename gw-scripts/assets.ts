// eslint-disable-next-line node/no-unpublished-import
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { PolyjuiceConfig } from "@polyjuice-provider/base";
import {
  PolyjuiceWallet,
  PolyjuiceJsonRpcProvider,
} from "@polyjuice-provider/ethers";
import crypto from "crypto";

dotenv.config();

const txOverrides = {
  gasPrice: 0,
  gasLimit: 100_000_000,
};

async function main() {
  console.log("-----start-----");

  // init the provider with polyjuice-provider
  const erc20Abi = require("./abis/erc20.json");
  const polyjuiceConfig: PolyjuiceConfig = {
    abiItems: erc20Abi,
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
  // generate a randomUser which is not inited
  const randomUser = new PolyjuiceWallet(
    crypto.randomBytes(32).toString("hex"),
    polyjuiceConfig,
    rpc
  );
  const deployerGodwokenAddr = rpc.godwoker.computeShortAddressByEoaEthAddress(
    deployer.address
  );
  const userGodwokenAddr = rpc.godwoker.computeShortAddressByEoaEthAddress(
    user.address
  );
  const randomUserGodwokenAddr =
    rpc.godwoker.computeShortAddressByEoaEthAddress(randomUser.address);
  console.log(`deployer ETH eoa address: ${deployer.address}`);
  console.log(`deployer godwoken short address: ${deployerGodwokenAddr}`);
  console.log(`user ETH eoa address: ${user.address}`);
  console.log(`user godwoken short address: ${userGodwokenAddr}`);
  console.log(`random user ETH eoa address: ${randomUser.address}`);
  console.log(`random user godwoken short address: ${randomUserGodwokenAddr}`);

  // initialize the deployer and user account

  // get CKB balance with `getBalance`
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
  console.log(
    `random user CKB balance: ${ethers.utils.formatUnits(
      await randomUser.getBalance(),
      8
    )}`
  );

  // transfer ckb
  const ckbProxy = new ethers.Contract(
    process.env.CKB_ERC20_PROXY_ADDRESS!,
    erc20Abi,
    deployer
  );
  const CKB_DECIMAL = await ckbProxy.decimals();
  console.log("--- transfer from deployer to user");
  let tmpTx;
  tmpTx = await ckbProxy
    .connect(deployer)
    .transfer(user.address, 1, txOverrides);
  await tmpTx.wait();
  // get CKB balance with `ckbProxy.balanceOf`
  console.log(
    `deployer erc20Balance: ${ethers.utils.formatUnits(
      await ckbProxy.balanceOf(deployer.address),
      CKB_DECIMAL
    )}`
  );
  console.log(
    `user erc20Balance: ${ethers.utils.formatUnits(
      await ckbProxy.balanceOf(user.address),
      CKB_DECIMAL
    )}`
  );
  console.log("--- transfer from deployer to random user");
  tmpTx = await ckbProxy
    .connect(deployer)
    .transfer(randomUser.address, 1, txOverrides);
  await tmpTx.wait();
  console.log(
    `deployer erc20Balance: ${ethers.utils.formatUnits(
      await ckbProxy.balanceOf(deployer.address),
      CKB_DECIMAL
    )}`
  );
  console.log(
    `random user erc20Balance: ${ethers.utils.formatUnits(
      await ckbProxy.balanceOf(randomUser.address),
      CKB_DECIMAL
    )}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
