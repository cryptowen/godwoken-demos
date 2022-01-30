# Godwoken Demos

## Quick Start

```bash
yarn install
cp .env.testnet .env

# run assets demo
npx ts-node gw-scripts/assets.ts

# run contracts demo
npx hardhat compile
npx ts-node gw-scripts/contract.ts
```