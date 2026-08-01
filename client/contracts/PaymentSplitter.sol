// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentSplitter {
    uint256 private _totalShares;
    address[] private _payees;
    mapping(address => uint256) private _shares;

    constructor(address[] memory payees, uint256[] memory shares_) {
        require(payees.length == shares_.length, "PaymentSplitter: payees and shares length mismatch");
        require(payees.length > 0, "PaymentSplitter: no payees");

        for (uint256 i = 0; i < payees.length; i++) {
            require(payees[i] != address(0), "PaymentSplitter: payee is the zero address");
            require(shares_[i] > 0, "PaymentSplitter: shares are 0");
            require(_shares[payees[i]] == 0, "PaymentSplitter: payee already has shares");

            _payees.push(payees[i]);
            _shares[payees[i]] = shares_[i];
            _totalShares += shares_[i];
        }
    }
}
