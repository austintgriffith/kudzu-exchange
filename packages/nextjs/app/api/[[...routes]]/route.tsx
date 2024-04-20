/** @jsxImportSource frog/jsx */
import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import deployedContracts from "~~/contracts/deployedContracts";

const abi = deployedContracts[8453].BasedKudzuContainer.abi;
const contractAddress = deployedContracts[8453].BasedKudzuContainer.address;

const app = new Frog({
  basePath: "/api",
});

app.frame("/", c => {
  return c.res({
    action: "/finish",
    image: <div style={{ color: "white", display: "flex", fontSize: 60 }}>Perform a transaction</div>,
    intents: [
      <TextInput key="0xYourAddress" placeholder="0xAddressToInfect" />,
      <Button.Transaction key="infect" target="/infect">
        Infect
      </Button.Transaction>,
    ],
  });
});

app.frame("/finish", c => {
  const { transactionId } = c;
  return c.res({
    image: <div style={{ color: "white", display: "flex", fontSize: 60 }}>Transaction ID: {transactionId}</div>,
  });
});

app.transaction("/infect", c => {
  const addressToInfect = c.inputText as `0x${string}`;

  // Contract transaction response.
  return c.contract({
    abi,
    chainId: "eip155:8453",
    functionName: "publiclyInfect",
    args: [addressToInfect],
    to: contractAddress,
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
