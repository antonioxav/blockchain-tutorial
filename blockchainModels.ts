import * as crypto from 'crypto'

// TODO: Add proper encapsulation in all classes

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
    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ) {}

    /**
     * To string
     * @returns  A string (JSON) of the current object
     */
    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Block that stores transactions and is added to the Chain after Verfification
 */
class Block {

    public nonce = Math.round(Math.random() * 999999999); // One time use random number

    /**
     * Creates an instance of block.
     * @param prevHash The hash of the previous block in the chain
     * @param transaction The transaction in the block. Only 1 transaction per block for simplicity.
     * @param [timeStamp] The timestamp of when the block was created, to ensure chrnology in the chain. Defaults to Date.now()
     */
    constructor(
        public prevHash: string|null,
        public transaction: Transaction,
        public timeStamp = Date.now()
    ){}
    
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
 */
class Chain {
    public static instance = new Chain(); // Makes Chain a Singleton Instance to ensure that there is only one chain instance instantiated.

    chain: Block[];

    /**
     * Creates an instance of chain.
     */
    constructor(){
        this.chain = [new Block(null, new Transaction(100, 'genesis', 'Srijan'))] // * Genesis Block. Creates money out of thin air
    }

    /**
     * Gets the last block in the chain
     */
    get lastBlock() {
        return this.chain[this.chain.length-1]
    }

    /**
     * Proof-of-work: Attempt to find a number, that when added to the nonce, will produce a hash that starts with 4 0000s.
     * ? How does this prevent double spending?
     * @param nonce One time use random number
     * @returns  
     */
    mine(nonce: number) {
        let solution = 1;
        console.log('⛏ Mining...');

        while(true) {
            // Create a hash with nonce + attempted solution
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            // Test attempt
            if(attempt.substr(0,4) === '0000'){
                console.log(`✔ Solved: ${solution}`);
                return solution;
            }

            solution += 1;

        }
    }

    /**
     * Verfies and adds a new block to the chain
     * @param transaction The Transaction instance to be added to the Block
     * @param senderPublicKey The payer's public key
     * @param signature The payer's signature on the transaction
     */
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer){
        // Verfiy transaction
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature); //Verifies that it was the sender's private key that signed this transaction block

        // Create new block and append it to the chain
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction); 
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}

/**
 * Wallet
 * Allows a user to store and send money to other users
 * TODO: Add Store Functionality
 * ! Missing store value feature. Creates and sends new money; does not store received money
 */
export class Wallet {
    public publicKey: string;
    public privateKey: string;

    /**
     * Creates an instance of wallet.
     */
    constructor() {
        const keypair = crypto.generateKeyPairSync(
            'rsa', 
            {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem' // File format in which the key is stored: https://knowledge.digicert.com/quovadis/ssl-certificates/ssl-general-topics/what-is-pem-format.html 
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }
        );
         this.privateKey = keypair.privateKey;  // Can be used to decrypt documents encrypted by the public key or sign documents.
         this.publicKey = keypair.publicKey;    // Can be used to create encryptions that only the private can decrypt. Also used to verify documents signed by the private key.
    }

    /**
     * Send money to another Wallet
     * @param amount The transaction amount
     * @param payeePublicKey The payee's public key
     * TODO: Refractor to input Wallet instance instead of public key
     */
    sendMoney(amount: number, payeePublicKey: string) {
        
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

/**
 * Prints Blockchain.
 * * Temporary Function
 */
export function printChain() {
    console.log(Chain.instance)
}