import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";
import type { ChainId } from "@shared/chainConfig";
import type { SignatureStatus } from "@/components/SignatureStatusIndicator";

interface UseMintingFlowOptions {
  walletAddress?: string;
  selectedChainId: ChainId;
  connectedChainId?: ChainId;
}

interface MintingState {
  signatureStatus: SignatureStatus;
  signature?: string;
  nonce?: number;
  expiryTime?: number;
  isLoading: boolean;
  error?: string;
}

export function useMintingFlow({
  walletAddress,
  selectedChainId,
  connectedChainId,
}: UseMintingFlowOptions) {
  const [state, setState] = useState<MintingState>({
    signatureStatus: "required",
    isLoading: false,
  });

  const getSignatureMutation = trpc.mint.getSignature.useMutation();
  const validateSignatureQuery = trpc.mint.validateSignature.useQuery(
    walletAddress && state.signature
      ? {
          walletAddress,
          quantity: 1,
          signature: state.signature,
          chainId: selectedChainId,
          expiryTime: state.expiryTime || 0,
        }
      : skipToken,
    {
      refetchInterval: 5000, // Revalidate every 5 seconds
    }
  );

  const recordMintMutation = trpc.mint.recordMintTransaction.useMutation();

  // Request signature for minting
  const requestSignature = useCallback(
    async (quantity: number = 1) => {
      if (!walletAddress) {
        setState((prev) => ({
          ...prev,
          error: "Wallet not connected",
          signatureStatus: "required",
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: undefined,
        signatureStatus: "loading",
      }));

      try {
        // Set expiry to 1 hour from now
        const expiryTime = Math.floor(Date.now() / 1000) + 3600;

        const result = await getSignatureMutation.mutateAsync({
          walletAddress,
          quantity,
          chainId: selectedChainId,
          expiryTime,
        });

        setState((prev) => ({
          ...prev,
          signature: result.signature,
          nonce: result.nonce,
          expiryTime: result.expiryTime,
          signatureStatus: "valid",
          isLoading: false,
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to request signature";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          signatureStatus: "invalid",
          isLoading: false,
        }));

        throw error;
      }
    },
    [walletAddress, selectedChainId, getSignatureMutation]
  );

  // Check if signature is still valid
  const isSignatureValid = useCallback(() => {
    if (!state.expiryTime) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime <= state.expiryTime;
  }, [state.expiryTime]);

  // Record mint after successful transaction
  const recordMint = useCallback(
    async (
      quantity: number,
      transactionHash: string,
      pricePerNft: string,
      totalAmount: string
    ) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        const result = await recordMintMutation.mutateAsync({
          walletAddress,
          quantity,
          chainId: selectedChainId,
          transactionHash,
          pricePerNft,
          totalAmount,
        });

        // Update nonce after successful mint
        setState((prev) => ({
          ...prev,
          nonce: result.newNonce,
        }));

        return result;
      } catch (error) {
        console.error("Failed to record mint:", error);
        throw error;
      }
    },
    [walletAddress, selectedChainId, recordMintMutation]
  );

  // Update signature status based on validation
  useEffect(() => {
    if (!validateSignatureQuery.data) return;

    if (validateSignatureQuery.data.valid) {
      setState((prev) => ({
        ...prev,
        signatureStatus: "valid",
      }));
    } else if (validateSignatureQuery.data.reason === "Signature expired") {
      setState((prev) => ({
        ...prev,
        signatureStatus: "expired",
      }));
    } else {
      setState((prev) => ({
        ...prev,
        signatureStatus: "invalid",
      }));
    }
  }, [validateSignatureQuery.data]);

  // Reset signature if chain changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      signature: undefined,
      nonce: undefined,
      expiryTime: undefined,
      signatureStatus: "required",
    }));
  }, [selectedChainId]);

  return {
    ...state,
    requestSignature,
    recordMint,
    isSignatureValid,
    isChainMismatch: !!connectedChainId && connectedChainId !== selectedChainId,
  };
}
