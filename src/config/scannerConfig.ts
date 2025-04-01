
/**
 * Central configuration for all scanner APIs
 */

// Vulnerability Scanner API options
export const vulnerabilityScannerAPIs = [
  { name: "Acunetix", url: "https://api.acunetix.com/v1" },
  { name: "StackHawk", url: "https://api.stackhawk.com/v1" },
  { name: "OWASP ZAP", url: "https://api.zaproxy.org/v1" },
  { name: "Qualys", url: "https://api.qualys.com/v1" },
  { name: "Nessus", url: "https://api.tenable.com/v1" },
  { name: "Burp Suite", url: "https://api.burpsuite.com/v1" }
];

// Network Scanner API options
export const networkScannerAPIs = [
  { name: "Shodan", url: "https://api.shodan.io" },
  { name: "SecurityTrails", url: "https://api.securitytrails.com/v1" },
  { name: "Censys", url: "https://search.censys.io/api/v2" },
  { name: "NetworkScan Pro", url: "https://api.networkscanpro.com/v1" },
  { name: "Zmap", url: "https://api.zmap.io/v1" }
];

// Traffic Analyzer API options
export const trafficAnalyzerAPIs = [
  { name: "NetworkMiner", url: "https://api.networkminer.net/v1" },
  { name: "Wireshark API", url: "https://api.wireshark.org/v1" },
  { name: "Packet Analyzer", url: "https://api.packetanalyzer.net/v1" },
  { name: "TCPDump API", url: "https://api.tcpdump.org/v1" },
  { name: "Zeek", url: "https://api.zeek.org/v1" },
  { name: "Cloudshark", url: "https://api.cloudshark.org/v1" }
];

// Port Scanner & IDS API options
export const portScannerAPIs = [
  { name: "Nmap API", url: "https://api.nmap.org/v1" },
  { name: "OpenVAS", url: "https://api.openvas.org/v1" },
  { name: "Qualys", url: "https://api.qualys.com/v1" },
  { name: "Snort IDS", url: "https://api.snort.org/v1" },
  { name: "Suricata", url: "https://api.suricata.io/v1" },
  { name: "Rapid7 Nexpose", url: "https://api.rapid7.com/nexpose/v1" }
];
