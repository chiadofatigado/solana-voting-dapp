import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { VotingdappIDL, Votingdapp } from "@project/anchor";
import { AnchorError, AnchorProvider, Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: 'https://i.ibb.co/jvCb4Shz/image.png',
    title: 'Vote for your favorite food',
    description: 'Vote between burger and pizza!',
    label: 'Vote',
    links: {
      actions: [
        {
          label: 'Vote for burger',
          href: '/api/vote?candidate=Burger',
          type: 'transaction',
        },
        {
          label: 'Vote for pizza',
          href: '/api/vote?candidate=Pizza',
          type: 'transaction',
        },
      ]
    }
  };
  try {
    return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    return new Response('Error occurred', { status: 500 });
  }
}

export async function POST(request: Request) {
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const program: Program<Votingdapp> = new Program(VotingdappIDL as Votingdapp, { connection });
  const url = new URL(request.url);

  const candidate = url.searchParams.get('candidate');
  if (candidate != 'Burger' && candidate != 'Pizza') {
    return new Response('Invalid candidate', { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const body: ActionPostRequest = await request.json();
  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response('Invalid account', { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const instruction = await program.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction();

  const blockhash = await connection.getLatestBlockhash('confirmed');

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction,
      type: "transaction"
    }
  })
  return Response.json(response, {headers: ACTIONS_CORS_HEADERS });
}
