"use client";

import React from "react";
import { Address, AddressInput, EtherInput } from "./scaffold-eth";
import { BalanceValue } from "./scaffold-eth/BalanceValue";
import { Abi } from "abitype";
import { formatEther, parseEther } from "viem";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { useDeployedContractInfo, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

type KudzuContainerProps = {
  contractAddress?: string;
  mustBeForSale?: boolean;
  mustBeOwnedBy?: string;
};

export const KudzuContainer = ({ contractAddress, mustBeForSale, mustBeOwnedBy }: KudzuContainerProps) => {
  const { address } = useAccount();

  const { data: tokenIndex } = useScaffoldContractRead({
    contractName: "KUDZU",
    functionName: "tokenOfOwnerByIndex",
    args: [contractAddress, 0n],
  });

  const { targetNetwork } = useTargetNetwork();

  const { data: deployedContractData } = useDeployedContractInfo("BasedKudzuContainerForSale");

  const [ethAmount, setEthAmount] = React.useState("");

  const { data: owner } = useContractRead({
    chainId: targetNetwork.id,
    functionName: "owner",
    address: contractAddress,
    abi: deployedContractData?.abi,
    watch: true,
  });

  const { writeAsync: setPrice } = useContractWrite({
    chainId: targetNetwork.id,
    address: contractAddress,
    abi: deployedContractData?.abi as Abi,
    functionName: "setPrice",
    args: [ethAmount ? parseEther(ethAmount) : 0n],
  });

  const { data: price } = useContractRead({
    chainId: targetNetwork.id,
    functionName: "price",
    address: contractAddress,
    abi: deployedContractData?.abi,
    watch: true,
  });

  const { data: isInfected } = useContractRead({
    chainId: targetNetwork.id,
    functionName: "isInfected",
    address: contractAddress,
    abi: deployedContractData?.abi,
    watch: true,
  });

  const { writeAsync: purchase } = useContractWrite({
    chainId: targetNetwork.id,
    address: contractAddress,
    abi: deployedContractData?.abi as Abi,
    functionName: "purchase",
    value: price,
  });

  const [addressToPubInfect, setAddressToPubInfect] = React.useState("");

  const { writeAsync: infect } = useContractWrite({
    chainId: targetNetwork.id,
    address: contractAddress,
    abi: deployedContractData?.abi as Abi,
    functionName: "infect",
    args: [addressToPubInfect],
  });

  if (mustBeForSale && !price) {
    return <></>;
  }

  if (mustBeOwnedBy && owner?.toLocaleLowerCase() !== mustBeOwnedBy?.toLocaleLowerCase()) {
    return <></>;
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl m-8 p-8">
      <Address address={contractAddress} />
      <div className="m-4">
        Owner: <Address address={owner} />
      </div>

      {tokenIndex ? (
        <>
          <div className="m-4">
            <img alt="virus" src={"https://virus.folia.app/img/base/" + tokenIndex?.toString()} />
          </div>
        </>
      ) : (
        "Not infected yet."
      )}

      <>
        <div className="m-4"></div>
        {owner?.toLocaleLowerCase() === address?.toLocaleLowerCase() ? (
          <div>
            {isInfected ? (
              <>
                <div className={"mb-8"}>
                  infect address from this kudzu:
                  <AddressInput
                    placeholder="0xYourAddress"
                    value={addressToPubInfect}
                    onChange={v => setAddressToPubInfect(v)}
                  />
                  <button
                    className={"btn"}
                    onClick={() => {
                      infect();
                    }}
                  >
                    🦠 infect
                  </button>
                </div>
                <div>
                  current price:
                  <BalanceValue value={price ? formatEther(price) : "0"} usdMode={true} />
                  new price:
                  <EtherInput usdMode={true} value={ethAmount} onChange={amount => setEthAmount(amount)} />
                  <button
                    className={"btn"}
                    onClick={() => {
                      setPrice();
                    }}
                  >
                    💵 set price
                  </button>
                </div>
              </>
            ) : (
              ""
            )}
          </div>
        ) : (
          <button
            className={"btn"}
            onClick={() => {
              purchase();
            }}
          >
            💵 buy for <BalanceValue value={price ? formatEther(price) : "0"} usdMode={true} />
          </button>
        )}
      </>
    </div>
  );
};
