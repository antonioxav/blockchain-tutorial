import {Wallet, printChain} from "./blockchainModels"

const A = new Wallet();
const B = new Wallet();
const C = new Wallet();

A.sendMoney(50, B.publicKey);
B.sendMoney(23, C.publicKey);
C.sendMoney(20, A.publicKey);

printChain();
