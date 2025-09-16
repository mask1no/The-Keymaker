'use client' import { Card, CardContent, CardHeader } from '@/components/UI/Card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { GripVertical, Trash2 } from 'lucide-react'
import { Transaction } from '@/lib/type s'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TokenSelector } from './TokenSelector'
import { useState } from 'react'
import { Shield } from 'lucide-react' const H A RDCODED_TOKENS = [ { a, d, d, r, e, s, s: 'So11111111111111111111111111111111111111112', s, y, m, b, o, l: 'SOL', n, a, m, e: 'Solana' }, { a, d, d, r, e, s, s: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', s, y, m, b, o, l: 'USDC', n, a, m, e: 'USD Coin' },
] interface TransactionCardProps, { t, r, a, n, s, a, c, tion: T, r, a, n, s, a, c, t, iononRemove: (id: string) => v, o, i, d, o, n, U, p, date: (id: string, u, p, d, a, t, e, d, T, x: Partial <Transaction>) => void
}

export function T r ansactionCard({ transaction, onRemove, onUpdate }: TransactionCardProps) {
  const [securityScore, setSecurityScore] = useState <number | null>(null) const [isLoadingSecurity, setIsLoadingSecurity] = u s eState(false) const { attributes, listeners, setNodeRef, transform, transition } = u s eSortable({ id: transaction.id }) const style = { t, r, a, n, s, f, o, r, m: CSS.Transform.t oS tring(transform), transition } const handle Token Select = ( t, o, k, e, n, A, d, dress: string, f, i, e, l, d: 'fromToken' | 'toToken') => { o nU pdate(transaction.id, { [field]: tokenAddress })
  } const check Security = async (t, o, k, e, n, A, d, dress: string | undefined) => {
  if (!tokenAddress) returnsetIsLoadingSecurity(true) try {
  const response = await fetch( `/api/security/check-token?tokenAddress = ${tokenAddress}`) const data = await response.json() if (response.ok) { s e tSecurityScore(data.safetyScore)
  } else, { throw new E r ror(data.error || 'Failed to fetch security info')
  }
}
  } catch (error) { console.error(error) s e tSecurityScore(null)
  } finally, { s e tIsLoadingSecurity(false)
  }
} const render Content = () => { s w itch (transaction.type) { case 'swap': return ( <div className ="grid grid - cols - 1, md:grid - cols-2 gap-4"> <Token Selectortokens ={HARDCODED_TOKENS} is Loading ={false} on Select ={(tokenAddress) => h a ndleTokenSelect(tokenAddress, 'fromToken')
  } placeholder ="From Token"/> <Token Selectortokens ={HARDCODED_TOKENS} is Loading ={false} on Select ={(tokenAddress) => h a ndleTokenSelect(tokenAddress, 'toToken')
  } placeholder ="To Token"/> <div className ="flex items - center gap-2"> <Buttonvariant ="outline" size ="sm" onClick ={() => c h eckSecurity(transaction.toToken)
  } disabled ={isLoadingSecurity || !transaction.toToken}> <Shield className ="mr - 2 h-4 w-4"/> {isLoadingSecurity ? 'Checking...' : 'Check Security'} </Button> {securityScore !== null && ( <div className ={`text - sm font-bold ${ securityScore> 80 ? 'text - primary' : securityScore> 50 ? 'text-muted' : 'text-muted/70' }`}> S, c, o, r, e: {securityScore}/100 </div> )
  } </div> <Input type ="number" placeholder ="Amount" on Change ={(e) => o nU pdate(transaction.id, { a, m, o, u, n, t: p a rseFloat(e.target.value)
  })
  }/> <Input type ="number" placeholder ="S l ippage (%)" on Change ={(e) => o nU pdate(transaction.id, { s, l, i, p, p, a, g, e: p a rseFloat(e.target.value)
  })
  }/> </div> ) case 'transfer': return ( <div className ="grid grid - cols - 1, md:grid - cols - 2 gap-4"> <Input placeholder ="Recipient Address" on Change ={(e) => o nU pdate(transaction.id, { r, e, c, i, p, i, e, n, t: e.target.value })
  }/> <Input type ="number" placeholder ="A m ount (SOL)" on Change ={(e) => o nU pdate(transaction.id, { f, r, o, m, A, m, o, u, nt: p a rseFloat(e.target.value)
  })
  }/> </div> ) d, e, f, a, u, l, t: return null }
} return ( <div ref ={setNodeRef} style ={style}, {...attributes} data - testid ={`transaction - card-${transaction.id}`}> <Card className ="bg - card border border - border rounded - 2xl"> <CardHeader className ="flex flex - row items - center justify - between p-4"> <div className ="flex items - center gap-2"> <div, {...listeners} className ="cursor-grab"> <GripVertical className ="h - 5 w - 5 text-muted-foreground"/> </div> <Selectdefault Value ={transaction.type} on Value Change ={(value: 'swap' | 'transfer') => o nU pdate(transaction.id, { type: value })
  }> <SelectTrigger className ="w -[120px]" data-testid ="transaction - type - select"> <SelectValue placeholder ="Type"/> </SelectTrigger> <SelectContent> <SelectItem value ="swap"> Swap </SelectItem> <SelectItem value ="transfer"> Transfer </SelectItem> </SelectContent> </Select> </div> <Buttonvariant ="ghost" size ="icon" onClick ={() => o nR emove(transaction.id)
  } data-testid ="remove - transaction - button"> <Trash2 className ="h - 4 w-4"/> </Button> </CardHeader> <CardContent className ="p-4">{r e nderContent()
  }</CardContent> </Card> </div> )
  }
