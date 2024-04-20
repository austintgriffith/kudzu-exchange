/** @jsxImportSource frog/jsx */

/* eslint-disable react/jsx-key */
import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

const abi = deployedContracts[base.id].BasedKudzuContainer.abi;
const kudzuAbi = externalContracts[base.id].KUDZU.abi;
const contractAddress = deployedContracts[base.id].BasedKudzuContainer.address;
const kudzyContractAddress = externalContracts[base.id].KUDZU.address;

const baseUrl = process.env.VERCEL_URL ? `https://kudzu.exchange` : `http://localhost:${process.env.PORT || 3000}`;

const app = new Frog({
  basePath: "/api",
});

app.frame("/", c => {
  return c.res({
    action: "/finish",
    image: `${baseUrl}/kudzu-frame-initial-og.png`,
    intents: [
      <TextInput placeholder="0xAddressToInfect" />,
      <Button.Transaction target="/infect">Infect</Button.Transaction>,
    ],
  });
});

async function getTokenId(address: string) {
  try {
    const tokenId = await publicClient.readContract({
      address: kudzyContractAddress,
      abi: kudzuAbi,
      functionName: "tokenOfOwnerByIndex",
      args: [address, 0n],
    });

    return tokenId.toString();
  } catch (error) {
    console.log("error", error);
  }
}

app.frame("/finish", async c => {
  const { transactionId } = c;
  const blockExplorerUrl = `${base.blockExplorers.default.url}/tx/${transactionId}`;

  if (transactionId) {
    const transaction = await publicClient.waitForTransactionReceipt({
      hash: transactionId,
    });

    if (transaction.status === "success") {
      const address = transaction.from;
      const tokenId = await getTokenId(address);

      const imageUrl = `https://virus.folia.app/img/base/${tokenId}`;
      const openSeaUrl = `https://opensea.io/assets/base/0x94e84f2dbb9b068ea01db531e7343ec2385b7052/${tokenId}`;

      return c.res({
        image: (
          <div
            style={{
              backgroundColor: "#0A0A0B",
              height: "100%",
              width: "100%",
              color: "white",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              justifyContent: "center",
              alignItems: "center",
              fontSize: 50,
              paddingTop: 24,
            }}
          >
            <div>Infection Successful</div>
            {tokenId && <img alt="virus" src={imageUrl} width={400} height={400} />}
          </div>
        ),
        intents: [
          <Button.Link href={openSeaUrl}>View On OpenSea</Button.Link>,
          <Button.Link href={blockExplorerUrl}>View Transaction</Button.Link>,
        ],
      });
    }
  }

  return c.res({
    image: (
      <div
        style={{
          backgroundColor: "#0A0A0B",
          height: "100%",
          width: "100%",
          color: "white",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          justifyContent: "center",
          alignItems: "center",
          fontSize: 40,
          paddingTop: 24,
        }}
      >
        <div>Infection Successful!</div>
        {transactionId}
      </div>
    ),
    intents: [<Button.Link href={blockExplorerUrl}>View Transaction</Button.Link>],
  });
});

app.transaction("/infect", c => {
  const addressToInfect = c.inputText as `0x${string}`;

  return c.contract({
    abi,
    chainId: `eip155:${base.id}`,
    functionName: "publiclyInfect",
    args: [addressToInfect],
    to: contractAddress,
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
