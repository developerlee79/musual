// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MusualToken is ERC721URIStorage, Ownable {
    uint256 public nextId = 1;
    uint256 public supplyCap;

    constructor(string memory name_, string memory symbol_, uint256 cap_) 
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {
        supplyCap = cap_;
    }

    function mintWithURI(address to, string memory uri) external {
        if (supplyCap != 0) {
            require(nextId <= supplyCap, "Cap reached");
        }
        uint256 tokenId = nextId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
