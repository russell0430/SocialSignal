// import {
//   Currency,
//   CurrencyAmount,
//   Percent,
//   Token,
//   TradeType,
// } from "@uniswap/sdk-core"
// import {
//   Pool,
//   Route,
//   SwapOptions,
//   SwapQuoter,
//   SwapRouter,
//   Trade,
// } from "@uniswap/v3-sdk"
// import { ethers } from "ethers"
// import JSBI from "jsbi"

// import { MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } from "./constants"
// import { getPoolInfo } from "../libs/pool"
// import { config } from "../libs/constants"
// import { fromReadableAmount } from "@/app/libs/conversion"
// import { TransactionState, getWalletAddress } from "../providers"
// export type TokenTrade = Trade<Token, Token, TradeType>

// function createBrowserExtensionProvider(): ethers.providers.Web3Provider | null {
//   try {
//     return new ethers.providers.Web3Provider(window?.ethereum, "any")
//   } catch (e) {
//     console.log("No Wallet Extension Found")
//     return null
//   }
// }
// const browserExtensionProvider = createBrowserExtensionProvider()
// // Trading Functions

// export async function createTrade(): Promise<TokenTrade> {
//   const poolInfo = await getPoolInfo()

//   const pool = new Pool(
//     config.tokens.in,
//     config.tokens.out,
//     config.tokens.poolFee,
//     poolInfo.sqrtPriceX96.toString(),
//     poolInfo.liquidity.toString(),
//     poolInfo.tick
//   )

//   const swapRoute = new Route([pool], config.tokens.in, config.tokens.out)

//   const amountOut = await getOutputQuote(swapRoute)

//   const uncheckedTrade = Trade.createUncheckedTrade({
//     route: swapRoute,
//     inputAmount: CurrencyAmount.fromRawAmount(
//       config.tokens.in,
//       fromReadableAmount(
//         config.tokens.amountIn,
//         config.tokens.in.decimals
//       ).toString()
//     ),
//     outputAmount: CurrencyAmount.fromRawAmount(
//       config.tokens.out,
//       JSBI.BigInt(amountOut)
//     ),
//     tradeType: TradeType.EXACT_INPUT,
//   })

//   return uncheckedTrade
// }

// export async function executeTrade(
//   trade: TokenTrade
// ): Promise<TransactionState> {
//   const walletAddress = getWalletAddress()
//   const provider = getProvider()

//   if (!walletAddress || !provider) {
//     throw new Error("Cannot execute a trade without a connected wallet")
//   }

//   // Give approval to the router to spend the token
//   const tokenApproval = await getTokenTransferApproval(config.tokens.in)

//   // Fail if transfer approvals do not go through
//   if (tokenApproval !== TransactionState.Sent) {
//     return TransactionState.Failed
//   }

//   const options: SwapOptions = {
//     slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
//     deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
//     recipient: walletAddress,
//   }

//   const methodParameters = SwapRouter.swapCallParameters([trade], options)

//   const tx = {
//     data: methodParameters.calldata,
//     value: methodParameters.value,
//     from: walletAddress,
//     maxFeePerGas: MAX_FEE_PER_GAS,
//     maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
//   }

//   const res = await sendTransaction(tx)

//   return res
// }

// // Helper Quoting and Pool Functions

// async function getOutputQuote(route: Route<Currency, Currency>) {
//   const provider = getProvider()

//   if (!provider) {
//     throw new Error("Provider required to get pool state")
//   }

//   const { calldata } = await SwapQuoter.quoteCallParameters(
//     route,
//     CurrencyAmount.fromRawAmount(
//       config.tokens.in,
//       fromReadableAmount(
//         config.tokens.amountIn,
//         config.tokens.in.decimals
//       ).toString()
//     ),
//     TradeType.EXACT_INPUT,
//     {
//       useQuoterV2: true,
//     }
//   )

//   const quoteCallReturnData = await provider.call({
//     to: QUOTER_CONTRACT_ADDRESS,
//     data: calldata,
//   })

//   return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData)
// }

// export async function getTokenTransferApproval(
//   token: Token
// ): Promise<TransactionState> {
//   const provider = getProvider()
//   const address = getWalletAddress()
//   if (!provider || !address) {
//     console.log("No Provider Found")
//     return TransactionState.Failed
//   }

//   try {
//     const tokenContract = new ethers.Contract(
//       token.address,
//       ERC20_ABI,
//       provider
//     )

//     const transaction = await tokenContract.populateTransaction.approve(
//       SWAP_ROUTER_ADDRESS,
//       fromReadableAmount(
//         TOKEN_AMOUNT_TO_APPROVE_FOR_TRANSFER,
//         token.decimals
//       ).toString()
//     )

//     return sendTransaction({
//       ...transaction,
//       from: address,
//     })
//   } catch (e) {
//     console.error(e)
//     return TransactionState.Failed
//   }
// }

// export async function sendTransaction(
//   transaction: ethers.providers.TransactionRequest
// ): Promise<TransactionState> {
//   return sendTransactionViaExtension(transaction)
// }
// // Transacting with a wallet extension via a Web3 Provider
// async function sendTransactionViaExtension(
//   transaction: ethers.providers.TransactionRequest
// ): Promise<TransactionState> {
//   try {
//     const receipt = await browserExtensionProvider?.send(
//       "eth_sendTransaction",
//       [transaction]
//     )
//     if (receipt) {
//       return TransactionState.Sent
//     } else {
//       return TransactionState.Failed
//     }
//   } catch (e) {
//     console.log(e)
//     return TransactionState.Rejected
//   }
// }

// export async function connectBrowserExtensionWallet() {
//   if (!window.ethereum) {
//     return null
//   }

//   const { ethereum } = window
//   const provider = new ethers.providers.Web3Provider(ethereum)
//   const accounts = await provider.send("eth_requestAccounts", [])

//   if (accounts.length !== 1) {
//     return
//   }

//   walletExtensionAddress = accounts[0]
//   return walletExtensionAddress
// }
