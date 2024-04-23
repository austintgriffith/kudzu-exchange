"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { gql, useQuery } from "urql";
import { KudzuContainer } from "~~/components/KudzuContainer";

const Buy: NextPage = () => {
  const ContainersQuery = gql`
    query Containers($after: String, $before: String) {
      containers(limit: 500, before: $before, after: $after) {
        items {
          owner
          contract
        }
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
      }
    }
  `;

  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);

  const [{ data: containersData, fetching: isLoading }] = useQuery({
    query: ContainersQuery,
    variables: {
      before: before,
      after: after,
    },
  });

  const KudzusQuery = gql`
    query Kudzus($contracts: [String]) {
      kudzus(limit: 10, where: { contract_in: $contracts }) {
        items {
          token
          contract
        }
      }
    }
  `;

  const contractAddresses = containersData?.containers?.items?.map((item: any) => item.contract);

  const [{ data: kudzusData, fetching: isLoadingKudzus }] = useQuery({
    query: KudzusQuery,
    variables: {
      contracts: contractAddresses,
    },
  });

  let i = 0;
  const containerRender = containersData?.containers?.items?.map((container: any) => {
    return (
      <KudzuContainer
        key={i++}
        mustBeForSale={true}
        contractAddress={container.contract}
        owner={container.owner}
        tokenIndex={kudzusData?.kudzus.items.find((item: any) => item.contract === container.contract)?.token}
      />
    );
  });

  return (
    <>
      {" "}
      <div className="flex items-center flex-col flex-grow pt-10">
        {isLoading || isLoadingKudzus ? (
          <div className="px-5">SEARCHING FOR KUDZU CONTAINERS FOR SALE.....</div>
        ) : (
          <div>
            {containerRender}
            <div className="flex justify-between">
              <button
                className={`${
                  containersData?.containers?.pageInfo?.hasPreviousPage
                    ? "bg-blue-500 hover:bg-blue-700"
                    : "bg-gray-300"
                } text-white font-bold py-2 px-4 rounded`}
                disabled={!containersData?.containers?.pageInfo?.hasPreviousPage}
                onClick={() => {
                  setBefore(containersData?.containers?.pageInfo?.startCursor);
                  setAfter(null);
                }}
              >
                Previous
              </button>

              <button
                className={`${
                  containersData?.containers?.pageInfo?.hasNextPage ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-300"
                } text-white font-bold py-2 px-4 rounded`}
                disabled={!containersData?.containers?.pageInfo?.hasNextPage}
                onClick={() => {
                  setBefore(null);
                  setAfter(containersData?.containers?.pageInfo?.endCursor);
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Buy;
