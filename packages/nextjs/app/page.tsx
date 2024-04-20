"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

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
    contractName: "BasedKudzuContainer",
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
            className="btn btn-primary"
            onClick={() => {
              pubInfectFromYourKudzu();
            }}
          >
            infect
          </button>
        </div>
        {yourKudzuTokenId ? (
          <div className="px-5 mt-10">
            <h1 className="text-center">
              <div className="content-center"> 🦠 YOU ARE INFECTED WITH KUDZU:</div>
              <div className="flex content-center">
                <div className="content-center">
                  {" "}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
              className="btn btn-primary"
              onClick={() => {
                infectFromYourKudzu();
              }}
            >
              infect from your kudzu
            </button>
          </div>
        ) : (
          ""
        )}
      </div>
    </>
  );
};

export default Home;
