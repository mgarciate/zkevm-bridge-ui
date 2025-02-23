import axios, { AxiosRequestConfig } from "axios";
import { z } from "zod";

import { StrictSchema } from "src/utils/type-safety";
import * as domain from "src/domain";
import { PAGE_SIZE } from "src/constants";

interface DepositInput {
  token_addr: string;
  amount: string;
  network_id: number;
  orig_net: number;
  dest_net: number;
  dest_addr: string;
  deposit_cnt: string;
  tx_hash: string;
  claim_tx_hash: string;
  ready_for_claim: boolean;
}

interface DepositOutput {
  token_addr: string;
  amount: string;
  network_id: number;
  orig_net: number;
  dest_net: number;
  dest_addr: string;
  deposit_cnt: number;
  tx_hash: string;
  claim_tx_hash: string | null;
  ready_for_claim: boolean;
}

interface MerkleProof {
  merkle_proof: string[];
  exit_root_num: string;
  l2_exit_root_num: string;
  main_exit_root: string;
  rollup_exit_root: string;
}

const depositParser = StrictSchema<DepositInput, DepositOutput>()(
  z.object({
    token_addr: z.string(),
    amount: z.string(),
    network_id: z.number(),
    orig_net: z.number(),
    dest_net: z.number(),
    dest_addr: z.string(),
    deposit_cnt: z.string().transform((v) => z.number().nonnegative().parse(Number(v))),
    tx_hash: z.string(),
    claim_tx_hash: z
      .string()
      .transform((v) => (v.length === 0 ? null : v))
      .refine((val) => val === null || val.length === 66, {
        message: "The length of claim_tx_hash must be 66 characters",
      }),
    ready_for_claim: z.boolean(),
  })
);

const getDepositResponseParser = StrictSchema<
  {
    deposit: DepositInput;
  },
  {
    deposit: DepositOutput;
  }
>()(
  z.object({
    deposit: depositParser,
  })
);

const getDepositsResponseParser = StrictSchema<
  {
    deposits?: DepositInput[];
    total_cnt?: string;
  },
  {
    deposits?: DepositOutput[];
    total_cnt?: number;
  }
>()(
  z.object({
    deposits: z.optional(z.array(depositParser)),
    total_cnt: z.optional(z.string().transform((v) => z.number().parse(Number(v)))),
  })
);

const apiMerkleProofToDomain = ({
  merkle_proof,
  exit_root_num,
  l2_exit_root_num,
  main_exit_root,
  rollup_exit_root,
}: MerkleProof): domain.MerkleProof => ({
  merkleProof: merkle_proof,
  l2ExitRootNumber: z.number().nonnegative().parse(Number(l2_exit_root_num)),
  exitRootNumber: z.number().nonnegative().parse(Number(exit_root_num)),
  mainExitRoot: main_exit_root,
  rollupExitRoot: rollup_exit_root,
});

const merkleProofParser = StrictSchema<MerkleProof, domain.MerkleProof>()(
  z
    .object({
      merkle_proof: z.array(z.string().length(66)),
      exit_root_num: z.string(),
      l2_exit_root_num: z.string(),
      main_exit_root: z.string().length(66),
      rollup_exit_root: z.string().length(66),
    })
    .transform(apiMerkleProofToDomain)
);

const getMerkleProofResponseParser = StrictSchema<
  {
    proof: MerkleProof;
  },
  {
    proof: domain.MerkleProof;
  }
>()(
  z.object({
    proof: merkleProofParser,
  })
);

interface GetDepositsParams {
  apiUrl: string;
  ethereumAddress: string;
  limit?: number;
  offset?: number;
  cancelToken?: AxiosRequestConfig["cancelToken"];
}

export const getDeposits = ({
  apiUrl,
  ethereumAddress,
  limit = PAGE_SIZE,
  offset = 0,
  cancelToken,
}: GetDepositsParams): Promise<{
  deposits: DepositOutput[];
  total: number;
}> => {
  return axios
    .request({
      baseURL: apiUrl,
      url: `/bridges/${ethereumAddress}`,
      method: "GET",
      params: {
        limit,
        offset,
      },
      cancelToken,
    })
    .then((res) => {
      const parsedData = getDepositsResponseParser.safeParse(res.data);

      if (parsedData.success) {
        return {
          deposits: parsedData.data.deposits !== undefined ? parsedData.data.deposits : [],
          total: parsedData.data.total_cnt !== undefined ? parsedData.data.total_cnt : 0,
        };
      } else {
        throw parsedData.error;
      }
    });
};

interface GetDepositParams {
  apiUrl: string;
  networkId: number;
  depositCount: number;
}

export const getDeposit = ({
  apiUrl,
  networkId,
  depositCount,
}: GetDepositParams): Promise<DepositOutput> => {
  return axios
    .request({
      baseURL: apiUrl,
      url: `/bridge`,
      method: "GET",
      params: {
        net_id: networkId,
        deposit_cnt: depositCount,
      },
    })
    .then((res) => {
      const parsedData = getDepositResponseParser.safeParse(res.data);

      if (parsedData.success) {
        return parsedData.data.deposit;
      } else {
        throw parsedData.error;
      }
    });
};

interface GetMerkleProofParams {
  apiUrl: string;
  networkId: number;
  depositCount: number;
}

export const getMerkleProof = ({
  apiUrl,
  networkId,
  depositCount,
}: GetMerkleProofParams): Promise<domain.MerkleProof> => {
  return axios
    .request({
      baseURL: apiUrl,
      url: `/merkle-proof`,
      method: "GET",
      params: {
        net_id: networkId,
        deposit_cnt: depositCount,
      },
    })
    .then((res) => {
      const parsedData = getMerkleProofResponseParser.safeParse(res.data);

      if (parsedData.success) {
        return parsedData.data.proof;
      } else {
        throw parsedData.error;
      }
    });
};
