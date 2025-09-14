import {
  Transaction,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  buildBundle,
  createTipInstruction,
  convertToVersionedTransactions,
} from '../../services/bundleService' // Adjust path as needed

jest.mock('../../constants', () => ({
    JITO_TIP_ACCOUNTS: ['11111111111111111111111111111111'],
}));

jest.mock('@/lib/priorityFee', () => ({
  createComputeBudgetInstructions: jest.fn(() => []),
}))

const mockTransfer = jest.fn((...args) => ({
  __isTransferInstruction: true,
  args,
}))

jest.mock('@solana/web3.js', () => {
  const actual = jest.requireActual('@solana/web3.js')
  return {
    ...actual,
    SystemProgram: {
      ...actual.SystemProgram,
      transfer: (...args) => {
        mockTransfer(...args)
        return new actual.TransactionInstruction({
          keys: [
            {
              pubkey: args[0].fromPubkey,
              isSigner: true,
              isWritable: true,
            },
            {
              pubkey: args[0].toPubkey,
              isSigner: false,
              isWritable: true,
            },
          ],
          programId: actual.SystemProgram.programId,
          data: Buffer.from(new Uint8Array([2, 0, 0, 0, 128, 150, 152, 0, 0, 0, 0, 0])), // Mock data for transfer
        })
      },
    },
    Transaction: jest.fn().mockImplementation((options) => {
      const tx = new actual.Transaction(options)
      tx.add = jest.fn()
      tx.compileMessage = jest.fn(() => ({
        accountKeys: [],
        instructions: [],
        recentBlockhash: '8gE2g3cf8xGDBsMVb2g42d9595fS2QW3LFfUR2H1i11C',
      }))
      tx.feePayer = options?.feePayer
      return tx
    }),
    TransactionMessage: actual.TransactionMessage,
    VersionedTransaction: actual.VersionedTransaction,
  }
})

describe('bundleService', () => {
  describe('buildBundle', () => {
    const createTx = (feePayer: string) => {
      const tx = new Transaction()
      tx.feePayer = new PublicKey(feePayer)
      return tx
    }

    it('should sort transactions by role priority: sniper > dev > normal', async () => {
      const normalWallet = '11111111111111111111111111111111'
      const sniperWallet = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      const devWallet = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'

      const txs = [createTx(normalWallet), createTx(sniperWallet), createTx(devWallet)];
      const walletRoles = [
        { publicKey: normalWallet, role: 'normal' },
        { publicKey: sniperWallet, role: 'sniper' },
        { publicKey: devWallet, role: 'dev' },
      ];

      const sortedTxs = await buildBundle(txs, walletRoles);

      expect(sortedTxs.map((tx) => tx.feePayer.toBase58())).toEqual([
        sniperWallet,
        devWallet,
        normalWallet,
      ]);
    });
  });

  describe('createTipInstruction', () => {
    beforeEach(() => {
      mockTransfer.mockClear()
    })

    it('should create a system transfer instruction', () => {
      const payer = new PublicKey('11111111111111111111111111111111')
      const tipAmount = 5000

      createTipInstruction(payer, tipAmount)

      expect(mockTransfer).toHaveBeenCalled()
      const transferArgs = mockTransfer.mock.calls[0][0]
      expect(transferArgs.fromPubkey).toEqual(payer)
      expect(transferArgs.lamports).toBe(tipAmount)
    })

    it('should use a default tip amount if none is provided', () => {
      const payer = new PublicKey('11111111111111111111111111111111')

      createTipInstruction(payer)

      const transferArgs = mockTransfer.mock.calls[0][0]
      expect(transferArgs.fromPubkey).toEqual(payer)
      expect(transferArgs.lamports).toBe(10000)
    })
  })

  describe('convertToVersionedTransactions', () => {
    let mockConnection: any;

    beforeEach(() => {
      mockConnection = {
        getLatestBlockhash: jest.fn().mockResolvedValue({
          blockhash: '8gE2g3cf8xGDBsMVb2g42d9595fS2QW3LFfUR2H1i11C', // Valid blockhash
          lastValidBlockHeight: 100,
        }),
      };
      mockTransfer.mockClear();
    });

    it('should convert legacy transactions to versioned transactions', async () => {
      const payer = new PublicKey('11111111111111111111111111111111');
      const tx1 = new Transaction({feePayer: payer});
      const tx2 = new Transaction({feePayer: payer});
      const txs = [tx1, tx2];
      
      const versionedTxs = await convertToVersionedTransactions(txs, mockConnection);

      expect(versionedTxs.length).toBe(2);
      expect(versionedTxs[0]).toBeInstanceOf(VersionedTransaction);
      expect(versionedTxs[1]).toBeInstanceOf(VersionedTransaction);
    });

    it('should add a tip instruction to the last transaction', async () => {
        const payer = new PublicKey('11111111111111111111111111111111');
        const tx1 = new Transaction({feePayer: payer});
        const txs = [tx1];
        const tipAmount = 12345;

        await convertToVersionedTransactions(
          txs,
          mockConnection,
          tipAmount,
          payer,
        );

        expect(mockTransfer).toHaveBeenCalledWith({
          fromPubkey: payer,
          toPubkey: new PublicKey('11111111111111111111111111111111'),
          lamports: tipAmount,
        });
    });
  });
});
