/** @jsxImportSource frog/jsx */
import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";

const app = new Frog({
  basePath: "/api",
});

app.frame("/", c => {
  const { buttonValue, status } = c;
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        {status === "initial" ? "Select your fruit!" : `Selected: ${buttonValue}`}
      </div>
    ),
    intents: [
      <Button key="apple" value="apple">
        Apple
      </Button>,
      <Button key="banana" value="banana">
        Banana
      </Button>,
      <Button key="mango" value="mango">
        Mango
      </Button>,
    ],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
