use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("Hj37e5VAkryq5LUUJVes7AGxZbWQ2jXMjhC4NxCS71kR");

#[program]
mod multi_withdraw {
    use super::*;
    pub fn withdraw_sol<'info>(
        ctx: Context<'_, '_, '_, 'info, WithdrawSOL<'info>>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        let len = ctx.remaining_accounts.len();

        for i in 0..len {
            let account = ctx.remaining_accounts.get(i).unwrap().to_account_info();
            let amount = *amounts.get(i).unwrap();
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.signer.to_account_info(),
                        to: account,
                    },
                ),
                amount,
            )?;
        }
        Ok(())
    }

    pub fn withdraw_token<'info>(
        ctx: Context<'_, '_, '_, 'info, WithdrawToken<'info>>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        let len = ctx.remaining_accounts.len();

        for i in 0..len {
            let account = ctx.remaining_accounts.get(i).unwrap().to_account_info();
            let amount = *amounts.get(i).unwrap();

            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.sender_token.to_account_info(),
                        to: account,
                        authority: ctx.accounts.signer.to_account_info(),
                    },
                ),
                amount,
            )?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct WithdrawSOL<'info> {
    // We must specify the space in order to initialize an account.
    // First 8 bytes are default account discriminator,
    // next 8 bytes come from NewAccount.data being type u64.
    // (u64 = 64 bits unsigned integer = 8 bytes)
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawToken<'info> {
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
