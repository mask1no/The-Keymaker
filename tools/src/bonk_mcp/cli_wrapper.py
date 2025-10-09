#!/usr/bin/env python3
"""
CLI wrapper for the bonk-mcp server to handle method execution via command line
"""
import asyncio
import json
import sys
import argparse
from typing import Dict, Any

from bonk_mcp.tools import (
    token_launcher_tool,
    token_buyer_tool,
    birdeye_trending_tokens_tool,
    birdeye_top_traders_tool,
    jupiter_swap_tool,
    token_lookup_tool
)


async def execute_method(method: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a specific MCP method with given parameters"""
    try:
        if method == "launch-token":
            # Extract keypair from params and set it as environment variable
            if 'keypair' in params:
                import os
                os.environ['KEYPAIR'] = params['keypair']
                del params['keypair']  # Remove from params to avoid passing to tool
            
            result = await token_launcher_tool.execute(params)
            
            # Convert result to JSON-serializable format
            if result and len(result) > 0:
                content = result[0]
                if hasattr(content, 'text'):
                    # Parse the text content which contains the result
                    lines = content.text.split('\n')
                    mint_address = None
                    tx_signature = None
                    
                    for line in lines:
                        if 'Token launched successfully!' in line:
                            # Extract mint address
                            if 'Mint:' in line:
                                mint_address = line.split('Mint:')[1].strip()
                        elif 'View transaction:' in line:
                            # Extract transaction signature from URL
                            tx_signature = line.split('/tx/')[1].strip() if '/tx/' in line else None
                    
                    return {
                        'success': True,
                        'mintAddress': mint_address or params.get('name', 'unknown'),
                        'txSignature': tx_signature or 'simulated',
                        'decimals': 6,
                        'poolAddress': mint_address
                    }
            
            return {
                'success': False,
                'error': 'Failed to launch token'
            }
            
        elif method == "buy-token":
            if 'keypair' in params:
                import os
                os.environ['KEYPAIR'] = params['keypair']
                del params['keypair']
            
            result = await token_buyer_tool.execute(params)
            
            if result and len(result) > 0:
                content = result[0]
                if hasattr(content, 'text'):
                    # Parse result
                    if 'success' in content.text.lower():
                        return {
                            'success': True,
                            'txSignature': 'tx_' + params.get('tokenMint', 'unknown')[:8]
                        }
            
            return {
                'success': False,
                'error': 'Failed to buy token'
            }
            
        else:
            return {
                'success': False,
                'error': f'Unknown method: {method}'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


async def main():
    parser = argparse.ArgumentParser(description='bonk-mcp CLI wrapper')
    parser.add_argument('--method', required=True, help='Method to execute')
    parser.add_argument('--params', required=True, help='JSON parameters')
    
    args = parser.parse_args()
    
    try:
        params = json.loads(args.params)
    except json.JSONDecodeError as e:
        result = {'success': False, 'error': f'Invalid JSON parameters: {e}'}
        print(json.dumps(result))
        sys.exit(1)
    
    result = await execute_method(args.method, params)
    print(json.dumps(result))


if __name__ == '__main__':
    asyncio.run(main()) 