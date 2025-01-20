pragma solidity ^0.8.2;

contract HelloWord {
    string public message;

    constructor(){
        message  = "Hello Word";
    }

    function getMessage() public view returns (string memory){
        return message;
    }
}
