import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getChainConfig } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

interface ChainSelectorProps {
  selectedChain: ChainId;
  onChainChange: (chainId: ChainId) => void;
  availableChains: ChainId[];
}

export default function ChainSelector({ selectedChain, onChainChange, availableChains }: ChainSelectorProps) {
  const handleChainSelect = (chainId: ChainId) => {
    if (chainId !== selectedChain) {
      onChainChange(chainId);
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-card rounded-lg border border-border">
      <div className="flex-1">
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Select Network
        </label>
        <div className="flex gap-2">
          {availableChains.map((chainId) => {
            const config = getChainConfig(chainId);
            const isSelected = chainId === selectedChain;

            return (
              <Tooltip key={chainId}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleChainSelect(chainId)}
                    variant={isSelected ? "default" : "outline"}
                    className={`flex-1 transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span className="font-medium">{config.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold">{config.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
