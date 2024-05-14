import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import * as web3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import type { MultiWithdraw } from "../target/types/multi_withdraw";

describe("Test", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MultiWithdraw as anchor.Program<MultiWithdraw>;
  
  it("withdraw sol", async () => {
    // Generate keypair for the new account
    const kp_1 = pg.wallets.wallet1;

    await pg;

    console.log("before: ", await program.provider.connection.getBalance(kp_1.publicKey));

    // Send transaction
    const txHash = await program.methods
      .withdrawSol([new BN(1), new BN(2)])
      .accounts({
        signer: program.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .remainingAccounts([
        { pubkey: kp_1.publicKey, isSigner: false, isWritable: true },
      ])
      .signers([program.provider.wallet.payer])
      .rpc();
    console.log("after: ", await program.provider.connection.getBalance(kp_1.publicKey));
  });
  it("withdraw token", async () => {
    // Generate keypair for the new account
    const tokenMint = await splToken.createMint(
      program.provider.connection,
      program.provider.wallet.payer,
      program.provider.publicKey,
      null,
      6
    );
    const walletATA = await splToken.createAssociatedTokenAccount(
      program.provider.connection,
      program.provider.wallet.payer,
      tokenMint,
      program.provider.publicKey
    );

    await splToken.mintTo(
      program.provider.connection,
      program.provider.wallet.payer,
      tokenMint,
      walletATA,
      program.provider.wallet.payer,
      1_000_000_000
    );

    const otherWalletATA = await splToken.createAssociatedTokenAccount(
      program.provider.connection,
      pg.wallets.wallet1.keypair,
      tokenMint,
      pg.wallets.wallet1.publicKey
    );

    console.log(
      "before: ",
      await program.provider.connection.getTokenAccountBalance(walletATA),
      await program.provider.connection.getTokenAccountBalance(otherWalletATA)
    );

    // Send transaction
    const txHash = await program.methods
      .withdrawToken([new BN(1), new BN(2)])
      .accounts({
        senderToken: walletATA,
        signer: program.provider.publicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: otherWalletATA, isSigner: false, isWritable: true },
        { pubkey: otherWalletATA, isSigner: false, isWritable: true },
      ])
      .signers([program.provider.wallet.payer])
      .rpc();
    console.log(
      "after: ",
      await program.provider.connection.getTokenAccountBalance(walletATA),
      await program.provider.connection.getTokenAccountBalance(otherWalletATA)
    );
  });
});
