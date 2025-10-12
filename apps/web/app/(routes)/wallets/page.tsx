"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useApp } from "../../../lib/store";
import { useDaemonWS } from "../../../lib/ws";
import { useEffect, useMemo, useState } from "react";

export default function Wallets() {
  const { publicKey } = useWallet();
  const { masterWallet, folders, walletsByFolder, setFolders, setFolderWallets } = useApp();
  const { send, onMessage } = useDaemonWS();
  const [folderId, setFolderId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [importSecret, setImportSecret] = useState("");
  const [fundAmount, setFundAmount] = useState("0.01");

  useEffect(() => {
    const off = onMessage((m) => {
      if (m.kind === "FOLDERS") setFolders(m.folders);
      if (m.kind === "WALLETS") setFolderWallets(m.folderId, m.wallets);
    });
    send({ kind: "FOLDER_LIST" });
    return off;
  }, [onMessage, send, setFolders, setFolderWallets]);

  function createFolder() {
    if (!folderId || !folderName) return;
    send({ kind: "FOLDER_CREATE", payload: { id: folderId, name: folderName } });
    setFolderId(""); setFolderName("");
  }
  function createWallet(fid: string) { send({ kind: "WALLET_CREATE", payload: { folderId: fid } }); }
  function importWallet(fid: string) { if (!importSecret) return; send({ kind: "WALLET_IMPORT", payload: { folderId: fid, secretBase58: importSecret } }); setImportSecret(""); }
  function fundFolder(fid: string) {
    if (!masterWallet) { alert("Authenticate master wallet first"); return; }
    const totalSol = parseFloat(fundAmount || "0");
    send({ kind: "FUND_WALLETS", payload: { folderId: fid, totalSol, masterPubkey: masterWallet } });
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Master Wallet</h2>
            <p style={{ fontSize: 12, color: "#a1a1aa" }}>Connected wallet funds folder wallets.</p>
          </div>
          <WalletMultiButton />
        </div>
        <div style={{ marginTop: 8, fontSize: 12 }}>Current: {masterWallet ?? "None"}</div>
      </div>

      <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Create Folder</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="id" value={folderId} onChange={(e)=>setFolderId(e.target.value)} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input placeholder="name" value={folderName} onChange={(e)=>setFolderName(e.target.value)} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <button style={{ padding: "8px 12px", borderRadius: 12, background: "#059669" }} onClick={createFolder}>Create</button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {folders.map((f)=>{
          const ws = walletsByFolder[f.id] || [];
          return (
            <div key={f.id} style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>{f.id} — {f.count} wallets</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ padding: "8px 12px", borderRadius: 12, background: "#3b82f6" }} onClick={()=>createWallet(f.id)}>Create Wallet</button>
                  <input placeholder="import secret b58" value={importSecret} onChange={(e)=>setImportSecret(e.target.value)} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
                  <button style={{ padding: "8px 12px", borderRadius: 12, background: "#7c3aed" }} onClick={()=>importWallet(f.id)}>Import</button>
                  <input placeholder="total SOL" value={fundAmount} onChange={(e)=>setFundAmount(e.target.value)} style={{ width: 90, padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
                  <button style={{ padding: "8px 12px", borderRadius: 12, background: "#059669" }} onClick={()=>fundFolder(f.id)}>Fund</button>
                </div>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                {ws.map(w => (
                  <div key={w.id} style={{ fontSize: 12, color: "#a1a1aa" }}>{w.pubkey} ({w.role})</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


