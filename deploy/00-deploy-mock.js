const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function (hre) {
    const { deployments, getNamedAccounts, ethers, network } = hre

    const BASE_FEE = ethers.utils.parseEther("0.25")
    const GAS_PER_LINK = 1e9

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PER_LINK]

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks Deployed!")
        log("--------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
