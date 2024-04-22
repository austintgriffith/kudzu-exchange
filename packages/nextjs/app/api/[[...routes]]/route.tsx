/** @jsxImportSource frog/jsx */

/* eslint-disable react/jsx-key */
import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { PublicClient, createPublicClient, decodeEventLog, http, isAddress } from "viem";
import { base, mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";
import scaffoldConfig from "~~/scaffold.config";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const mainnetPublicClient: PublicClient = createPublicClient({
  chain: mainnet,
  transport: http(`${mainnet.rpcUrls.alchemy.http[0]}/${scaffoldConfig.alchemyApiKey}`),
});

const abi = deployedContracts[base.id].BasedKudzuContainer.abi;
const kudzuAbi = externalContracts[base.id].KUDZU.abi;
const contractAddress = deployedContracts[base.id].BasedKudzuContainer.address;
const kudzyContractAddress = externalContracts[base.id].KUDZU.address;

const baseUrl = process.env.VERCEL_URL ? `https://kudzu.exchange` : `http://localhost:${process.env.PORT || 3000}`;

type State = {
  address: string;
  ens: string;
};

const app = new Frog<{ State: State }>({
  basePath: "/api",
  initialState: {
    address: "",
    ens: "",
  },
});

// Initial Frame
app.frame("/", c => {
  return c.res({
    action: "/check-address",
    image: `${baseUrl}/kudzu-frame-initial-og.png`,
    intents: [<TextInput placeholder="ENS or 0xAddressToInfect" />, <Button>Infect</Button>],
  });
});

// Check if inputText is a valid address or ENS and store to state
app.frame("/check-address", async c => {
  const { inputText = "", deriveState } = c;

  // Input is a valid address
  if (isAddress(inputText)) {
    deriveState(prevState => {
      if (isAddress(inputText)) {
        prevState.address = inputText;
      }
    });

    return c.res({
      action: "/finish",
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
          <div style={{ display: "flex" }}>The Address:</div>
          <div style={{ display: "flex", fontSize: 44 }}>{inputText}</div>
          <div style={{ display: "flex", paddingTop: 24 }}>Is Ready To Infect</div>
        </div>
      ),
      intents: [<Button.Transaction target="/infect">Infect!</Button.Transaction>],
    });
  }

  try {
    const ensAddress = await mainnetPublicClient.getEnsAddress({
      name: normalize(inputText),
    });

    // Input is a valid ENS address on Mainnet
    if (ensAddress) {
      deriveState(prevState => {
        if (isAddress(ensAddress)) {
          prevState.address = ensAddress;
          prevState.ens = inputText;
        }
      });

      return c.res({
        action: "/finish",
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
            <div style={{ display: "flex" }}>The Address:</div>
            <div style={{ display: "flex", fontSize: 44 }}>{ensAddress}</div>
            <div style={{ display: "flex", paddingTop: 24 }}>Is Ready To Infect</div>
          </div>
        ),
        intents: [<Button.Transaction target="/infect">Infect!</Button.Transaction>],
      });
    }
  } catch (error) {
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
          <div style={{ display: "flex" }}>Invalid Address or ENS</div>
          <div style={{ display: "flex" }}>Please Try Again!</div>
        </div>
      ),
      intents: [<TextInput placeholder="ENS or 0xAddressToInfect" />, <Button>Try Again</Button>],
    });
  }

  // Input is NOT valid address or ENS
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
        <div style={{ display: "flex" }}>Invalid Address or ENS</div>
        <div style={{ display: "flex" }}>Please Try Again!</div>
      </div>
    ),
    intents: [<TextInput placeholder="ENS or 0xAddressToInfect" />, <Button>Try Again</Button>],
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
      // Getting Infect To Address from Event Logs
      const topics = decodeEventLog({
        abi: kudzuAbi,
        data: "0x",
        topics: transaction.logs[3].topics as [],
      });

      let toAddress = transaction.from;
      if (topics.eventName === "Infect") {
        toAddress = topics.args.to as `0x${string}`;
      }

      const tokenId = await getTokenId(toAddress);

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
  const { previousState } = c;

  if (isAddress(previousState.address)) {
    const addressToInfect = previousState.address as `0x${string}`;

    return c.contract({
      abi,
      chainId: `eip155:${base.id}`,
      functionName: "publiclyInfect",
      args: [addressToInfect],
      to: contractAddress,
    });
  }

  return c.error({
    message: "Invalid Address",
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
