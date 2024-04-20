"use client";

import type { NextPage } from "next";
import { KudzuContainer } from "~~/components/KudzuContainer";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const Buy: NextPage = () => {
  const { data: allContainers } = useScaffoldEventHistory({
    contractName: "BasedKudzuContainerForSaleFactory",
    eventName: "Created",
    fromBlock: 10361383n,
    watch: true,
    blockData: false,
    transactionData: false,
    receiptData: false,
  });

  let i = 0;
  const containerRender = allContainers?.map((container: any) => {
    return <KudzuContainer key={i++} mustBeForSale={true} contractAddress={container.args.contractAddress} />;
  });

  return (
    <>
      {" "}
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">SEARCHING FOR KUDZU CONTAINERS FOR SALE...</div>
        {containerRender}
      </div>
    </>
  );
};

export default Buy;
