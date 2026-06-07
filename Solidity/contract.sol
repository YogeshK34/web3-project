// SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;
contract Solidity {
    string public name; 

    constructor() {
        name = "Yogesh";
    }

    function setName(string memory _name) public {
        name = _name;
    }
}