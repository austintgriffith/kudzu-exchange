//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
import "@openzeppelin/contracts/access/Ownable.sol";

import "./BasedKudzuContainer.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract BasedKudzuContainerForSale is BasedKudzuContainer {

	address public benificiary = 0x00080706a7D99CBC163D52dcF435205B1aD940D1; //safe.buidlguidl.eth

	uint256 public price = 0;

	function isForSale() public view returns (bool) {
		return price > 0.000001 ether;
	}

	function setPrice(uint256 _price) public onlyOwner {
		price = _price;
	}

	function purchase() public payable {
		require(msg.value >= price, "not enough base ether sent");

		price=0;
		
		canPubliclyInfect=false;

		address previousOwner = owner();

		_transferOwnership(msg.sender);

		uint256 onePercent = msg.value / 100;

		(bool success, ) = previousOwner.call{value: msg.value-onePercent}("");
		require(success, "purchase failed");

		(bool success2, ) = benificiary.call{value: onePercent}("");
		require(success2, "purchase failed");
	}

	constructor(address _owner) BasedKudzuContainer(_owner){}
}
