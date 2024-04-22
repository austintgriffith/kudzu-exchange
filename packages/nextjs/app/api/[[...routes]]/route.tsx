/** @jsxImportSource frog/jsx */

/* eslint-disable react/jsx-key */
import { Box, Heading, Spacer, vars } from "./ui.js";
import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { createPublicClient, http, isAddress } from "viem";
import { base, mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";
import scaffoldConfig from "~~/scaffold.config";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

const mainnetPublicClient = createPublicClient({
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
  ui: { vars },
});

// Initial Frame
app.frame("/", c => {
  return c.res({
    action: "/check-address",
    image: `${baseUrl}/kudzu-frame-initial-og.png`,
    intents: [<TextInput placeholder="ENS or 0xAddressToInfect" />, <Button>Infect</Button>],
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

// Check if inputText is a valid address or ENS and store to state
app.frame("/check-address", async c => {
  const { inputText = "", deriveState } = c;

  // Input is a valid address
  if (isAddress(inputText)) {
    const tokenId = await getTokenId(inputText);
    if (tokenId) {
      return c.res({
        image: (
          <Box grow alignVertical="center" background="background" padding="32">
            <Heading color="text" align="center">
              This Address Is Already Infected!
            </Heading>
          </Box>
        ),
        intents: [<TextInput placeholder="ENS or 0xAddressToInfect" />, <Button>Try Another Address</Button>],
      });
    }

    deriveState(prevState => {
      prevState.address = inputText;
    });

    return c.res({
      action: "/finish",
      image: (
        <Box grow alignVertical="center" background="background" padding="32" gap="8">
          <Heading color="text" align="center">
            The Address:
          </Heading>
          <Heading color="text" align="center" size="24">
            {inputText}
          </Heading>
          <Spacer size="4" />
          <Heading color="text" align="center">
            Is Ready To Infect
          </Heading>
        </Box>
      ),
      intents: [<Button.Transaction target="/infect">Infect!</Button.Transaction>],
    });
  }

  try {
    const ensAddress = await mainnetPublicClient.getEnsAddress({
      name: normalize(inputText),
    });

    // Input is a valid ENS address on Mainnet
    if (ensAddress && isAddress(ensAddress)) {
      deriveState(prevState => {
        prevState.address = ensAddress;
        prevState.ens = inputText;
      });

      return c.res({
        action: "/finish",
        image: (
          <Box grow alignVertical="center" background="background" padding="32" gap="8">
            <Heading color="text" align="center">
              The Address:
            </Heading>
            <Heading color="text" align="center" size="24">
              {ensAddress}
            </Heading>
            <Spacer size="4" />
            <Heading color="text" align="center">
              Is Ready To Infect
            </Heading>
          </Box>
        ),
        intents: [<Button.Transaction target="/infect">Infect!</Button.Transaction>],
      });
    }
  } catch (error) {
    return c.res({
      image: (
        <Box grow alignVertical="center" background="background" padding="32" gap="8">
          <Heading color="text" align="center">
            Invalid Address or ENS
          </Heading>
          <Heading color="text" align="center">
            Please Try Again!
          </Heading>
        </Box>
      ),
      intents: [<TextInput placeholder="ENS or 0xAddressToInfect" />, <Button>Try Again</Button>],
    });
  }

  // Input is NOT valid address or ENS
  return c.res({
    image: (
      <Box grow alignVertical="center" background="background" padding="32" gap="8">
        <Heading color="text" align="center">
          Invalid Address or ENS
        </Heading>
        <Heading color="text" align="center">
          Please Try Again!
        </Heading>
      </Box>
    ),
    intents: [<TextInput placeholder="ENS or 0xAddressToInfect" />, <Button>Try Again</Button>],
  });
});

app.frame("/finish", async c => {
  const { transactionId, previousState } = c;
  const blockExplorerUrl = `${base.blockExplorers.default.url}/tx/${transactionId}`;

  if (transactionId) {
    const transaction = await publicClient.waitForTransactionReceipt({
      hash: transactionId,
    });

    // If the transaction was "success", get the tokenId and image of the new virus NFT.
    if (transaction.status === "success") {
      const tokenId = await getTokenId(previousState.address);

      const imageUrl = `https://virus.folia.app/img/base/${tokenId}`;
      const openSeaUrl = `https://opensea.io/assets/base/0x94e84f2dbb9b068ea01db531e7343ec2385b7052/${tokenId}`;

      return c.res({
        image: (
          <Box grow alignVertical="center" background="background" padding="32" gap="8">
            <Heading color="text" align="center">
              Infection Successful
            </Heading>
            <Box width="100%" alignHorizontal="center">
              {tokenId && <img alt="virus" src={imageUrl} width={400} height={400} />}
            </Box>
          </Box>
        ),
        intents: [
          <Button.Link href={openSeaUrl}>View On OpenSea</Button.Link>,
          <Button.Link href={blockExplorerUrl}>View Transaction</Button.Link>,
        ],
      });
    }

    // If for some reason the tx wasn't "success" - Just show the tx id.
    return c.res({
      image: (
        <Box grow alignVertical="center" background="background" padding="32" gap="8">
          <Heading color="text" align="center">
            Unable to find Transaction Id
          </Heading>
        </Box>
      ),
    });
  }

  // If all else fails
  return c.res({
    image: (
      <Box grow alignVertical="center" background="background" padding="32" gap="8">
        <Heading color="text" align="center">
          Transaction Id:
        </Heading>
        <Heading color="text" align="center" size="20">
          {transactionId}
        </Heading>
      </Box>
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

export const dynamic = "force-dynamic";

export const GET = handle(app);
export const POST = handle(app);
