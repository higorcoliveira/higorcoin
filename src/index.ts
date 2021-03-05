import * as crypto from "crypto";

class Transaction {
  constructor(
    public amount: number,
    public payer: string,
    public payee: string
  ) {}

  toString() {
    return JSON.stringify(this);
  }
}

class Block {
  // para gerar o proof of work
  public nonce = Math.round(Math.random() * 99999999999);

  constructor(
    public prevHash: string,
    public transaction: Transaction,
    public ts = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash("SHA256");

    hash.update(str).end();
    return hash.digest("hex");
  }
}

class Chain {
  public static instance = new Chain();

  chain: Block[];

  constructor() {
    // genesis block
    // imprimindo 100 higorcoin igual o Bacen faz com o real
    this.chain = [new Block("", new Transaction(100, "genesis", "higor"))];
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(transaction.toString());

    const isValid = verifier.verify(senderPublicKey, signature);

    // se é uma transação válida da carteira específica, escreve na blockchain
    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }

  // simulando a mineração
  // cálculo por força bruta, até achar um valor de hash que comece com quatro zeros
  mine(nonce: number) {
    let solution = 1;

    console.log("mining...");

    while (true) {
      const hash = crypto.createHash("MD5");
      hash.update((nonce + solution).toString()).end();
      const attempt = hash.digest("hex");

      if (attempt.substr(0, 4) === "0000") {
        console.log(`Solved: ${solution}`);
        return solution;
      }
      solution += 1;
    }
  }
}

class Wallet {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    this.publicKey = keypair.publicKey;
    this.privateKey = keypair.privateKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

    const sign = crypto.createSign("SHA256");
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);

    // adiciona a transação assinada com a chave pública existente
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }

  receivedMoney(amount: number) {}
}

// utilização
const higor = new Wallet();
const carol = new Wallet();
const mariaFernanda = new Wallet();

higor.sendMoney(150, carol.publicKey);
carol.sendMoney(100, mariaFernanda.publicKey);
mariaFernanda.sendMoney(50, carol.publicKey);

console.log(Chain.instance);