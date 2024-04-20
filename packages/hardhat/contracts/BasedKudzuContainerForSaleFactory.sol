//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;


import "./BasedKudzuContainerForSale.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract BasedKudzuContainerForSaleFactory {
	address public benificiary = 0x00080706a7D99CBC163D52dcF435205B1aD940D1; //safe.buidlguidl.eth

	event Created(address indexed owner, address indexed contractAddress);

	function create(address _owner) public payable returns (address) {
		(bool success, ) = benificiary.call{value: msg.value}("");
		require(success, "create failed");
		address _contractAddress = address(new BasedKudzuContainerForSale(_owner));
		emit Created(_owner, _contractAddress);
		return _contractAddress;
	}
}
