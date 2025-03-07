import { PageContainer } from "@/components/base/PageContainer";
import { PageTitle } from "@/components/base/PageTitle";
import { PageTitleRow } from "@/components/base/PageTitleRow";
import { FC, useState, useEffect } from "react";
import { BookA, Search, FileText, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Define the structure of a glossary term
interface GlossaryTerm {
  term: string;
  definition: React.ReactNode;
  tags?: string[];
}

const GlossaryPage: FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeLetterFilter, setActiveLetterFilter] = useState<string | null>(
    null
  );

  // Function to scroll to a specific section
  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`section-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveLetterFilter(letter);
    }
  };

  // Reset filter when search term changes
  useEffect(() => {
    if (searchTerm) {
      setActiveLetterFilter(null);
    }
  }, [searchTerm]);

  // Generate alphabet for quick navigation
  const alphabet = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  // Comprehensive list of glossary terms
  const glossaryTerms: GlossaryTerm[] = [
    {
      term: "Active (Arbiter Status)",
      definition:
        'An arbiter is considered "Active" when it is registered, has sufficient stake, is not paused, has not exceeded its deadline, and is not currently frozen or working on another transaction. Only active arbiters can be selected by DApps. See also: Paused, Frozen, Working.',
      tags: ["arbiter", "status"],
    },
    {
      term: "Address (EVM)",
      definition:
        'A unique identifier for an account on the Elastos Smart Chain (ESC) or another EVM-compatible blockchain. EVM addresses start with "0x" and are 40 hexadecimal characters long (e.g., 0x1234...). This is the type of address used by wallets like MetaMask.',
      tags: ["address", "wallet", "evm"],
    },
    {
      term: "Address (Bitcoin)",
      definition:
        'A unique identifier for receiving Bitcoin. The protocol currently expects standard "legacy" (P2PKH) addresses, which start with "1" (mainnet) or "m"/"n" (testnet). Important: The arbiter\'s operator and revenue can have separate Bitcoin addresses.',
      tags: ["address", "bitcoin", "wallet"],
    },
    {
      term: "API (Application Programming Interface)",
      definition:
        "A set of rules and specifications that software programs can follow to communicate with each other. The Arbiter Signer uses APIs to interact with external services like mempool.space.",
      tags: ["technical", "integration"],
    },
    {
      term: "Arbitration",
      definition:
        "The process of resolving a dispute in a Bitcoin transaction that is secured by the BeL2 protocol. This is initiated by a DApp when there's an issue. The selected arbiter may be required to sign the Bitcoin transaction to resolve the dispute.",
      tags: ["core concept", "dispute"],
    },
    {
      term: "Arbitration Fee",
      definition:
        "The fee that an arbiter charges for providing arbitration services. This is calculated as a percentage of the arbiter's total stake, annualized. DApps pay this fee when registering a transaction, even if arbitration is not ultimately needed. See also: Fee Rate.",
      tags: ["fees", "economics"],
    },
    {
      term: "Arbitration Request",
      definition:
        "An action taken by a DApp when it needs assistance from an arbiter to resolve a problem with a Bitcoin transaction. This triggers the arbiter's potential signing responsibility.",
      tags: ["request", "process"],
    },
    {
      term: "Arbitration Timeout",
      definition:
        'The maximum time an arbiter has to respond to an arbitration request (by submitting a signature, if required). If the arbiter misses this deadline, a "Timeout Compensation" claim can be made. The timeout duration is a system-wide parameter set in the ConfigManager contract.',
      tags: ["timeout", "parameters"],
    },
    {
      term: "Arbiter",
      definition:
        "An entity (individual or organization) that registers with the BeL2 Arbitration Protocol to provide transaction guarantees. Arbiters stake assets (ELA or NFTs) as collateral.",
      tags: ["core concept", "roles"],
    },
    {
      term: "Arbiter Dashboard",
      definition:
        "The section of the Arbiter Portal where registered arbiters can manage their settings, view their transaction history, and monitor their status.",
      tags: ["ui", "management"],
    },
    {
      term: "Arbiter Signer",
      definition:
        "A separate, off-chain application (written in Go) that arbiters must run. This application listens for events, signs Bitcoin transactions when required, and submits the signatures to the ESC. It is distinct from the Arbiter Portal (which is a web frontend).",
      tags: ["application", "signing", "technical"],
    },
    {
      term: "BPoSNFT",
      definition:
        "A type of Non-Fungible Token (NFT) on the Elastos blockchain, representing voting power in the Delegated Proof of Stake (DPoS) consensus mechanism. These NFTs can be staked by arbiters as collateral.",
      tags: ["nft", "staking", "collateral"],
    },
    {
      term: "BTC",
      definition: "The symbol for Bitcoin.",
      tags: ["bitcoin", "currency"],
    },
    {
      term: "BTC Address",
      definition: "See Address (Bitcoin).",
      tags: ["address", "bitcoin"],
    },
    {
      term: "BTC Public Key",
      definition:
        "The public key corresponding to a Bitcoin private key, used to derive Bitcoin addresses and verify signatures. The arbiter provides their operator's and revenue's public key as a hexadecimal string (starting with \"0x\").",
      tags: ["bitcoin", "cryptography", "key"],
    },
    {
      term: "BTC Transaction",
      definition:
        "A Bitcoin transaction, represented as a hexadecimal string (rawData in the code).",
      tags: ["bitcoin", "transaction"],
    },
    {
      term: "BTC TxHash",
      definition: "See Transaction Hash (Bitcoin).",
      tags: ["bitcoin", "transaction", "hash"],
    },
    {
      term: "BTCUtils.sol",
      definition:
        "A Solidity library contract that provides functions for parsing and manipulating Bitcoin transaction data within the EVM environment.",
      tags: ["contract", "technical", "bitcoin"],
    },
    {
      term: "Chain ID",
      definition:
        "A unique identifier for a specific blockchain network. The Arbiter Portal and contracts need to be configured for the correct chain ID (e.g., Elastos Smart Chain Mainnet or Testnet).",
      tags: ["blockchain", "network", "configuration"],
    },
    {
      term: "Claim (Compensation Claim)",
      definition:
        "A request for compensation made by a user (through a DApp) when they believe an arbiter has acted incorrectly. There are different claim types for different scenarios (see Compensation Type).",
      tags: ["dispute", "compensation"],
    },
    {
      term: "Claim ID",
      definition: "A unique identifier for a compensation claim.",
      tags: ["dispute", "identifiers", "compensation"],
    },
    {
      term: "Claimer",
      definition:
        "The entity (typically the DApp) that initiates a compensation claim.",
      tags: ["dispute", "roles", "compensation"],
    },
    {
      term: "Collateral",
      definition:
        'The assets (ELA or NFTs) staked by an arbiter as a guarantee of their good behavior. This collateral can be "slashed" (taken) if the arbiter misbehaves.',
      tags: ["staking", "security", "economics"],
    },
    {
      term: "CompensationManager.sol",
      definition:
        "The smart contract responsible for managing compensation claims.",
      tags: ["contract", "compensation", "technical"],
    },
    {
      term: "Compensation Type",
      definition:
        "The reason for a compensation claim. The supported types are: IllegalSignature (the arbiter signed a Bitcoin transaction without a proper arbitration request), Timeout (the arbiter failed to respond to an arbitration request within the deadline), FailedArbitration (the arbiter submitted an incorrect or invalid signature), and ArbiterFee (which allows arbiters to claim their fee after the transaction deadline).",
      tags: ["dispute", "compensation", "claim types"],
    },
    {
      term: "ConfigManager.sol",
      definition:
        "The smart contract that stores and manages system-wide configuration parameters (e.g., minimum stake, fee rates, timeout durations).",
      tags: ["contract", "configuration", "technical"],
    },
    {
      term: "Contract Address",
      definition: "The unique address of a smart contract on the blockchain.",
      tags: ["technical", "blockchain", "address"],
    },
    {
      term: "DApp (Decentralized Application)",
      definition:
        "An application that interacts with the blockchain and uses the BeL2 Arbitration Protocol to secure its Bitcoin transactions.",
      tags: ["applications", "core concept"],
    },
    {
      term: "DApp Registry",
      definition:
        "The smart contract (DAppRegistry.sol) that keeps track of registered DApps that are authorized to use the Arbitration Protocol.",
      tags: ["contract", "registry", "technical"],
    },
    {
      term: "Deadline (Arbiter)",
      definition:
        "The timestamp until which an arbiter has committed to providing services. Arbiters can extend their deadline.",
      tags: ["arbiter", "time", "commitment"],
    },
    {
      term: "Deadline (Transaction)",
      definition: "The time at which the transaction must be completed.",
      tags: ["transaction", "time", "parameters"],
    },
    {
      term: "Decentralized",
      definition:
        "A system that is not controlled by a single entity, but rather distributed among multiple participants.",
      tags: ["concept", "architecture"],
    },
    {
      term: "Deposited Fee",
      definition:
        "The fee (in ELA) paid by a DApp when registering a transaction with the Arbitration Protocol.",
      tags: ["fees", "economics"],
    },
    {
      term: "DER Signature",
      definition:
        "A standard format for encoding ECDSA signatures (used in Bitcoin). The arbiter_signer converts the raw signature into DER format before submitting it to the contract.",
      tags: ["cryptography", "bitcoin", "technical"],
    },
    {
      term: "ECDSA (Elliptic Curve Digital Signature Algorithm)",
      definition:
        "The cryptographic algorithm used for signing Bitcoin transactions.",
      tags: ["cryptography", "bitcoin", "technical"],
    },
    {
      term: "ELA",
      definition:
        "The native cryptocurrency of the Elastos Smart Chain (ESC). Arbiters can stake ELA as collateral.",
      tags: ["currency", "staking", "elastos"],
    },
    {
      term: "ERC721",
      definition:
        "A standard for Non-Fungible Tokens (NFTs) on Ethereum and compatible blockchains.",
      tags: ["nft", "standards", "ethereum"],
    },
    {
      term: "ESC (Elastos Smart Chain)",
      definition:
        "An EVM-compatible blockchain that is part of the Elastos ecosystem. The Arbiter Portal's smart contracts are deployed on ESC.",
      tags: ["blockchain", "elastos", "network"],
    },
    {
      term: "EVM (Ethereum Virtual Machine)",
      definition:
        "The runtime environment for smart contracts on Ethereum and compatible blockchains (like ESC).",
      tags: ["technical", "ethereum", "smart contracts"],
    },
    {
      term: "Event",
      definition:
        "A notification emitted by a smart contract when a specific action occurs. The arbiter_signer listens for events to detect arbitration requests.",
      tags: ["technical", "smart contracts", "notification"],
    },
    {
      term: "Fee Rate (Arbiter)",
      definition:
        "The annualized percentage fee that an arbiter charges for their services. This is a percentage of the arbiter's total stake, not a percentage of each transaction.",
      tags: ["fees", "economics", "arbiter"],
    },
    {
      term: "Frozen (Arbiter Status)",
      definition:
        'An arbiter is temporarily "frozen" after submitting a signature, to prevent immediate withdrawal of stake or acceptance of new transactions.',
      tags: ["arbiter", "status", "security"],
    },
    {
      term: "Gas",
      definition:
        "A unit of computational effort required to execute operations on the EVM network. Transactions require gas, which is paid for in the native currency (ELA on ESC).",
      tags: ["fees", "technical", "blockchain"],
    },
    {
      term: "Hexadecimal (Hex)",
      definition:
        'A base-16 number system commonly used to represent data in blockchain contexts (e.g., addresses, transaction hashes, private keys). Hex strings are often prefixed with "0x".',
      tags: ["technical", "data format"],
    },
    {
      term: "Implementation Contract",
      definition:
        "In the context of upgradeable contracts, the contract that contains the core logic. See Proxy Contract.",
      tags: ["contract", "technical", "upgradability"],
    },
    {
      term: "Keystore File",
      definition:
        "A file that securely stores a private key, encrypted with a password. The arbiter_signer uses keystore files to manage the arbiter's Bitcoin and Ethereum private keys.",
      tags: ["security", "private key", "technical"],
    },
    {
      term: "Mainnet",
      definition:
        "The main, live network of a blockchain (as opposed to a testnet).",
      tags: ["network", "environment"],
    },
    {
      term: "Mempool",
      definition:
        'Short for "memory pool." In the context of Bitcoin, this is a collection of unconfirmed transactions waiting to be included in a block. The arbiter_signer uses the mempool.space API to access Bitcoin transaction data, including potentially retrieving unconfirmed transactions from the mempool.',
      tags: ["bitcoin", "transactions", "technical"],
    },
    {
      term: "Mock (or Mock Contract)",
      definition:
        "A simplified version of a contract or service used for testing. They simulate the behavior of the real services without performing the actual cryptographic computations.",
      tags: ["development", "testing", "technical"],
    },
    {
      term: "Multicall",
      definition:
        "A technique that allows multiple contract calls to be bundled into a single EVM transaction. This improves efficiency and reduces gas costs. The arbiter_signer uses multicall for some contract interactions.",
      tags: ["technical", "optimization", "smart contracts"],
    },
    {
      term: "Network Mode",
      definition:
        'Indicates whether the system is operating on the "mainnet" (the live, production network) or a "testnet" (a testing network).',
      tags: ["network", "configuration", "environment"],
    },
    {
      term: "NFT (Non-Fungible Token)",
      definition:
        "A unique, indivisible token representing ownership of a digital or physical asset. In the BeL2 context, BPoS NFTs (representing voting power on Elastos) can be used as collateral by arbiters.",
      tags: ["token", "asset", "collateral"],
    },
    {
      term: "Nonce (EVM)",
      definition:
        "A number associated with an EVM address that is incremented with each transaction sent from that address. It prevents replay attacks.",
      tags: ["ethereum", "security", "transaction"],
    },
    {
      term: "Off-Chain",
      definition:
        "Operations or data that are not recorded on the blockchain. The arbiter_signer application runs off-chain.",
      tags: ["architecture", "technical"],
    },
    {
      term: "On-Chain",
      definition:
        "Operations or data that are recorded on the blockchain (e.g., smart contract interactions, token transfers).",
      tags: ["architecture", "technical", "blockchain"],
    },
    {
      term: "Operator",
      definition:
        "An EVM address authorized to perform actions on behalf of an arbiter (e.g., submit signatures). The operator can be the same as the arbiter's owner address, or a separate address.",
      tags: ["roles", "management", "delegation"],
    },
    {
      term: "Owner",
      definition:
        'In the context of the smart contracts, the "owner" is the account that has special privileges, such as deploying and upgrading contracts, and setting system-wide parameters. For an individual arbiter, the "owner" is the address that initially registered the arbiter.',
      tags: ["roles", "permissions", "management"],
    },
    {
      term: "Paused (Arbiter Status)",
      definition:
        "An arbiter can be manually paused, preventing them from being selected for new transactions.",
      tags: ["arbiter", "status", "management"],
    },
    {
      term: "Pending (DApp Status)",
      definition:
        "A DApp's initial status after registration, before it has been authorized by the protocol administrators.",
      tags: ["dapp", "status", "registration"],
    },
    {
      term: "Postmark",
      definition:
        "An SMTP (email) provider used by the backend for sending notifications.",
      tags: ["notifications", "service", "technical"],
    },
    {
      term: "Private Key",
      definition:
        "A secret cryptographic key that allows control over funds and the ability to sign transactions. Never share your private keys. Arbiters need both an Ethereum private key and a Bitcoin private key.",
      tags: ["security", "cryptography", "key management"],
    },
    {
      term: "Proof",
      definition:
        'In the context of ZKPs, a cryptographic proof is a piece of data that demonstrates the validity of a statement without revealing the underlying information. In the current implementation, "proof" often refers to a signature or other evidence of arbiter misbehavior.',
      tags: ["cryptography", "security", "verification"],
    },
    {
      term: "ProtonMail",
      definition:
        "An SMTP (email) provider, one of the options for sending notifications.",
      tags: ["notifications", "service"],
    },
    {
      term: "Proxy Contract",
      definition:
        'A contract that delegates calls to an "implementation" contract. This pattern is used for upgradeable contracts. The proxy contract\'s address remains constant, while the implementation contract can be updated.',
      tags: ["contract", "upgradability", "technical"],
    },
    {
      term: "Public Key",
      definition:
        "A cryptographic key derived from a private key. Public keys are used to verify signatures and to derive addresses.",
      tags: ["cryptography", "key", "security"],
    },
    {
      term: "Raw Transaction (Bitcoin)",
      definition:
        "The hexadecimal representation of a Bitcoin transaction. This is the data that is signed by an arbiter.",
      tags: ["bitcoin", "transaction", "technical"],
    },
    {
      term: "Receipt (Transaction Receipt)",
      definition:
        "A record of a transaction that has been included in a block on the blockchain. It contains information about the transaction's status, gas used, and any events that were emitted.",
      tags: ["transaction", "blockchain", "technical"],
    },
    {
      term: "reflect-metadata",
      definition:
        "A library that's a build time (or transpile-time) dependency, and part of the devDependencies. This usually indicates that the dependency isn't directly used at runtime in the browser but is required for certain TypeScript features to work.",
      tags: ["development", "technical", "dependency"],
    },
    {
      term: "Registration Fee (DApp)",
      definition:
        "A one-time fee (currently 10 ELA) that DApps must pay to register with the Arbitration Protocol.",
      tags: ["fees", "dapp", "registration"],
    },
    {
      term: "Revenue Address (EVM/BTC)",
      definition:
        "The addresses (EVM and Bitcoin) where an arbiter receives their earned fees.",
      tags: ["fees", "address", "earnings"],
    },
    {
      term: "RPC (Remote Procedure Call)",
      definition:
        "A protocol that allows one program to request a service from a program located on another computer (or, in this case, on a blockchain node) without needing to understand the network's details. The arbiter_signer uses RPC to communicate with the Elastos Smart Chain and (potentially) a Bitcoin node.",
      tags: ["technical", "communication", "protocol"],
    },
    {
      term: "Satoshi",
      definition:
        "The smallest unit of Bitcoin (1 BTC = 100,000,000 satoshis).",
      tags: ["bitcoin", "unit", "currency"],
    },
    {
      term: "Secp256k1",
      definition:
        "The elliptic curve used for cryptographic signatures in both Bitcoin and EVM-based blockchains.",
      tags: ["cryptography", "technical", "algorithm"],
    },
    {
      term: "Sendinblue",
      definition:
        "An SMTP (email) provider, one of the options for sending notifications.",
      tags: ["notifications", "service"],
    },
    {
      term: "Serialization",
      definition:
        "The process of converting a data structure (like a transaction) into a byte format that can be stored or transmitted.",
      tags: ["technical", "data format"],
    },
    {
      term: "Sighash (Signature Hash)",
      definition:
        'A hash of the Bitcoin transaction data that is signed by an arbiter. The specific data included in the sighash depends on the "sighash flag".',
      tags: ["bitcoin", "cryptography", "signature"],
    },
    {
      term: "Sighash Flag",
      definition:
        "A flag that determines which parts of a Bitcoin transaction are included in the signature hash. SIGHASH_ALL (value 0x01) is the most common and signs all inputs and outputs.",
      tags: ["bitcoin", "cryptography", "technical"],
    },
    {
      term: "Signature Validation Service",
      definition:
        "A contract (ISignatureValidationService.sol) that verifies the validity of a digital signature. The current implementation uses a mock version (MockSignatureValidationService.sol).",
      tags: ["contract", "verification", "signature"],
    },
    {
      term: "Smart Contract",
      definition:
        "A program stored on the blockchain that automatically executes code when certain conditions are met. The core logic of the BeL2 Arbitration Protocol is implemented in smart contracts.",
      tags: ["blockchain", "code", "automation"],
    },
    {
      term: "SMTP (Simple Mail Transfer Protocol)",
      definition:
        "The standard protocol for sending email. The arbiter_signer backend can be configured to use various SMTP providers.",
      tags: ["protocol", "notifications", "technical"],
    },
    {
      term: "Solidity",
      definition:
        "The programming language used to write smart contracts for EVM-compatible blockchains (like ESC).",
      tags: ["programming", "smart contracts", "development"],
    },
    {
      term: "Stake",
      definition:
        "The assets (ELA or NFTs) that an arbiter locks up as collateral.",
      tags: ["collateral", "security", "economics"],
    },
    {
      term: "Subgraph",
      definition:
        "A decentralized indexing protocol (The Graph) used to efficiently query data from the blockchain. The subgraph/ directory contains the configuration and mapping logic for the BeL2 subgraph.",
      tags: ["data", "indexing", "technical"],
    },
    {
      term: "System Fee",
      definition:
        "A percentage of the arbitration fee that is collected by the protocol to support its operation and development.",
      tags: ["fees", "economics", "protocol"],
    },
    {
      term: "Testnet",
      definition:
        "A test network for a blockchain, used for development and testing without using real cryptocurrency.",
      tags: ["network", "development", "testing"],
    },
    {
      term: "Timeout",
      definition: "See Arbitration Timeout.",
      tags: ["time", "process", "dispute"],
    },
    {
      term: "Transaction ID (txId)",
      definition:
        "A unique identifier for a transaction. On Bitcoin, this is a hash of the transaction data. On EVM chains, this is also a hash. The txId used by the TransactionManager contract is a unique identifier (a bytes32) that may not be the same as the Bitcoin txid, particularly after arbitration.",
      tags: ["transaction", "identifiers", "technical"],
    },
    {
      term: "TransactionManager.sol",
      definition:
        "The smart contract that manages the transaction flow and interactions between arbiters and dapps.",
      tags: ["contract", "transactions", "technical"],
    },
    {
      term: "UTXO (Unspent Transaction Output)",
      definition:
        "The fundamental unit of value in Bitcoin. Each UTXO represents a specific amount of Bitcoin that is locked by a specific script (typically a Bitcoin address). Transactions consume existing UTXOs and create new ones.",
      tags: ["bitcoin", "technical", "transaction"],
    },
    {
      term: "Verification (ZKP)",
      definition:
        "The process of checking the validity of a Zero-Knowledge Proof (or, in the current mock implementation, a signature).",
      tags: ["cryptography", "verification", "zkp"],
    },
    {
      term: "WIF (Wallet Import Format)",
      definition:
        "A standardized format for encoding a Bitcoin private key, making it easier to import and export keys between wallets.",
      tags: ["bitcoin", "private key", "format"],
    },
    {
      term: "Withdraw Compensation",
      definition:
        "The action of a user (or DApp) claiming the compensation that they are entitled to after a successful compensation claim.",
      tags: ["compensation", "claim", "process"],
    },
    {
      term: "Working (Arbiter Status)",
      definition:
        'An arbiter is considered "Working" when it is currently handling an arbitration request and has not yet submitted a signature or reached the timeout period.',
      tags: ["arbiter", "status", "process"],
    },
    {
      term: "Zoho",
      definition:
        "An SMTP (email) provider, one of the options for sending notifications.",
      tags: ["notifications", "service"],
    },
    {
      term: "ZK-Rollup",
      definition:
        "A layer-2 scaling solution that uses Zero-Knowledge Proofs to bundle and validate many transactions off-chain, improving throughput and reducing fees. While not directly implemented in the current codebase, this is a likely future direction for BeL2.",
      tags: ["scaling", "zkp", "layer-2"],
    },
    {
      term: "ZKP (Zero-Knowledge Proof)",
      definition:
        "A cryptographic technique that allows one party (the prover) to prove to another party (the verifier) that a statement is true, without revealing any information beyond the fact that the statement is true. In the context of BeL2, ZKPs could be used to prove the validity of a Bitcoin transaction (or the invalidity of an arbiter's actions) without revealing the transaction details on the EVM chain. Important: The current code uses a mock ZKP service, not a real one.",
      tags: ["cryptography", "privacy", "verification"],
    },
    {
      term: "ZKP request",
      definition:
        "The user request sent to verify a ZK proof (actual or mocked).",
      tags: ["zkp", "verification", "technical"],
    },
    {
      term: "zkService (contract)",
      definition:
        "An interface (IZkService.sol) and a mock implementation (MockZkService.sol) for a service that handles ZKP verification. In a production deployment, this would be replaced with a real ZKP verification contract.",
      tags: ["contract", "zkp", "verification"],
    },
  ];

  // Organize terms by first letter for alphabetical display
  const termsByLetter: Record<string, GlossaryTerm[]> = {};

  glossaryTerms.forEach((term) => {
    const firstLetter = term.term.charAt(0).toUpperCase();
    if (!termsByLetter[firstLetter]) {
      termsByLetter[firstLetter] = [];
    }
    termsByLetter[firstLetter].push(term);
  });

  // Filter terms based on search
  const filteredTerms = searchTerm
    ? glossaryTerms.filter(
        (term) =>
          term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof term.definition === "string" &&
            term.definition.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (term.tags &&
            term.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      )
    : [];

  return (
    <PageContainer>
      <PageTitleRow>
        <PageTitle>Glossary of Terms</PageTitle>
      </PageTitleRow>

      <div className="bg-white shadow rounded-lg p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Introduction */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary-700 border-b pb-3 flex items-center">
            <BookA className="h-6 w-6 mr-3 text-primary-600" />
            BeL2 Arbitration Protocol Glossary
          </h2>

          <p className="text-gray-700 mb-6 text-lg leading-relaxed">
            This glossary provides definitions for key terms used in the BeL2
            Arbitration Protocol. Use the alphabetical navigation below to
            quickly jump to specific sections, or use the search function to
            find specific terms.
          </p>

          {/* Back to Help link */}
          <Link to="/help">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Help Center
            </Button>
          </Link>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search glossary terms..."
              className="pl-10 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Alphabetical Navigation */}
          <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Jump to Letter
            </h3>
            <div className="flex flex-wrap gap-2">
              {alphabet.map((letter) => {
                // Only make letters with terms clickable
                const hasTerms =
                  termsByLetter[letter] && termsByLetter[letter].length > 0;

                return (
                  <button
                    key={letter}
                    onClick={() => hasTerms && scrollToLetter(letter)}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-md text-sm
                      ${
                        hasTerms
                          ? "hover:bg-primary-100 cursor-pointer"
                          : "cursor-not-allowed opacity-40"
                      }
                      ${
                        activeLetterFilter === letter
                          ? "bg-primary-600 text-white"
                          : hasTerms
                          ? "bg-gray-100 text-primary-700"
                          : "bg-gray-100"
                      }
                    `}
                    disabled={!hasTerms}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-primary-700">
                Search Results ({filteredTerms.length})
              </h3>

              {filteredTerms.length === 0 ? (
                <p className="text-gray-500 italic">
                  No terms found matching "{searchTerm}"
                </p>
              ) : (
                <div className="space-y-6">
                  {filteredTerms.map((term, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h4 className="text-lg font-semibold text-primary-800 mb-2">
                        {term.term}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {term.definition}
                      </p>
                      {term.tags && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {term.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alphabetical Listing */}
          {!searchTerm && (
            <div>
              {alphabet
                .filter(
                  (letter) =>
                    termsByLetter[letter] && termsByLetter[letter].length > 0
                )
                .map((letter) => (
                  <div key={letter} id={`section-${letter}`} className="mb-8">
                    <h3 className="text-xl font-bold text-primary-700 border-b-2 border-primary-200 pb-2 mb-4">
                      {letter}
                    </h3>
                    <div className="space-y-6">
                      {termsByLetter[letter].map((term, index) => (
                        <div
                          key={index}
                          className="border-b pb-4 last:border-b-0"
                        >
                          <h4 className="text-lg font-semibold text-primary-800 mb-2">
                            {term.term}
                          </h4>
                          <p className="text-gray-700 leading-relaxed">
                            {term.definition}
                          </p>
                          {term.tags && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {term.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default GlossaryPage;
