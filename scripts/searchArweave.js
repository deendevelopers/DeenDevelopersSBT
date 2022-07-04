const Arweave = require('arweave');


const arweave = new Arweave({
  host: "arweave.net",
  protocol: "https",
  port: 443,
  logging: false,
  timeout: 30000,
});
const main = async (ipfsCID) => {
  const results = await arweave.transactions.search('IPFS-Add', ipfsCID);
  console.log(results);
}

main('QmTMEhMZLC93my9by27oS1TG92LMmeiUzmYRjvNb8BEgTH');