const { execSync } = require('child_process');

const instances = [
  't3.micro', 't3.small', 't3.medium', 't3.large', 't3.xlarge',
  't4g.micro', 't4g.small', 't4g.medium', 't4g.large', 't4g.xlarge',
  'r6g.medium', 'r6g.large', 'r7g.medium', 'r7g.large',
];

const GBP = 0.79;
const results = [];

for (const inst of instances) {
  try {
    const cmd = `aws pricing get-products --service-code AmazonEC2 --region us-east-1 --filters "Type=TERM_MATCH,Field=location,Value=EU (London)" "Type=TERM_MATCH,Field=tenancy,Value=Shared" "Type=TERM_MATCH,Field=operatingSystem,Value=Linux" "Type=TERM_MATCH,Field=preInstalledSw,Value=NA" "Type=TERM_MATCH,Field=capacitystatus,Value=Used" "Type=TERM_MATCH,Field=instanceType,Value=${inst}" --max-results 1 --query "PriceList[0]" --output text`;
    const raw = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });
    const j = JSON.parse(raw);
    const attr = j.product.attributes;
    const terms = j.terms.OnDemand;
    const k = Object.keys(terms)[0];
    const dims = terms[k].priceDimensions;
    const dk = Object.keys(dims)[0];
    const usdHr = parseFloat(dims[dk].pricePerUnit.USD);
    const usdMo = usdHr * 730;
    const gbpMo = usdMo * GBP;
    results.push({
      type: attr.instanceType,
      vcpu: attr.vcpu,
      ram: attr.memory,
      arch: attr.processorArchitecture,
      usdHr: usdHr.toFixed(4),
      gbpMo: gbpMo.toFixed(2),
    });
  } catch (e) {
    console.error(`Error for ${inst}: ${e.message.substring(0, 100)}`);
  }
}

console.log('\nInstance Type     | vCPU | RAM      | Arch   | $/hr    | £/month');
console.log('-----------------|------|----------|--------|---------|--------');
for (const r of results) {
  console.log(`${r.type.padEnd(17)}| ${r.vcpu.padEnd(5)}| ${r.ram.padEnd(9)}| ${r.arch.padEnd(7)}| $${r.usdHr.padEnd(7)} | £${r.gbpMo}`);
}
