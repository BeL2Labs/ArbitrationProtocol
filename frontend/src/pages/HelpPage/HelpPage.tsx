import { PageContainer } from "@/components/base/PageContainer";
import { PageTitle } from "@/components/base/PageTitle";
import { PageTitleRow } from "@/components/base/PageTitleRow";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FC, useEffect, useState } from "react";
import {
  ChevronRight,
  HelpCircle,
  Users,
  Activity,
  Database,
  FileText,
  BookA,
} from "lucide-react";
import { Link } from "react-router-dom";

const HelpPage: FC = () => {
  // State to keep track of which accordion item is open
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);

  // Function to handle navigation clicks
  const handleNavClick = (itemValue: string) => (e: React.MouseEvent) => {
    // Set the open accordion item
    setOpenItem(itemValue);
  };

  // Check URL hash on component mount and when it changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (
        hash &&
        [
          "overview",
          "roles",
          "arbiter-workflow",
          "dapp-registration",
          "faq",
        ].includes(hash)
      ) {
        setOpenItem(hash);
      }
    };

    // Check hash on mount
    handleHashChange();

    // Add event listener for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <PageContainer>
      <PageTitleRow>
        <PageTitle>Help and Information</PageTitle>
      </PageTitleRow>

      <div className="bg-white shadow rounded-lg p-6 lg:p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary-700 border-b pb-3">
          Welcome to the{" "}
          <span className="text-primary-800">BeL2 Arbiter Portal</span>!
        </h2>

        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
          This portal is your interface to the{" "}
          <span className="font-medium text-primary-700">BeL2</span> (Bitcoin
          Elastos Layer 2) Decentralized Arbitration Protocol. It allows{" "}
          <span className="font-medium">Arbiters</span> to register, manage
          their stakes, and monitor their activity.{" "}
          <span className="font-medium">DApp developers</span> can also register
          their applications to utilize the network of Arbiters.
        </p>

        {/* Quick Navigation */}
        <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-600" />
            Quick Navigation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <a
              href="#overview"
              onClick={handleNavClick("overview")}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              What is BeL2 Arbitration?
            </a>
            <a
              href="#bel2-overview"
              onClick={handleNavClick("bel2-overview")}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              BeL2 Comprehensive Overview
            </a>
            <a
              href="#roles"
              onClick={handleNavClick("roles")}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Key Roles in the Protocol
            </a>
            <a
              href="#arbiter-workflow"
              onClick={handleNavClick("arbiter-workflow")}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Becoming an Arbiter
            </a>
            <a
              href="#arbiter-signer-setup"
              onClick={handleNavClick("arbiter-signer-setup")}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Arbiter Signer Setup Guide
            </a>
            <a
              href="#dapp-registration"
              onClick={handleNavClick("dapp-registration")}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Registering a DApp
            </a>
            <a
              href="#faq"
              onClick={handleNavClick("faq")}
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              Frequently Asked Questions
            </a>
            <Link
              to="/glossary"
              className="flex items-center p-2 hover:bg-gray-100 rounded-md text-primary-600 hover:text-primary-800 transition-colors"
            >
              <BookA className="h-4 w-4 mr-1" />
              Glossary of Terms
            </Link>
          </div>
        </div>

        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4"
          value={openItem}
          onValueChange={setOpenItem}
        >
          <AccordionItem
            value="overview"
            id="overview"
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-lg font-medium">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-3 text-primary-600" />
                What is the BeL2 Arbitration Protocol?
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  The{" "}
                  <span className="font-medium text-primary-700">
                    BeL2 Arbitration Protocol
                  </span>{" "}
                  provides a trustless mechanism for securing Bitcoin
                  transactions, especially those involving interactions with the{" "}
                  <span className="font-medium">Elastos Smart Chain (ESC)</span>{" "}
                  and other EVM-compatible chains. It relies on a network of
                  independent
                  <span className="font-medium"> Arbiters</span> who stake
                  collateral to guarantee the correct execution of transactions.
                  If an Arbiter misbehaves, their stake can be used to{" "}
                  <span className="font-semibold">compensate users</span> who
                  are affected.
                </p>

                <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
                  <h4 className="font-bold text-primary-800 mb-2">
                    How BeL2 Differs from Wrapped Bitcoin (WBTC) and Other
                    Centralized Solutions:
                  </h4>
                  <p className="text-gray-700 mb-3">
                    Solutions like Wrapped Bitcoin (WBTC) rely on a centralized
                    custodian to hold the actual Bitcoin. You give your Bitcoin
                    to this custodian, and they issue you an equivalent token
                    (WBTC) on another blockchain. This introduces a single point
                    of failure and requires trust in that custodian.
                  </p>
                  <p className="text-gray-700 font-medium">
                    BeL2 takes a fundamentally different approach:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700 mt-2">
                    <li>
                      <span className="font-medium">
                        Decentralized and Trust-Minimized:
                      </span>{" "}
                      Instead of a single custodian, BeL2 uses a network of
                      independent arbiters, distributing trust and making the
                      system more resistant to censorship or hacks.
                    </li>
                    <li>
                      <span className="font-medium">
                        No Custody of Bitcoin:
                      </span>{" "}
                      The Bitcoin remains on the Bitcoin blockchain. Arbiters
                      only provide signatures that authorize transactions when
                      necessary, dramatically reducing risk of loss or theft.
                    </li>
                    <li>
                      <span className="font-medium">
                        Automated Dispute Resolution:
                      </span>{" "}
                      If a dispute arises, the protocol provides an automated
                      mechanism for resolution and compensation.
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-md border-l-4 border-purple-400">
                  <h4 className="font-bold text-primary-800 mb-2">
                    The Role of Signature Verification and Zero-Knowledge Proofs
                    (ZKPs):
                  </h4>
                  <p className="text-gray-700 mb-3">
                    A crucial part of the BeL2 protocol is how it verifies that
                    an arbiter has acted correctly (or incorrectly) without
                    needing to reveal sensitive Bitcoin transaction details on
                    the Elastos Smart Chain.
                  </p>
                  <p className="text-gray-700">
                    The BeL2 protocol incorporates{" "}
                    <span className="font-medium">
                      Zero-Knowledge Proofs (ZKPs)
                    </span>
                    , advanced cryptographic techniques that allow proving the
                    validity of a Bitcoin transaction (or the incorrectness of
                    an arbiter's actions) without revealing the transaction
                    details themselves on the ESC. This provides enhanced
                    privacy and security while allowing for dispute resolution.
                  </p>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  In summary, BeL2 provides a more secure and decentralized way
                  to use Bitcoin in DApps by eliminating single points of
                  failure, keeping Bitcoin on Bitcoin, automating dispute
                  resolution, and leveraging advanced cryptographic verification
                  methods. This makes it a powerful tool for building robust and
                  trustworthy Bitcoin-integrated applications on EVM-compatible
                  chains.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="bel2-overview"
            id="bel2-overview"
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-lg font-medium">
              <div className="flex items-center">
                <BookA className="h-5 w-5 mr-3 text-primary-600" />
                BeL2 Comprehensive Overview
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="space-y-6">
                {/* Introduction to BeL2 */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    Introduction to BeL2
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    BeL2 (Bitcoin-Elastos Layer 2) is an innovative layer 2
                    solution that bridges Bitcoin's security with the
                    versatility of smart contracts and decentralized
                    applications (dApps). By leveraging advanced zero-knowledge
                    proofs, BeL2 maintains Bitcoin's robust security while
                    significantly expanding its utility in the blockchain
                    ecosystem.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    BeL2 enables Bitcoin to interact seamlessly with other
                    blockchain networks, particularly Ethereum-compatible
                    chains, opening up new possibilities for DeFi applications,
                    cross-chain functionality, and more. The core philosophy
                    behind BeL2 is encapsulated in its "Be Your Own Bank"
                    principle, allowing users to put their Bitcoin holdings to
                    work while maintaining security.
                  </p>
                </div>

                {/* Core Features of BeL2 */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    Core Features of BeL2
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
                      <h4 className="font-bold text-primary-800 mb-2">
                        1. Cross-chain Interoperability
                      </h4>
                      <p className="text-gray-700">
                        BeL2 facilitates seamless interaction between Bitcoin
                        and EVM-compatible chains, particularly the Elastos
                        Smart Chain (ESC). This allows Bitcoin users to leverage
                        their assets across various DeFi applications without
                        compromising security.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-400">
                      <h4 className="font-bold text-primary-800 mb-2">
                        2. Bitcoin-backed Lending
                      </h4>
                      <p className="text-gray-700">
                        One of BeL2's flagship applications enables users to use
                        their Bitcoin as collateral for loans in stablecoins or
                        other cryptocurrencies. This functionality is
                        implemented through a secure, non-custodial lending
                        platform.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md border-l-4 border-purple-400">
                      <h4 className="font-bold text-primary-800 mb-2">
                        3. Smart Contract Integration
                      </h4>
                      <p className="text-gray-700">
                        BeL2 brings programmability to Bitcoin by enabling
                        complex financial operations and dApps that leverage
                        Bitcoin's security and value, significantly expanding
                        Bitcoin's utility beyond simple transfers.
                      </p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-md border-l-4 border-amber-400">
                      <h4 className="font-bold text-primary-800 mb-2">
                        4. Improved Scalability
                      </h4>
                      <p className="text-gray-700">
                        By processing transactions off-chain and using
                        zero-knowledge proofs for verification, BeL2 drastically
                        reduces fees and increases throughput for
                        Bitcoin-related operations.
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-400 md:col-span-2">
                      <h4 className="font-bold text-primary-800 mb-2">
                        5. Decentralized Architecture
                      </h4>
                      <p className="text-gray-700">
                        BeL2 is built for peer-to-peer contracts and is managed
                        by zkBTC Full Nodes and Arbitrator Nodes to maintain
                        decentralization while ensuring security and efficiency.
                      </p>
                    </div>
                  </div>
                </div>

                {/* The Three S's: Core Principles */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    The Three S's: Core Principles of BeL2
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-bold text-blue-800 mb-2 text-lg">
                        Secure
                      </h4>
                      <ul className="list-disc ml-6 space-y-1 text-gray-700">
                        <li>
                          Leverages Bitcoin's robust Proof-of-Work consensus and
                          decentralized network
                        </li>
                        <li>
                          Employs zero-knowledge proofs to verify transactions
                          while maintaining privacy
                        </li>
                        <li>
                          Implements rigorous smart contract auditing to
                          mitigate vulnerabilities
                        </li>
                        <li>
                          Utilizes an Arbitrator Network for additional security
                          and dispute resolution
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-bold text-green-800 mb-2 text-lg">
                        Smart
                      </h4>
                      <ul className="list-disc ml-6 space-y-1 text-gray-700">
                        <li>
                          Acts as an interface between Bitcoin's limited
                          scripting and more flexible smart contract platforms
                        </li>
                        <li>
                          Enables developers to create sophisticated smart
                          contracts that interact with Bitcoin-related
                          information
                        </li>
                        <li>
                          Facilitates complex financial instruments using
                          Bitcoin as collateral without moving the Bitcoin
                          itself
                        </li>
                        <li>
                          Enables cross-chain operations, allowing for seamless
                          interaction between Bitcoin and other blockchain
                          ecosystems
                        </li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h4 className="font-bold text-purple-800 mb-2 text-lg">
                        Stable
                      </h4>
                      <ul className="list-disc ml-6 space-y-1 text-gray-700">
                        <li>
                          Offers faster and more cost-effective transactions
                          without compromising security
                        </li>
                        <li>
                          Distributes risk through a peer-to-peer network to
                          enhance system resilience
                        </li>
                        <li>
                          Structures economic incentives to maintain network
                          stability
                        </li>
                        <li>
                          Implements advanced risk management strategies for
                          DeFi applications to handle market volatility
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* BeL2 Architecture */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    BeL2 Architecture
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The BeL2 architecture consists of several interconnected
                    components that work together to bridge Bitcoin with
                    EVM-compatible chains:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500">
                      <h4 className="font-semibold text-primary-800">
                        zkBTC Full Nodes
                      </h4>
                      <p className="text-gray-700 text-sm">
                        These specialized nodes can run on ordinary hardware,
                        even mobile phones. They monitor the Bitcoin network and
                        generate proofs of transactions using zero-knowledge
                        technology.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-green-500">
                      <h4 className="font-semibold text-primary-800">
                        Cairo Circuit
                      </h4>
                      <p className="text-gray-700 text-sm">
                        This component is used to generate and verify Bitcoin
                        transaction proofs. It's essential for creating
                        zero-knowledge proofs that can be verified on other
                        chains.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-amber-500">
                      <h4 className="font-semibold text-primary-800">
                        Arbitrator Network
                      </h4>
                      <p className="text-gray-700 text-sm">
                        The Arbitrator Network, including Arbitrator Nodes, is
                        central to the architecture. It facilitates the
                        transmission of data and proofs between Bitcoin and
                        other blockchains.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-purple-500">
                      <h4 className="font-semibold text-primary-800">
                        EVM ZKP Contract
                      </h4>
                      <p className="text-gray-700 text-sm">
                        This smart contract bridges Bitcoin transactions with
                        EVM-compatible chains. It receives, processes, and
                        verifies zero-knowledge proofs of Bitcoin transactions.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-red-500">
                      <h4 className="font-semibold text-primary-800">
                        Transaction Verifier Contract
                      </h4>
                      <p className="text-gray-700 text-sm">
                        Deployed on EVM-compatible chains, this contract
                        receives and processes requests to verify Bitcoin
                        transactions. It maintains a list of verified
                        transactions.
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md border-l-4 border-gray-500">
                      <h4 className="font-semibold text-primary-800">
                        BeL2 SDK
                      </h4>
                      <p className="text-gray-700 text-sm">
                        The BeL2 SDK serves as a toolkit for developers,
                        enabling them to build applications that leverage BeL2's
                        architecture. It simplifies creating dApps that interact
                        with both Bitcoin and EVM-compatible chains.
                      </p>
                    </div>
                  </div>
                </div>

                {/* BeL2 Use Cases */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    BeL2 Use Cases
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-bold text-blue-800 mb-2">
                        Lending and Borrowing
                      </h4>
                      <ul className="list-disc ml-5 space-y-1 text-gray-700 text-sm">
                        <li>Use Bitcoin as collateral to borrow stablecoins</li>
                        <li>
                          Lend stablecoins and earn interest secured by Bitcoin
                          collateral
                        </li>
                        <li>
                          Maintain self-custody throughout the lending/borrowing
                          process
                        </li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-bold text-green-800 mb-2">
                        Trading and Exchanges
                      </h4>
                      <ul className="list-disc ml-5 space-y-1 text-gray-700 text-sm">
                        <li>
                          Cross-chain asset swaps between Bitcoin and tokens on
                          EVM-compatible chains
                        </li>
                        <li>
                          Decentralized exchange functionality without wrapping
                          Bitcoin
                        </li>
                        <li>Direct peer-to-peer trading with Bitcoin</li>
                      </ul>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-amber-50 p-4 rounded-md">
                      <h4 className="font-bold text-amber-800 mb-2">
                        DeFi Integration
                      </h4>
                      <ul className="list-disc ml-5 space-y-1 text-gray-700 text-sm">
                        <li>Yield farming on EVM-compatible chains</li>
                        <li>Liquidity provision using Bitcoin as collateral</li>
                        <li>
                          Complex DeFi strategies without moving Bitcoin off the
                          main chain
                        </li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h4 className="font-bold text-purple-800 mb-2">
                        Future Applications
                      </h4>
                      <ul className="list-disc ml-5 space-y-1 text-gray-700 text-sm">
                        <li>Native Bitcoin staking</li>
                        <li>NFTs and Ordinals support</li>
                        <li>Cross-chain governance using Bitcoin holdings</li>
                        <li>Integration with traditional financial systems</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Resources section */}
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="text-lg font-bold text-primary-800 mb-2">
                    Resources and Links
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded mr-2 text-xs">
                        Website
                      </span>
                      <a
                        href="https://bel2.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 underline"
                      >
                        https://bel2.org/
                      </a>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-green-100 text-green-800 font-medium px-2 py-1 rounded mr-2 text-xs">
                        Lending App
                      </span>
                      <a
                        href="https://lending.bel2.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 underline"
                      >
                        https://lending.bel2.org/
                      </a>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-amber-100 text-amber-800 font-medium px-2 py-1 rounded mr-2 text-xs">
                        Documentation
                      </span>
                      <a
                        href="https://docs.bel2.org/docs/SDK/sdk-overview"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 underline"
                      >
                        https://docs.bel2.org/
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Note about Arbitration Protocol's place in BeL2 */}
                <div className="bg-primary-50 p-4 rounded-md border-l-4 border-primary-400">
                  <h4 className="font-bold text-primary-800 mb-2">
                    Where the Arbitration Protocol Fits In
                  </h4>
                  <p className="text-gray-700">
                    The BeL2 Arbitration Protocol is a crucial component of the
                    BeL2 ecosystem that helps ensure the security and
                    reliability of cross-chain operations. As described in the
                    previous section, the Arbitrator Network plays a vital role
                    in maintaining the integrity of the system by acting as
                    guarantors for Bitcoin transactions initiated by DApps on
                    EVM-compatible chains.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="roles"
            id="roles"
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-lg font-medium">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-primary-600" />
                Key Roles in the Protocol
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
                  <p className="font-bold text-blue-800 mb-2 text-lg">
                    Arbiters:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>
                      Act as <span className="font-medium">guarantors</span> for
                      Bitcoin transactions initiated by DApps.
                    </li>
                    <li>
                      <span className="font-medium">
                        Stake ELA or specific NFTs
                      </span>{" "}
                      as collateral to ensure honest behavior.
                    </li>
                    <li>
                      May be required to{" "}
                      <span className="font-medium">
                        sign Bitcoin transactions
                      </span>{" "}
                      in dispute scenarios.
                    </li>
                    <li>
                      <span className="font-medium">Earn fees</span> for
                      providing their services, proportional to their stake.
                    </li>
                    <li>
                      Use this portal to register, manage their stake, and
                      configure settings.
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-400">
                  <p className="font-bold text-green-800 mb-2 text-lg">
                    DApps (Decentralized Applications):
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>
                      Applications built on the{" "}
                      <span className="font-medium">Elastos Smart Chain</span>{" "}
                      (or other compatible chains) that integrate with Bitcoin.
                    </li>
                    <li>
                      <span className="font-medium">
                        Register with the Arbitration Protocol
                      </span>{" "}
                      to use the services of Arbiters.
                    </li>
                    <li>
                      <span className="font-medium">Pay fees</span> to Arbiters
                      for their guarantees.
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-md border-l-4 border-purple-400">
                  <p className="font-bold text-purple-800 mb-2 text-lg">
                    Users (DApp Users):
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>
                      End-users of DApps that utilize the Arbitration Protocol.
                    </li>
                    <li>
                      Benefit from{" "}
                      <span className="font-medium">
                        increased security and trust
                      </span>{" "}
                      when interacting with Bitcoin through DApps.
                    </li>
                    <li>
                      Can initiate{" "}
                      <span className="font-medium">compensation claims</span>{" "}
                      if an Arbiter misbehaves.
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="arbiter-workflow"
            id="arbiter-workflow"
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-lg font-medium">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-3 text-primary-600" />
                Becoming an Arbiter: A Step-by-Step Guide
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <ol className="space-y-4 relative border-l-2 border-gray-200 pl-6 ml-2 pt-2">
                {[
                  {
                    title: "Prepare Your Wallets",
                    content: (
                      <>
                        You'll need both an{" "}
                        <span className="font-medium">
                          EVM-compatible wallet
                        </span>{" "}
                        (like MetaMask) connected to the Elastos Smart Chain
                        (ESC) and a{" "}
                        <span className="font-medium">Bitcoin wallet</span> that
                        supports signing messages (like Unisat or OKX Wallet).
                        Make sure you have some ELA in your EVM wallet to cover
                        staking and transaction fees.
                      </>
                    ),
                  },
                  {
                    title: "Navigate to Register Arbiter",
                    content:
                      "Go to the Register Arbiter section of this portal.",
                  },
                  {
                    title: "Connect Wallet",
                    content: (
                      <>
                        Your <span className="font-medium">EVM address</span>{" "}
                        (from where you will interact with the contracts) and
                        your{" "}
                        <span className="font-medium">
                          BTC address and public key
                        </span>{" "}
                        (used by the protocol to know which address you sign for
                        on bitcoin) are required to continue.
                      </>
                    ),
                  },
                  {
                    title: "Choose Stake Type",
                    content: (
                      <>
                        Decide whether to stake{" "}
                        <span className="font-medium">ELA coins</span> or{" "}
                        <span className="font-medium">BPoS NFTs</span>.
                      </>
                    ),
                  },
                  {
                    title: "Enter Stake Amount",
                    content: (
                      <>
                        Specify the amount of ELA or the NFTs you want to stake.
                        There's a{" "}
                        <span className="font-medium">
                          minimum and maximum stake amount
                        </span>
                        .
                      </>
                    ),
                  },
                  {
                    title: "Set Operator (Optional)",
                    content: (
                      <>
                        By default, your connected EVM wallet will be your
                        operator. You can assign a{" "}
                        <span className="font-medium">
                          different EVM account
                        </span>
                        , and provide the BTC address and public key for the
                        operator to sign bitcoin transactions.
                      </>
                    ),
                  },
                  {
                    title: "Set Revenue Addresses",
                    content: (
                      <>
                        Specify the EVM address where you'd like to receive{" "}
                        <span className="font-medium">ELA fees</span>, and the
                        Bitcoin address where you will receive{" "}
                        <span className="font-medium">BTC fees</span>.
                      </>
                    ),
                  },
                  {
                    title: "Set Fee Rate",
                    content: (
                      <>
                        Define the{" "}
                        <span className="font-medium">
                          annual percentage fee
                        </span>{" "}
                        you'll charge for your services.
                      </>
                    ),
                  },
                  {
                    title: "Set Deadline",
                    content: (
                      <>
                        Choose a <span className="font-medium">deadline</span>{" "}
                        for your arbiter service commitment. This is the date
                        until which you commit to acting as an arbiter. You can
                        extend this later.
                      </>
                    ),
                  },
                  {
                    title: "Confirm and Submit",
                    content: (
                      <>
                        Review all the information, and submit the transaction.
                        This will{" "}
                        <span className="font-medium">
                          register you as an arbiter
                        </span>{" "}
                        and lock up your stake.
                      </>
                    ),
                  },
                  {
                    title: "Run the Arbiter Signer (Separate Application)",
                    content: (
                      <>
                        This portal is only for managing your registration and
                        stake. To{" "}
                        <span className="font-semibold">
                          actually act as an arbiter and sign transactions
                        </span>
                        , you need to download and run the separate{" "}
                        <a
                          href="https://github.com/BeL2Labs/Arbiter_Signer"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 underline font-medium"
                        >
                          arbiter_signer
                        </a>{" "}
                        application. This application listens for events on the
                        blockchain and signs Bitcoin transactions when needed.
                        See the{" "}
                        <a
                          href="https://github.com/BeL2Labs/Arbiter_Signer#readme"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 underline font-medium"
                        >
                          setup instructions
                        </a>{" "}
                        in the official repository for detailed guidance on
                        installing and configuring the{" "}
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                          arbiter_signer
                        </code>
                        .
                      </>
                    ),
                  },
                ].map((step, index) => (
                  <li key={index} className="relative">
                    <div className="absolute -left-8 mt-1 rounded-full bg-primary-100 border-2 border-primary-500 h-4 w-4"></div>
                    <div>
                      <h4 className="text-md font-bold text-primary-700">
                        {index + 1}. {step.title}
                      </h4>
                      <p className="text-gray-700 mt-1 leading-relaxed">
                        {step.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="arbiter-signer-setup"
            id="arbiter-signer-setup"
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-lg font-medium">
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-3 text-primary-600" />
                Arbiter Signer Setup Guide
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="space-y-6">
                {/* Introduction */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    Introduction to the Arbiter Signer
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Arbiter Signer is a crucial component that enables you
                    to fulfill your role as an Arbiter in the BeL2 ecosystem. It
                    provides the signing services required for cross-chain
                    operations and ensures network security and stability. This
                    guide will walk you through the setup process with a
                    simplified one-click solution.
                  </p>
                </div>

                {/* About Arbiter/Arbitrator Nodes */}
                <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-400">
                  <h4 className="font-bold text-primary-800 mb-2">
                    About Arbiter/Arbitrator Nodes
                  </h4>
                  <p className="text-gray-700 mb-3">
                    The Arbitrator Network is a key component that enables
                    cross-chain operations and maintains system integrity:
                  </p>
                  <ul className="list-disc ml-6 space-y-1 text-gray-700">
                    <li>
                      Decentralized nodes relay data and proofs between
                      different blockchain networks
                    </li>
                    <li>Manage redemptions and dispute resolution</li>
                    <li>
                      Stake BTC, ELA (Elastos tokens), or BPoS NFTs as
                      collateral to ensure honest behavior
                    </li>
                  </ul>
                </div>

                {/* Benefits of Being an Arbiter */}
                <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-400">
                  <h4 className="font-bold text-primary-800 mb-2">
                    Benefits of Being an Arbiter
                  </h4>
                  <p className="text-gray-700 mb-3">
                    As an Arbiter in the BeL2 ecosystem, you'll enjoy:
                  </p>
                  <ol className="list-decimal ml-6 space-y-2 text-gray-700">
                    <li>
                      Supporting a growing BeL2 ecosystem of BTCFI dApps in
                      return for set fees
                    </li>
                    <li>
                      Earning rewards from various services, such as:
                      <ul className="list-disc ml-6 mt-1 space-y-1">
                        <li>Lending protocols</li>
                        <li>Stablecoin issuance services (including NBW)</li>
                        <li>Cross-chain transaction facilitation</li>
                      </ul>
                    </li>
                    <li>
                      Participation in BeL2 governance and decision-making
                      processes
                    </li>
                    <li>
                      Potential future airdrops or additional incentives from
                      the BeL2 community
                    </li>
                    <li>
                      Contributing to the advancement of Bitcoin-based
                      decentralized finance
                    </li>
                  </ol>
                </div>

                {/* Prerequisites */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    Prerequisites
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Ensure you have the following before beginning:
                  </p>
                  <ol className="list-decimal ml-6 space-y-2 text-gray-700">
                    <li>
                      <span className="font-medium">
                        An Elastos Smart Chain (ESC) Wallet with ELA Tokens
                      </span>{" "}
                      - Set up by following the{" "}
                      <a
                        href="https://elastos.info/news/introducing-the-elastos-smart-chain-esc-and-cross-chain-operation-manual/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 underline"
                      >
                        Elastos Smart Chain and Cross-Chain Operation Manual
                      </a>{" "}
                      to meet staking requirements
                    </li>
                    <li>
                      <span className="font-medium">
                        Metamask Browser Extension
                      </span>{" "}
                      (for Arbiter Registration)
                    </li>
                    <li>
                      <span className="font-medium">Bitcoin Wallet</span>{" "}
                      (Unisat or OKX Browser Extension)
                    </li>
                    <li>
                      <span className="font-medium">
                        Completed Arbiter Registration
                      </span>{" "}
                      (as described in the "Becoming an Arbiter" section)
                    </li>
                  </ol>
                </div>

                {/* Video Tutorials */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    Video Tutorials
                  </h3>
                  <p className="text-gray-700 mb-4">
                    You can follow along with these setup guide videos:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Step 1: Arbiter Registration
                      </h4>
                      <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                        <iframe
                          className="w-full h-64"
                          src="https://www.youtube.com/embed/6AN-UjhPd8c"
                          title="Arbiter Registration Tutorial"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Step 2: Arbiter Signer Setup
                      </h4>
                      <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                        <iframe
                          className="w-full h-64"
                          src="https://www.youtube.com/embed/ZvyuuJLKRNA"
                          title="Arbiter Signer Setup Tutorial"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  </div>
                </div>

                {/* One-Click Setup Process */}
                <div>
                  <h3 className="text-xl font-bold text-primary-800 mb-3">
                    One-Click Setup Process
                  </h3>

                  <ol className="space-y-4 relative border-l-2 border-gray-200 pl-6 ml-2 pt-2 mb-4">
                    <li className="relative">
                      <div className="absolute -left-8 mt-1 rounded-full bg-primary-100 border-2 border-primary-500 h-4 w-4"></div>
                      <div>
                        <h4 className="text-md font-bold text-primary-700">
                          1. Download the Arbiter Signer
                        </h4>
                        <p className="text-gray-700 mt-1 leading-relaxed">
                          Download the latest release for your operating system
                          from the{" "}
                          <a
                            href="https://github.com/yujingr/BeL2ArbiterGUI/releases/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800 underline"
                          >
                            Releases section
                          </a>{" "}
                          of the community-maintained Arbiter Signer repository.
                        </p>
                      </div>
                    </li>

                    <li className="relative">
                      <div className="absolute -left-8 mt-1 rounded-full bg-primary-100 border-2 border-primary-500 h-4 w-4"></div>
                      <div>
                        <h4 className="text-md font-bold text-primary-700">
                          2. Run the Executable
                        </h4>
                        <p className="text-gray-700 mt-1 leading-relaxed">
                          Run the executable to start the interactive setup
                          process.
                        </p>
                        <div className="bg-gray-50 p-3 mt-2 rounded-md">
                          <h5 className="font-semibold text-primary-700 mb-1">
                            Platform-Specific Instructions:
                          </h5>
                          <ul className="list-disc ml-6 space-y-2 text-gray-700">
                            <li>
                              <span className="font-medium">macOS users:</span>{" "}
                              Due to Apple's security measures, you'll need to:
                              <ol className="list-decimal ml-6 mt-1 text-sm">
                                <li>Right-click (or Control-click) the app</li>
                                <li>Select "Open" from the context menu</li>
                                <li>
                                  Click "Open" in the security dialog that
                                  appears
                                </li>
                              </ol>
                            </li>
                            <li>
                              <span className="font-medium">Linux users:</span>{" "}
                              We assume some technical proficiency. Available
                              formats:
                              <ul className="ml-6 mt-1 text-sm space-y-1">
                                <li>
                                  <span className="font-medium">
                                    For .AppImage files:
                                  </span>
                                  <pre className="bg-gray-100 p-1 rounded text-sm mt-1 overflow-x-auto">
                                    chmod +x filename.AppImage
                                    ./filename.AppImage
                                  </pre>
                                </li>
                                <li>
                                  <span className="font-medium">
                                    For .deb files (Debian, Ubuntu):
                                  </span>
                                  <pre className="bg-gray-100 p-1 rounded text-sm mt-1 overflow-x-auto">
                                    sudo dpkg -i filename.deb sudo apt install
                                    -f # if dependencies issues
                                  </pre>
                                </li>
                                <li>
                                  <span className="font-medium">
                                    For .rpm files (Fedora, RHEL):
                                  </span>
                                  <pre className="bg-gray-100 p-1 rounded text-sm mt-1 overflow-x-auto">
                                    sudo dnf install filename.rpm
                                  </pre>
                                </li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>

                    <li className="relative">
                      <div className="absolute -left-8 mt-1 rounded-full bg-primary-100 border-2 border-primary-500 h-4 w-4"></div>
                      <div>
                        <h4 className="text-md font-bold text-primary-700">
                          3. Configure Your Arbiter Node
                        </h4>
                        <p className="text-gray-700 mt-1 leading-relaxed">
                          Follow the prompts to configure your arbiter node.
                          You'll need to provide:
                        </p>
                        <ul className="list-disc ml-6 space-y-1 text-gray-700 mt-2">
                          <li>Your BTC private key</li>
                          <li>Your ESC private key</li>
                          <li>Your arbiter wallet address</li>
                          <li>A custom password to encrypt the private keys</li>
                        </ul>
                      </div>
                    </li>

                    <li className="relative">
                      <div className="absolute -left-8 mt-1 rounded-full bg-primary-100 border-2 border-primary-500 h-4 w-4"></div>
                      <div>
                        <h4 className="text-md font-bold text-primary-700">
                          4. Start and Monitor Your Arbiter Signer
                        </h4>
                        <p className="text-gray-700 mt-1 leading-relaxed">
                          Once configured, the Arbiter Signer will start running
                          automatically. Ensure it stays running and monitor its
                          operation.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Important Notes */}
                <div className="bg-amber-50 p-4 rounded-md border-l-4 border-amber-400">
                  <h4 className="font-bold text-primary-800 mb-2">
                    Important Notes
                  </h4>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700">
                    <li>
                      Ensure you have a stable internet connection and 24/7
                      system availability.
                    </li>
                    <li>
                      It's recommended to set up a monitoring system to alert
                      you of any downtime.
                    </li>
                    <li>
                      Make sure you have sufficient stake as required by the
                      BeL2 protocol.
                    </li>
                    <li>
                      For advanced setups or production deployments, refer to
                      the{" "}
                      <a
                        href="https://github.com/BeL2Labs/Arbiter_Signer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 underline"
                      >
                        official repository
                      </a>{" "}
                      and its{" "}
                      <a
                        href="https://github.com/BeL2Labs/Arbiter_Signer/blob/main/docs/deploy_loan_arbiter.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 underline"
                      >
                        deployment guide
                      </a>
                      .
                    </li>
                  </ul>
                </div>

                {/* Key Management */}
                <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-400">
                  <h4 className="font-bold text-red-800 mb-2">
                    Important Note on Key Management
                  </h4>
                  <p className="text-gray-700 mb-3">
                    The BTC private key and ESC private keys are managed
                    privately and securely by you, the Arbiter. With the latest
                    updates, the keys are encrypted using a custom password
                    which needs to be provided when you run the program.
                  </p>
                  <p className="text-gray-700 font-medium">
                    For enhanced security:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-gray-700 mt-2">
                    <li>
                      Create a new BTC key pair/wallet specifically for this
                      purpose.
                    </li>
                    <li>
                      The key is managed solely by you and is never shared with
                      or accessible by the BeL2 system.
                    </li>
                    <li>
                      While the Arbiter node setup automates the signing process
                      for convenience, you have the option to sign transactions
                      manually using your preferred wallet.
                    </li>
                    <li className="font-semibold text-red-700">
                      Always prioritize the security of your private keys and
                      follow best practices for key management.
                    </li>
                  </ul>
                </div>

                {/* Conclusion */}
                <div className="bg-primary-50 p-4 rounded-md">
                  <h4 className="font-bold text-primary-800 mb-2">
                    Conclusion
                  </h4>
                  <p className="text-gray-700 mb-2">
                    Congratulations on setting up your BeL2 Arbiter node! As an
                    Arbiter, you play a vital role in the BeL2 ecosystem,
                    facilitating cross-chain operations and ensuring network
                    security and stability.
                  </p>
                  <p className="text-gray-700">
                    Stay updated with the latest developments and participate
                    actively in the community. Your contribution is essential to
                    the growth and success of the BeL2 system.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="dapp-registration"
            id="dapp-registration"
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-lg font-medium">
              <div className="flex items-center">
                <Database className="h-5 w-5 mr-3 text-primary-600" />
                Registering a DApp
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="bg-amber-50 p-4 rounded-md mb-4 border-l-4 border-amber-400">
                <p className="font-medium text-amber-800">
                  Before beginning the DApp registration process, ensure your
                  DApp is{" "}
                  <span className="font-semibold">ready for integration</span>{" "}
                  with the BeL2 protocol.
                </p>
              </div>
              <ol className="space-y-4 relative border-l-2 border-gray-200 pl-6 ml-2 pt-2 mb-4">
                {[
                  {
                    title: "Connect Your Wallet",
                    content: (
                      <>
                        Connect the EVM wallet that{" "}
                        <span className="font-medium">
                          owns your DApp's contract
                        </span>
                        .
                      </>
                    ),
                  },
                  {
                    title: "Navigate to Register DApp",
                    content: "Go to the Register DApp section of the portal.",
                  },
                  {
                    title: "Enter DApp Address",
                    content: (
                      <>
                        Provide the{" "}
                        <span className="font-medium">contract address</span> of
                        your DApp on the Elastos Smart Chain.
                      </>
                    ),
                  },
                  {
                    title: "Pay Registration Fee",
                    content: (
                      <>
                        A one-time fee of{" "}
                        <span className="font-medium">10 ELA</span> is required
                        to register.
                      </>
                    ),
                  },
                  {
                    title: "Wait for Authorization",
                    content: (
                      <>
                        After registration, your DApp will be in a{" "}
                        <span className="font-medium">Pending state</span>. The
                        protocol administrators must{" "}
                        <span className="font-medium">authorize your DApp</span>{" "}
                        before it can start using the arbitration services.
                      </>
                    ),
                  },
                ].map((step, index) => (
                  <li key={index} className="relative">
                    <div className="absolute -left-8 mt-1 rounded-full bg-amber-100 border-2 border-amber-500 h-4 w-4"></div>
                    <div>
                      <h4 className="text-md font-bold text-amber-700">
                        {index + 1}. {step.title}
                      </h4>
                      <p className="text-gray-700 mt-1 leading-relaxed">
                        {step.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="bg-gray-50 p-4 rounded-md text-gray-700 leading-relaxed">
                After registration and authorization, you'll need to{" "}
                <span className="font-medium">
                  integrate the Arbitration Protocol's smart contracts
                </span>{" "}
                into your DApp's code. This will allow your DApp to request
                arbiter guarantees for Bitcoin transactions.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="faq"
            id="faq"
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-lg font-medium">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-3 text-primary-600" />
                Frequently Asked Questions (FAQ)
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-2">
              <div className="space-y-6">
                {[
                  {
                    question: "How are arbiters chosen?",
                    answer: (
                      <>
                        Arbiters are chosen by the{" "}
                        <span className="font-medium">
                          DApp that initiates the transaction
                        </span>
                        , at the smart contract level. This portal does not
                        currently provide a mechanism for selecting arbiters;
                        it's up to the DApp to implement its own selection
                        logic. Some possible selection algorithms include:{" "}
                        <span className="font-medium">random selection</span>,{" "}
                        <span className="font-medium">
                          round-robin selection
                        </span>
                        , or selection based on factors such as stake amount,
                        fee rate, or past performance.
                      </>
                    ),
                  },
                  {
                    question:
                      "What happens if the arbiter doesn't sign when requested?",
                    answer: (
                      <>
                        If an arbiter doesn't respond to an arbitration request
                        within the configured timeout period, the user/DApp can
                        submit a{" "}
                        <span className="font-medium text-red-700">
                          Timeout Compensation claim
                        </span>
                        . The proof of timeout is automatically verified by the
                        smart contract.
                      </>
                    ),
                  },
                  {
                    question: "What if the arbiter provides a wrong signature?",
                    answer: (
                      <>
                        If the arbiter signs an incorrect Bitcoin transaction,
                        the user/DApp can submit a{" "}
                        <span className="font-medium text-red-700">
                          Failed Arbitration Compensation claim
                        </span>
                        . This currently requires a signature validation,{" "}
                        <span className="font-medium">not</span> a full ZKP.
                      </>
                    ),
                  },
                  {
                    question:
                      "What if the arbiter signs a transaction without a request?",
                    answer: (
                      <>
                        If the arbiter signs a Bitcoin transaction{" "}
                        <span className="font-medium">without</span> a
                        corresponding arbitration request from a DApp, this is
                        considered{" "}
                        <span className="font-medium text-red-700">
                          Illegal Signature
                        </span>{" "}
                        behavior. The user/DApp can submit an Illegal Signature
                        Compensation claim, again with signature validation.
                      </>
                    ),
                  },
                  {
                    question:
                      "What is signature validation and how does it relate to ZKP?",
                    answer: (
                      <>
                        <span className="font-medium">
                          Signature validation
                        </span>{" "}
                        is a process that checks that a given signature is valid
                        for a given message (transaction hash) and public key.{" "}
                        <span className="font-medium">
                          ZKP (Zero-Knowledge Proof)
                        </span>{" "}
                        allows proving the validity of a statement{" "}
                        <span className="font-medium">without</span> revealing
                        the underlying data (like the signature itself). The
                        BeL2 protocol implements ZKP verification to enable
                        secure dispute resolution while maintaining privacy of
                        Bitcoin transaction details. This advanced cryptographic
                        technique ensures that arbiters' actions can be verified
                        without exposing sensitive information on the Elastos
                        Smart Chain.
                      </>
                    ),
                  },
                  {
                    question:
                      "What is the arbiter_signer application, and why is it separate?",
                    answer: (
                      <>
                        The{" "}
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                          arbiter_signer
                        </code>{" "}
                        is a separate Go application that arbiters must run. It
                        performs the actual Bitcoin transaction signing. It's
                        separate from this web portal for{" "}
                        <span className="font-medium">
                          security and operational reasons
                        </span>
                        . Arbiters need to keep their Bitcoin private keys
                        secure, and the{" "}
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                          arbiter_signer
                        </code>{" "}
                        is designed to run in a secure environment, separate
                        from the web interface.
                      </>
                    ),
                  },
                  {
                    question: "What happens if I lose my private keys?",
                    answer: (
                      <>
                        If you lose your private keys (both your EVM key for
                        managing the arbiter and your BTC key for signing), your
                        stake will be inaccessible, and you will not be able to
                        fulfill your arbitration duties.{" "}
                        <span className="font-bold">
                          It is critical to back up your private keys securely.
                        </span>{" "}
                        The protocol does <span className="font-bold">not</span>{" "}
                        provide a way to recover lost keys. This is a
                        fundamental aspect of how blockchains work.
                      </>
                    ),
                  },
                  {
                    question: "Is this system fully decentralized?",
                    answer: (
                      <>
                        The underlying smart contracts and arbiter selection are
                        decentralized. However, this portal (the website) is
                        currently centrally hosted. The long-term goal is for
                        the entire system, including the frontend, to be fully
                        decentralized. Also, note that DApp registration
                        currently requires{" "}
                        <span className="font-medium">
                          authorization by the protocol owner
                        </span>{" "}
                        (administrator). This is a centralizing factor that may
                        be removed in the future.
                      </>
                    ),
                  },
                  {
                    question: "Is this system ready for production use?",
                    answer: (
                      <>
                        The system is currently in{" "}
                        <span className="font-bold text-amber-700">BETA</span>.
                        It's undergoing active development and testing. While
                        the core functionality is in place, including ZKP
                        verification for secure dispute resolution, we recommend
                        careful consideration before using it with large sums of
                        money or in critical production environments until
                        further testing and auditing have been completed.
                      </>
                    ),
                  },
                ].map((item, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <h4 className="text-lg font-semibold text-primary-800 mb-2">
                      {item.question}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </PageContainer>
  );
};
export default HelpPage;
