import { RoundType } from "@prisma/client";
import { parseActivityCode } from "@wca/helpers";

export type Round = {
  id: string | number;
  rank: number;
  name: string;
  cellName: string;
  final: boolean;
  type: RoundType;
};

const rounds: Round[] = [
  {
    id: "h",
    rank: 10,
    name: "Qualification round",
    cellName: "Qualification round",
    final: false,
    type: RoundType.LEGACY_QUALIFICATION_ROUND,
  },
  {
    id: "0",
    rank: 19,
    name: "Qualification round",
    cellName: "Qualification round",
    final: false,
    type: RoundType.LEGACY_QUALIFICATION_ROUND,
  },
  {
    id: "d",
    rank: 20,
    name: "First round",
    cellName: "First round",
    final: false,
    type: RoundType.FIRST_ROUND,
  },
  {
    id: "1",
    rank: 29,
    name: "First round",
    cellName: "First round",
    final: false,
    type: RoundType.FIRST_ROUND,
  },
  {
    id: "b",
    rank: 39,
    name: "B Final",
    cellName: "B Final",
    final: false,
    type: RoundType.LEGACY_ROUND,
  },
  {
    id: "2",
    rank: 50,
    name: "Second round",
    cellName: "Second round",
    final: false,
    type: RoundType.SECOND_ROUND,
  },
  {
    id: "e",
    rank: 59,
    name: "Second round",
    cellName: "Second round",
    final: false,
    type: RoundType.SECOND_ROUND,
  },
  {
    id: "g",
    rank: 70,
    name: "Semi Final",
    cellName: "Semi Final",
    final: false,
    type: RoundType.SEMI_FINAL,
  },
  {
    id: 3,
    rank: 79,
    name: "Semi Final",
    cellName: "Semi Final",
    final: false,
    type: RoundType.SEMI_FINAL,
  },
  {
    id: "c",
    rank: 90,
    name: "Final",
    cellName: "Final",
    final: true,
    type: RoundType.FINAL,
  },
  {
    id: "f",
    rank: 99,
    name: "Final",
    cellName: "Final",
    final: true,
    type: RoundType.FINAL,
  },
];

export const getRoundTypeFromId = (roundId: string | number) =>
  rounds.find((round) => round.id === roundId);

export const getRoundTypeFromRoundNumber = (
  roundCount: number,
  roundNumber: number,
) => {
  const roundsLeft = roundCount - roundNumber;
  if (roundsLeft === 0) {
    return RoundType.FINAL;
  } else if (roundsLeft === 1 && roundCount >= 4) {
    return RoundType.SEMI_FINAL;
  } else if (roundNumber === 2) {
    return RoundType.SECOND_ROUND;
  } else if (roundNumber === 1) {
    return RoundType.FIRST_ROUND;
  }

  throw new Error(`Unknown round number: ${roundNumber}`);
};

export const getRoundNumberFromRoundId = (roundId: string) => {
  const { roundNumber } = parseActivityCode(roundId);
  if (!roundNumber) {
    throw new Error("WCIF Parse Error: roundId is missing roundNumber");
  }
  return roundNumber;
};
