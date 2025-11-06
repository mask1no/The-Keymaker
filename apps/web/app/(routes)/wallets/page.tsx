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
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");
  const [deletePlan, setDeletePlan] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const off = onMessage((m) => {
      if (m.kind === "FOLDERS") setFolders(m.folders);
      if (m.kind === "WALLETS") setFolderWallets(m.folderId, m.wallets);
      if (m.kind === "FUND_RESULT") alert(`Funded folder ${m.folderId}: ${m.signatures.length} txs`);
      if (m.kind === "FOLDER_DELETE_PLAN") setDeletePlan(m);
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
  function renameFolderSubmit() {
    if (!renameId || !renameName) return;
    send({ kind: "FOLDER_RENAME", payload: { id: renameId, name: renameName } });
    setRenameId(""); setRenameName("");
  }
  function previewDelete(fid: string) {
    setDeleteId(fid);
    send({ kind: "FOLDER_DELETE_PREVIEW", payload: { id: fid } });
  }
  function executeDelete(fid: string) {
    if (!masterWallet) { alert("Authenticate master wallet first"); return; }
    send({ kind: "FOLDER_DELETE", payload: { id: fid, masterPubkey: masterWallet } });
    setDeletePlan(null); setDeleteId(null);
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

      <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Rename Folder</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="id" value={renameId} onChange={(e)=>setRenameId(e.target.value)} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <input placeholder="new name" value={renameName} onChange={(e)=>setRenameName(e.target.value)} style={{ padding: "8px 12px", borderRadius: 12, background: "#27272a", border: "1px solid #3f3f46" }} />
          <button style={{ padding: "8px 12px", borderRadius: 12, background: "#3b82f6" }} onClick={renameFolderSubmit}>Rename</button>
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
                  <button style={{ padding: "8px 12px", borderRadius: 12, background: "#ef4444" }} onClick={()=>previewDelete(f.id)}>Delete</button>
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

      {deletePlan && deleteId && (
        <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Delete Folder Preview</div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>Fees ~ {deletePlan.estFeesLamports} lamports</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "8px 12px", borderRadius: 12, background: "#ef4444" }} onClick={()=>executeDelete(deleteId)}>Confirm Delete</button>
              <button style={{ padding: "8px 12px", borderRadius: 12, background: "#374151" }} onClick={()=>{ setDeletePlan(null); setDeleteId(null); }}>Cancel</button>
            </div>
          </div>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {deletePlan.wallets.map((w:any) => (
              <div key={w.pubkey} style={{ fontSize: 12, color: "#a1a1aa" }}>
                {w.pubkey} — SOL: {w.solLamports} lamports — Tokens: {w.tokens.length}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


