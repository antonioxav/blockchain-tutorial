"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
/**
 * Transaction made from one Wallet to another
 */
class Transaction {
    /**
     * Creates an instance of transaction.
     * @param amount The transaction amount
     * @param payer The public key of the payer
     * @param payee The public key of the payee
     */
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    /**
     * To string
     * @returns  A string (JSON) of the current object
     */
    toString() {
        return JSON.stringify(this);
    }
}
/**
 * Block
 * TODO: Write Block Documentation
 */
class Block {
    /**
     * Creates an instance of block.
     * @param prevHash The hash of the previous block in the chain
     * @param transaction The transaction in the block. Only 1 transaction per block for simplicity.
     * @param [timeStamp] The timestamp of when the block was created, to ensure chrnology in the chain. Defaults to Date.now()
     */
    constructor(prevHash, transaction, timeStamp = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.timeStamp = timeStamp;
    }
    /**
     * Gets a hex encoded hash of the current object
     */
    get hash() {
        const block_str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(block_str).end();
        return hash.digest('hex');
    }
}
/**
 * Blockchain that stores Blocks after Verfying transactions. Singleton Instance.
 * TODO: Add proof-of-work system
 * ! Lacks a proof-of-work system. Double send Issue exists (can send money to multiple wallets simultaneously before verification)
 */
class Chain {
    /**
     * Creates an instance of chain.
     */
    constructor() {
        this.chain = [new Block(null, new Transaction(100, 'genesis', 'Srijan'))]; // * Genesis Block. Creates money out of thin air
    }
    /**
     * Gets the last block in the chain
     */
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    /**
     * Verfies and adds a new block to the chain
     * ! Lacks a proof-of-work system. Double send Issue exists (can send money to multiple wallets simultaneously before verification)
     * @param transaction The Transaction instance to be added to the Block
     * @param senderPublicKey The payer's public key
     * @param signature The payer's signature on the transaction
     */
    addBlock(transaction, senderPublicKey, signature) {
        // Verfiy transaction
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature); //Verifies that it was the sender's private key that signed this transaction block
        // Create new block and append it to the chain
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.chain.push(newBlock);
        }
    }
}
Chain.instance = new Chain(); // Makes Chain a Singleton Instance to ensure that there is only one chain instance instantiated.
/**
 * Wallet
 * Allows a user to store and send money to other users
 * TODO: Add Store Functionality
 * ! Missing store value feature. Creates and sends new money; does not store received money
 */
class Wallet {
    /**
     * Creates an instance of wallet.
     */
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem' // File format in which the key is stored: https://knowledge.digicert.com/quovadis/ssl-certificates/ssl-general-topics/what-is-pem-format.html 
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        this.privateKey = keypair.privateKey; // Can be used to decrypt documents encrypted by the public key or sign documents.
        this.publicKey = keypair.publicKey; // Can be used to create encryptions that only the private can decrypt. Also used to verify documents signed by the private key.
    }
    /**
     * Send money to another Wallet
     * @param amount The transaction amount
     * @param payeePublicKey The payee's public key
     */
    sendMoney(amount, payeePublicKey) {
        // Create transaction
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        // Sign transaction
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey); // Creates a unique signature with the hash and private key, only verifiable by the public key
        // Add block to chain
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
