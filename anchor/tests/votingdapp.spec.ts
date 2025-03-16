import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { BankrunProvider, startAnchor } from 'anchor-bankrun'

// Import Types
import { Votingdapp } from '../target/types/votingdapp'
// Import IDL
import IDL from '../target/idl/votingdapp.json'

const votingAddressProgramId = new PublicKey(IDL.address)

describe('Voting', () => {

  let context;
  let provider;
  anchor.setProvider(anchor.AnchorProvider.env());
  let votingProgram = anchor.workspace.Votingdapp as Program<Votingdapp>;
  const pollId = new anchor.BN(1);
  const candidateName1 = 'Burger';
  const candidateName2 = 'Pizza';
  console.log("IDL Program ID:", votingAddressProgramId.toString());
  console.log("Workspace Program ID:", votingProgram.programId.toString());
  beforeAll(async () => {
    /* context = await startAnchor("", [{ name: "votingdapp", programId: votingAddressProgramId }], []);
    provider = new BankrunProvider(context);
    
    votingProgram = new Program<Votingdapp>(
      IDL as Votingdapp,
      provider
    ); */
    
  })

  it('Initialize Poll', async () => {


    await votingProgram.methods
    .initializePoll(
      pollId,
      "Favorite Food?", 
      new anchor.BN(1741896607), 
      new anchor.BN(1749896607)
    ).rpc();
    
    const [pollAddress, bump] = PublicKey.findProgramAddressSync(
      [pollId.toArrayLike(Buffer, 'le', 8)],
      votingAddressProgramId
    );
    
    const poll = await votingProgram.account.pollAccount.fetch(pollAddress);
    console.log("Poll Address: ", pollAddress.toString());
    console.log("Poll: ", poll);
    
    expect(poll.pollId.toNumber()).toEqual(pollId.toNumber());
    expect(poll.description).toEqual("Favorite Food?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());

  });

  it('Initialize Candidates', async () => {
    
    // Initialize Candidate one
    await votingProgram.methods.initializeCandidate(
      candidateName1,
      pollId
    ).rpc();

    // Initialize Candidate two
    await votingProgram.methods.initializeCandidate(
      candidateName2,
      pollId
    ).rpc();

    // Derive Candidate one Account PublicKey from seed
    const [candidate1Address] = PublicKey.findProgramAddressSync(
      [
        pollId.toArrayLike(Buffer, 'le', 8),
        Buffer.from(candidateName1)
      ],
      votingAddressProgramId
    )

    // Derive Candidate two Account PublicKey from seed
    const [candidate2Address] = PublicKey.findProgramAddressSync(
      [
        pollId.toArrayLike(Buffer, 'le', 8),
        Buffer.from(candidateName2)
      ],
      votingAddressProgramId
    )
    // Fetch Candidate one Account
    const candidate1 = await votingProgram.account.candidateAccount.fetch(candidate1Address);
    console.log(candidate1);
    console.log("Candidate Address: ", candidate1Address.toString());
    console.log("Candidate name: ", candidate1.candidateName.toString());

    // Check if Candidate one Account is initialized
    expect(candidate1.candidateName.toString()).toEqual(candidateName1);
    expect(candidate1.candidateVotes.toNumber()).toEqual(0);

    // Fetch Candidate two Account
    const candidate2 = await votingProgram.account.candidateAccount.fetch(candidate2Address);
    // Check if Candidate two Account is initialized
    console.log(candidate2);
    console.log("Candidate Address: ", candidate2Address.toString());
    console.log("Candidate name: ", candidate2.candidateName.toString());

    expect(candidate2.candidateName.toString()).toEqual(candidateName2);
    expect(candidate2.candidateVotes.toNumber()).toEqual(0);
  });

  it('Vote', async () => {

    // Derive Candidate one Account PublicKey from seed
    const [candidate1Address] = PublicKey.findProgramAddressSync(
      [
        pollId.toArrayLike(Buffer, 'le', 8),
        Buffer.from(candidateName1)
      ],
      votingAddressProgramId
    );

    let candidate1 = await votingProgram.account.candidateAccount.fetch(candidate1Address);
    console.log(candidate1);
    let candidate1InitialVotes = candidate1.candidateVotes.toNumber();
    
    await votingProgram.methods.vote(
      candidateName1,
      pollId
    ).rpc();

    // Fetch Candidate one Account
    candidate1 = await votingProgram.account.candidateAccount.fetch(candidate1Address);
    console.log(candidate1);
    expect(candidate1.candidateVotes.toNumber()).toEqual(candidate1InitialVotes + 1);

  });

})
