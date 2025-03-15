#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

pub const ANCHOR_DESCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod votingdapp {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        description: String,
        poll_start: u64,
        poll_end: u64,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let signer = &ctx.accounts.signer;

        // Initialize the poll account
        poll.poll_id = poll_id;
        poll.description = description;
        poll.poll_start = poll_start;
        poll.poll_end = poll_end;
        poll.candidate_amount = 0;

        msg!("Poll initialized with ID: {}", poll.poll_id);
        msg!("Poll created by: {}", signer.key());

        // Return success
        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        candidate_name: String,
        _poll_id: u64,
    ) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        let poll = &mut ctx.accounts.poll;

        poll.candidate_amount += 1;

        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1;
        msg!("Voted for candidate: {}", candidate.candidate_name);
        msg!("Candidate votes: {}", candidate.candidate_votes);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
    init,
    payer = signer,
    space = ANCHOR_DESCRIMINATOR_SIZE + PollAccount::INIT_SPACE,
    //seeds = [b"poll", signer.key().as_ref(), &[_poll_id]],
    seeds = [poll_id.to_le_bytes().as_ref()],
    bump,
  )]
    pub poll: Account<'info, PollAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    // Because we are not initializing the Poll account, we are just referencing it, we can just pass the seeds and bump
    #[account(
    mut, // We have to mark this as mutable because we are going to change the poll account with the candidate amount
    seeds = [poll_id.to_le_bytes().as_ref()],
    bump,
  )]
    pub poll: Account<'info, PollAccount>,

    #[account(
    init,
    payer = signer,
    space = ANCHOR_DESCRIMINATOR_SIZE + CandidateAccount::INIT_SPACE,
    seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_ref()],
    bump,
  )]
    pub candidate: Account<'info, CandidateAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    // Because we are not initializing the Poll account, we are just referencing it, we can just pass the seeds and bump
    #[account(
    seeds = [poll_id.to_le_bytes().as_ref()],
    bump,
  )]
    pub poll: Account<'info, PollAccount>,

    #[account(
    mut, // We have  to mark this as mutable because we are going to change the votes
    seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_ref()],
    bump,
  )]
    pub candidate: Account<'info, CandidateAccount>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct PollAccount {
    pub poll_id: u64,
    #[max_len(280)]
    pub description: String,
    pub poll_start: u64,
    pub poll_end: u64,
    pub candidate_amount: u64,
}

#[account]
#[derive(InitSpace)]
pub struct CandidateAccount {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}
