//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
import "@openzeppelin/contracts/access/Ownable.sol";

interface KUDZU {
    function approve(address to, uint256 tokenId) external;
    function balanceOf(address owner) external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract BasedKudzuContainer is Ownable {

	KUDZU public kudzuContract = KUDZU(0x94E84f2DBB9b068eA01DB531E7343ec2385B7052);

	function isInfected() public view returns (bool) {
		return kudzuContract.balanceOf(address(this)) > 0;
	}

	function infectedWithTokenId() public view returns (uint256) {
		if(!isInfected()) {
			return 0;
		}
		return kudzuContract.tokenOfOwnerByIndex(address(this),0);
	}

	function tokenURI() public view returns (string memory) {
		if(!isInfected()) {
			return "";
		}
		return kudzuContract.tokenURI(kudzuContract.tokenOfOwnerByIndex(address(this),0));
	}

	function infect(address toAddress) public onlyOwner {
		require(isInfected(), "not infected yet");
		kudzuContract.transferFrom(address(this),toAddress,kudzuContract.tokenOfOwnerByIndex(address(this),0));
	}

	bool public canPubliclyInfect = false;

	function setCanPubliclyInfect(bool _canPubliclyInfect) public onlyOwner {
		canPubliclyInfect = _canPubliclyInfect;
	}

	function publiclyInfect(address toAddress) public {
		require(isInfected(), "not infected yet");
		require(canPubliclyInfect, "public infection is disabled by owner for this container");
		kudzuContract.transferFrom(address(this),toAddress,kudzuContract.tokenOfOwnerByIndex(address(this),0));
	}

	constructor(address _owner) {
		transferOwnership(_owner);
	}

	function execute(address _to, uint256 _value, bytes memory _data) public payable onlyOwner {
		// Call the external contract
		(bool success, ) = _to.call{value: _value}(_data);
		require(success, "Failed to execute contract");
	}
		
	receive() external payable {}
}
