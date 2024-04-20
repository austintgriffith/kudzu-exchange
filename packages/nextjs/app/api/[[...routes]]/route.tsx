/** @jsxImportSource frog/jsx */
import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { base } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";

const abi = deployedContracts[base.id].BasedKudzuContainer.abi;
const contractAddress = deployedContracts[base.id].BasedKudzuContainer.address;

const baseUrl = process.env.VERCEL_URL ? `https://kudzu.exchange` : `http://localhost:${process.env.PORT || 3000}`;

const app = new Frog({
  basePath: "/api",
});

app.frame("/", c => {
  return c.res({
    action: "/finish",
    image: `${baseUrl}/kudzu-frame-initial-og.png`,
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
  });
});

app.transaction("/infect", c => {
  const addressToInfect = c.inputText as `0x${string}`;

  // Contract transaction response.
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
