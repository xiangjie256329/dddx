async function main() {
    const Multicall = await ethers.getContractFactory("Multicall");
    const multicall = await Multicall.deploy();
    console.log("multicall address:",multicall.address)
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  