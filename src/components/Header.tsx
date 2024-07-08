"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import Button from "./Button";

const Header: React.FC = ({}) => {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="flex justify-between p-6 border-b-2 border-slate-300">
      <div className="flex items-center">
        <a href="/" className="underline text-lg">
          HyperLender
        </a>
        <a href="/myTrades" className="mx-4 underline text-lg">
          My Trades
        </a>
      </div>
      <div>
        {account.status === "connected" ? (
          <Button className="bg-red" onClick={() => disconnect()}>
            Disconnect
          </Button>
        ) : (
          <Button onClick={() => connect({ connector: connectors[3] })}>
            Connect
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
