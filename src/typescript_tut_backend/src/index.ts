import {
  Canister,
  query,
  text,
  nat64,
  Record,
  Result,
  Principal,
  Vec,
  update,
  StableBTreeMap,
  nat8,
  None,
  ic,
} from "azle";
import { v4 as uuidv4 } from "uuid";
// Define the EscrowStatus enum
enum EscrowStatus {
  PENDING = "PENDING",
  RELEASED = "RELEASED",
  DISPUTED = "DISPUTED",
  CANCELLED = "CANCELLED",
}

// Define the Escrow type
type Escrow = Vec<{
  id: text;
  seller: Principal;
  buyer: Principal;
  arbitrator: Principal;
  amount: nat64;
  status: EscrowStatus;
  releaseTime: nat64;
  description: text;
}>;

let escrowStorage = StableBTreeMap<text, Escrow>(0);

export default Canister({
  greet: query([text], text, (name) => {
    return `Hello, ${name}!`;
  }),

  getEscrow: query([text], Result(text, Escrow), (id) => {
    const escrow = escrowStorage.get(id);
    if ("None" in escrow) {
      return Result.Err("Escrow not found");
    }
    return Result.Ok(escrow.Some);
  }),

  createEscrow: update(
    [Principal, Principal, Principal, nat64, text, nat64],
    text,
    (seller, buyer, arbitrator, amount, description, releaseTime) => {
      const escrow = {
        id: uuidv4(),
        seller,
        buyer,
        arbitrator,
        amount,
        status: EscrowStatus.PENDING,
        releaseTime,
        description,
      };
      escrowStorage.insert(escrow.id, escrow);
      return escrow.toString();
    }
  ),

  releaseEscrow: query([text], Result(text, text), (id) => {
    const escrow = escrowStorage.get(id);
    if ("None" in escrow) {
      return Result.Err("Escrow not found");
    }
    const currentEscrow = escrow.Some;
    if (currentEscrow.status !== EscrowStatus.PENDING) {
      return Result.Ok("Escrow is not pending");
    }
    if (currentEscrow.releaseTime < ic.time()) {
      return Result.Ok("Release time has not been reached");
    }
    const updatedEscrow = { ...currentEscrow, status: EscrowStatus.RELEASED };
    escrowStorage.insert(id, updatedEscrow);
    return Result.Ok("Escrow released");
  }),
});
