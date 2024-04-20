"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { KudzuContainer } from "~~/components/KudzuContainer";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const { data: yourKudzuTokenId } = useScaffoldContractRead({
    contractName: "KUDZU",
    functionName: "tokenOfOwnerByIndex",
    args: [connectedAddress, 0n],
  });

  const [addressToInfect, setAddressToInfect] = useState<string>("");

  const [addressToPubInfect, setAddressToPubInfect] = useState<string>("");

  const { writeAsync: pubInfectFromYourKudzu } = useScaffoldContractWrite({
    contractName: "BasedKudzuContainerForSale",
    functionName: "publiclyInfect",
    args: [addressToPubInfect],
  });

  const { writeAsync: infectFromYourKudzu } = useScaffoldContractWrite({
    contractName: "KUDZU",
    functionName: "safeTransferFrom",
    // @ts-ignore
    args: [connectedAddress, addressToInfect, yourKudzuTokenId || 0n],
  });

  const { data: alreadyHasKudzu } = useScaffoldContractRead({
    contractName: "KUDZU",
    functionName: "tokenOfOwnerByIndex",
    args: [addressToPubInfect, 0n],
  });

  const { data: allContainers } = useScaffoldEventHistory({
    contractName: "BasedKudzuContainerForSaleFactory",
    eventName: "Created",
    fromBlock: 10361383n,
    watch: true,
    /*filters: { owner: "" + connectedAddress },*/
    blockData: false,
    transactionData: false,
    receiptData: false,
  });

  const { writeAsync: deployContainer } = useScaffoldContractWrite({
    contractName: "BasedKudzuContainerForSaleFactory",
    functionName: "create",
    args: [connectedAddress],
    value: parseEther("0.00005"),
  });

  const router = useRouter();

  let i = 0;
  const containerRender = allContainers?.map((container: any) => {
    return (
      <KudzuContainer key={i++} contractAddress={container.args.contractAddress} mustBeOwnedBy={connectedAddress} />
    );
  });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          infect address from infector contract:{" "}
          <AddressInput
            placeholder="0xYourAddress"
            value={addressToPubInfect}
            onChange={v => setAddressToPubInfect(v)}
          />
          {alreadyHasKudzu ? (
            <p className="text-red-500">
              <a
                target="_blank"
                href={"https://opensea.io/assets/base/0x94e84f2dbb9b068ea01db531e7343ec2385b7052/" + alreadyHasKudzu}
              >
                {" "}
                This address already has a Kudzu here!
              </a>
            </p>
          ) : (
            ""
          )}
          <button
            className="btn btn-secondary"
            onClick={() => {
              pubInfectFromYourKudzu();
            }}
          >
            🦠 infect
          </button>
        </div>
      </div>
      <div className="divider p-12"></div>
      {yourKudzuTokenId ? (
        <div className="flex items-center flex-col flex-grow pt-10">
          <h1 className="text-center">
            <div className="content-center"> 🦠 YOU ARE INFECTED WITH KUDZU:</div>
            <div className="flex content-center">
              <div className="content-center">
                {" "}
                <img
                  alt="virus"
                  style={{ maxWidth: 250 }}
                  src={"https://virus.folia.app/img/base/" + yourKudzuTokenId?.toString()}
                />
              </div>
            </div>
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>

          <AddressInput value={addressToInfect} onChange={v => setAddressToInfect(v)} placeholder="0xSomeAddress" />

          <button
            className="btn btn-secondary"
            onClick={() => {
              infectFromYourKudzu();
            }}
          >
            🦠 infect from your kudzu
          </button>
          <div className="divider p-12"></div>
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                router.push("/buy");
              }}
            >
              💵 buy kudzu containers
            </button>
          </div>
          <div className="divider p-12"></div>
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                deployContainer();
              }}
            >
              🧫 deploy a kudzu container smart contract
            </button>

            {containerRender}
          </div>
          <div className="divider p-12"></div>
          <div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                router.push("/debug");
              }}
            >
              📄 smart contracts
            </button>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default Home;
