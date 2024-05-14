## Getting Started

First, setup the environment.
- Setup Ubuntu VM
- Install Rust, Solana, Anchor. https://www.anchor-lang.com/docs/installation

## Solana Program
- Create a new wallet
```bash
solana-keygen new
```
- Get faucet from https://solfaucet.com/ or https://faucet.solana.com/
- Build the program
```bash
anchor build
```
- Deploy the program
```bash
anchor deploy --provider.cluster Devnet
```