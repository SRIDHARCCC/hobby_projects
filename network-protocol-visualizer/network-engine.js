/**
 * NetLab: Network Architecture & Protocol Engine
 * Pure algorithmic simulation engine for TCP/IP handshakes, packet flows,
 * HTTP protocol serialization, latency benchmarking, and scale modeling.
 */

class NetworkEngine {
  constructor() {
    this.statusCodes = {
      200: { name: 'OK', category: '2xx Success', desc: 'Standard successful HTTP request. Server successfully parsed request and returned response.' },
      201: { name: 'Created', category: '2xx Success', desc: 'Resource successfully created on server (commonly returned from POST/PUT).' },
      204: { name: 'No Content', category: '2xx Success', desc: 'Action performed successfully; server sends no response body.' },
      301: { name: 'Moved Permanently', category: '3xx Redirection', desc: 'The requested resource has been assigned a new permanent URI.' },
      304: { name: 'Not Modified', category: '3xx Redirection', desc: 'Client cache is still fresh based on ETag / If-None-Match headers.' },
      400: { name: 'Bad Request', category: '4xx Client Error', desc: 'Malformed request syntax, invalid parameters, or payload parsing error.' },
      401: { name: 'Unauthorized', category: '4xx Client Error', desc: 'Authentication required. Missing, expired, or invalid credentials.' },
      403: { name: 'Forbidden', category: '4xx Client Error', desc: 'Client is authenticated, but lacks permissions to access this resource.' },
      404: { name: 'Not Found', category: '4xx Client Error', desc: 'The server cannot find the requested URL path or endpoint.' },
      429: { name: 'Too Many Requests', category: '4xx Client Error', desc: 'Rate limit or connection threshold exceeded. Request throttled.' },
      500: { name: 'Internal Server Error', category: '5xx Server Error', desc: 'Unhandled exception or crash in application/server business logic.' },
      502: { name: 'Bad Gateway', category: '5xx Server Error', desc: 'Reverse proxy / tunnel received invalid upstream response or unreachable host.' },
      503: { name: 'Service Unavailable', category: '5xx Server Error', desc: 'Server is temporarily overloaded, queue full, or under maintenance.' },
      504: { name: 'Gateway Timeout', category: '5xx Server Error', desc: 'Upstream server took too long to produce a response.' }
    };

    this.layers = [
      { id: 4, name: 'Application Layer', protocols: 'HTTP/1.1, HTTP/2, HTTP/3 (QUIC), DNS, TLS 1.3', unit: 'Message / Data Payload' },
      { id: 3, name: 'Transport Layer', protocols: 'TCP (Reliable, Ordered, 3-Way Handshake), UDP', unit: 'Segment / Datagram' },
      { id: 2, name: 'Internet Layer', protocols: 'IPv4, IPv6, ICMP, BGP Routing', unit: 'IP Packet' },
      { id: 1, name: 'Link / Physical Layer', protocols: 'Ethernet (802.3), Wi-Fi (802.11ax), 4G/5G NR Radio', unit: 'Frame / Bits' }
    ];

    this.hops = [
      { id: 'client', step: 1, title: 'Mobile Client (Browser)', icon: '📱', layer: 'Application & OS Socket', desc: 'Initiates DNS lookup, manages HTTP cookie jar, creates TCP connection.' },
      { id: 'carrier', step: 2, title: 'Carrier Gateway & RAN', icon: '🗼', layer: 'Physical / Data Link (4G/5G)', desc: 'Converts packets into radio frames, NATs private cellular IP to public carrier IP.' },
      { id: 'internet', step: 3, title: 'Public Internet & BGP Backbone', icon: '🌐', layer: 'Internet Layer (IP / BGP)', desc: 'Autonomous Systems route packets across optical fiber backbones and DNS root servers.' },
      { id: 'proxy', step: 4, title: 'Reverse Proxy & TLS Edge', icon: '🛡️', layer: 'Transport / Edge Application', desc: 'Terminates TLS 1.3 encryption, validates SNI hostname, injects X-Forwarded headers.' },
      { id: 'tunnel', step: 5, title: 'Multiplexed Reverse SSH Stream', icon: '🔄', layer: 'Transport Layer Pipe', desc: 'Carries data through outbound persistent TCP connection bypassing NAT firewalls.' },
      { id: 'server', step: 6, title: 'Host OS & Loopback Socket', icon: '💻', layer: 'Kernel Network Stack', desc: 'Delivers raw TCP segments to 127.0.0.1:8080/3000 buffer.' },
      { id: 'app', step: 7, title: 'Application Process & Event Loop', icon: '⚙️', layer: 'Application Runtime', desc: 'HTTP parser deserializes request, matches route, serializes JSON response.' }
    ];
  }

  /**
   * Simulates the 3-Way TCP Handshake
   */
  simulateTcpHandshake(seqClient = 1000, seqServer = 5000) {
    return [
      {
        step: 1,
        sender: 'Client',
        receiver: 'Server',
        flag: 'SYN',
        seq: seqClient,
        ack: 0,
        explanation: `Client sends SYN to initiate synchronization (Seq=${seqClient}). State: SYN_SENT.`
      },
      {
        step: 2,
        sender: 'Server',
        receiver: 'Client',
        flag: 'SYN-ACK',
        seq: seqServer,
        ack: seqClient + 1,
        explanation: `Server acknowledges client and sends its own SYN (Seq=${seqServer}, Ack=${seqClient + 1}). State: SYN_RCVD.`
      },
      {
        step: 3,
        sender: 'Client',
        receiver: 'Server',
        flag: 'ACK',
        seq: seqClient + 1,
        ack: seqServer + 1,
        explanation: `Client acknowledges server's SYN (Seq=${seqClient + 1}, Ack=${seqServer + 1}). State: ESTABLISHED. Channel ready for HTTP data!`
      }
    ];
  }

  /**
   * Constructs simulated raw HTTP Request header text
   */
  formatRawHttpRequest(method, path, headers = {}) {
    const lines = [`${method.toUpperCase()} ${path} HTTP/1.1`];
    for (const [k, v] of Object.entries(headers)) {
      lines.push(`${k}: ${v}`);
    }
    return lines.join('\r\n') + '\r\n\r\n';
  }

  /**
   * Constructs simulated raw HTTP Response header text
   */
  formatRawHttpResponse(statusCode, headers = {}, body = '') {
    const status = this.statusCodes[statusCode] || { name: 'Status' };
    const lines = [`HTTP/1.1 ${statusCode} ${status.name}`];
    const defaultHeaders = {
      'Date': new Date().toUTCString(),
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': (typeof Buffer !== 'undefined') ? Buffer.byteLength(body, 'utf8') : (new TextEncoder().encode(body)).length,
      'Connection': 'keep-alive',
      ...headers
    };

    for (const [k, v] of Object.entries(defaultHeaders)) {
      lines.push(`${k}: ${v}`);
    }
    return lines.join('\r\n') + '\r\n\r\n' + body;
  }

  /**
   * Scalability & Bottleneck Simulation Model
   * Simulates what happens to a single-host tunnel vs a production CDN/LB setup
   * as concurrent users scale from 1 to 50,000.
   */
  simulateScalability(concurrentUsers) {
    const users = Math.max(1, parseInt(concurrentUsers, 10) || 1);

    // Single-host reverse tunnel scenario:
    const tunnelLimit = 50; // typical free tunnel connection limit
    const tunnelBlocked = users > tunnelLimit;
    const tunnelDroppedRatio = tunnelBlocked ? Math.min(0.98, (users - tunnelLimit) / users) : 0;
    const tunnelSuccessCount = Math.round(users * (1 - tunnelDroppedRatio));
    const tunnelFailedCount = users - tunnelSuccessCount;
    // Latency degradation due to TCP head-of-line blocking and single CPU loop
    const baseLatency = 45; // ms
    const tunnelLatency = tunnelBlocked
      ? Math.min(8500, Math.round(baseLatency * (1 + Math.pow(users / 40, 1.35))))
      : Math.round(baseLatency + (users * 0.4));
    
    // Production Cloud Architecture (CDN + Multi-AZ Load Balancer + Auto-Scaling):
    const cdnCacheHitRatio = 0.94; // 94% of static assets served from edge
    const cdnLatency = Math.round(15 + Math.random() * 8); // edge response ~15-23ms
    const originUsers = Math.ceil(users * (1 - cdnCacheHitRatio));
    const requiredInstances = Math.max(1, Math.ceil(originUsers / 250)); // each container handles 250 req/s comfortably
    const prodDroppedRatio = users > 100000 ? 0.01 : 0.0;
    const prodLatency = Math.round(baseLatency + (originUsers / requiredInstances) * 0.05);

    return {
      concurrentUsers: users,
      singleHost: {
        successUsers: tunnelSuccessCount,
        failedUsers: tunnelFailedCount,
        droppedPercent: Math.round(tunnelDroppedRatio * 100),
        avgLatencyMs: tunnelLatency,
        primaryError: tunnelBlocked ? '502 Bad Gateway / 429 Too Many Requests' : 'None',
        bottleneck: users > 1000 ? 'Severe TCP Head-of-Line Blocking & Socket Descriptor Exhaustion'
          : users > 50 ? 'Tunnel Edge Socket Cap Exceeded' : 'None'
      },
      productionCloud: {
        successUsers: Math.round(users * (1 - prodDroppedRatio)),
        failedUsers: Math.round(users * prodDroppedRatio),
        edgeOffloadedPercent: Math.round(cdnCacheHitRatio * 100),
        edgeLatencyMs: cdnLatency,
        originLatencyMs: prodLatency,
        autoScaledInstances: requiredInstances,
        bottleneck: 'None (Elastic Auto-scaling active)'
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NetworkEngine };
} else {
  window.NetworkEngine = NetworkEngine;
}
