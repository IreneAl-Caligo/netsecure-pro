
/**
 * Central configuration for all scanner APIs
 */

// Vulnerability Scanner API options
export const vulnerabilityScannerAPIs = [
  { name: "Acunetix", url: "https://api.acunetix.com/v1" },
  { name: "StackHawk", url: "https://api.stackhawk.com/v1" },
  { name: "OWASP ZAP", url: "https://api.zaproxy.org/v1" },
  { name: "Qualys", url: "https://api.qualys.com/v1" },
  { name: "Nessus", url: "https://api.tenable.com/v1" }
];

// Network Scanner API options
export const networkScannerAPIs = [
  { name: "Shodan", url: "https://api.shodan.io" },
  { name: "SecurityTrails", url: "https://api.securitytrails.com/v1" },
  { name: "Censys", url: "https://search.censys.io/api/v2" },
  { name: "NetworkScan Pro", url: "https://api.networkscanpro.example" }  
];

// Traffic Analyzer API options
export const trafficAnalyzerAPIs = [
  { name: "NetworkMiner", url: "https://api.networkminer.example" },
  { name: "Wireshark API", url: "https://api.wireshark.example" },
  { name: "Packet Analyzer", url: "https://api.packetanalyzer.example" },
  { name: "TCPDump API", url: "https://api.tcpdump.example" },
  { name: "Zeek", url: "https://api.zeek.example" }
];

// Port Scanner & IDS API options
export const portScannerAPIs = [
  { name: "Nmap API", url: "https://api.nmap.example" },
  { name: "OpenVAS", url: "https://api.openvas.example" },
  { name: "Qualys", url: "https://api.qualys.com/v1" },
  { name: "Snort IDS", url: "https://api.snort.example" },
  { name: "Suricata", url: "https://api.suricata.example" }
];
