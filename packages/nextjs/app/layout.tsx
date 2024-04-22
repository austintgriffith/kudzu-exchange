import "@rainbow-me/rainbowkit/styles.css";
import { getFrameMetadata } from "frog/next";
import { Metadata } from "next";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import "~~/styles/globals.css";

const baseUrl = process.env.VERCEL_URL ? `https://kudzu.exchange` : `http://localhost:${process.env.PORT || 3000}`;

const imageUrl = `${baseUrl}/kudzu-frame-initial-og.png`;

const title = "Based Kudzu Exchange";
const titleTemplate = "%s | Based Kudzu Exchange";
const description = "Built with 🏗 Scaffold-Base";

const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: title,
    template: titleTemplate,
  },
  description,
  openGraph: {
    title: {
      default: title,
      template: titleTemplate,
    },
    description,
    images: [
      {
        url: imageUrl,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [imageUrl],
    title: {
      default: title,
      template: titleTemplate,
    },
    description,
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const frameMetadata = await getFrameMetadata(`${baseUrl}/api`);
  return {
    ...metadata,
    other: frameMetadata,
  };
}

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider enableSystem>
          <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
        </ThemeProvider>
      </body>
    </html>
  );
};

export const dynamic = "force-dynamic";

export default ScaffoldEthApp;
