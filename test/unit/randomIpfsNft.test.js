const { assert, expect } = require("chai")
const { getAccountPath } = require("ethers/lib/utils")
const { network, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip()
    : describe("RandomIpfsNft", function () {
          let deployer, randomIpfsNft, vrfCoordinatorV2Mock
          beforeEach(async function () {
              account = await ethers.getSigners()
              deployer = account[0]
              await deployments.fixture(["randomIpfs", "mocks"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft")
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock"
              )
          })

          describe("constructor", function () {
              it("set starting value corretly", async function () {
                  const dogTokenUri = await randomIpfsNft.getDogTokenUri(0)
                  assert(dogTokenUri.includes("ipfs://"))
              })
          })

          describe("request Nft", function () {
              it("fails if payment isn't sent with the request", async function () {
                  await expect(randomIpfsNft.requestNft({})).to.be.revertedWith(
                      "NeedMoreETHSent"
                  )
              })
              it("emits and event and kick off random word request", async function () {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(
                      randomIpfsNft.requestNft({ value: fee.toString() })
                  ).to.emit(randomIpfsNft, "NftRequested")
              })
          })

          describe("fulfillRandomWords", function () {
              it("mints NFT after random number returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async function () {
                          try {
                              const tokenURI = await randomIpfsNft.tokenURI(0)
                              const tokenCounter =
                                  await randomIpfsNft.getTokenCounter()
                              assert(tokenURI.includes("ipfs://"))
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const requestNftResponse =
                              await randomIpfsNft.requestNft({
                                  value: fee.toString(),
                              })
                          const requestNftReceipt =
                              await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
      })
