#!/usr/bin/env bun
/**
 * Seed script - örnek veriler oluşturur
 * Kullanım: bun run seed.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

const domains = [
  { name: 'Ana Website', domain: 'mysite.com' },
  { name: 'Admin Panel', domain: 'admin.mysite.com' },
  { name: 'API Backend', domain: 'api.mysite.com' },
];

const errorTypes = ['javascript', 'promise', 'network', 'resource', 'server'];
const severities = ['low', 'medium', 'high', 'critical'];
const sampleErrors = [
  { message: "Cannot read property 'map' of undefined", stack: "TypeError: Cannot read property 'map' of undefined\n    at ProductList (/src/components/ProductList.tsx:45:23)\n    at render (/node_modules/react-dom/cjs/react-dom.development.js:17091:16)" },
  { message: "Uncaught SyntaxError: Unexpected token '<'", stack: "SyntaxError: Unexpected token '<'\n    at JSON.parse (<anonymous>)\n    at fetchData (/src/api/client.ts:23:20)" },
  { message: "Failed to fetch", stack: "TypeError: Failed to fetch\n    at fetchUser (/src/services/userService.ts:67:12)\n    at async Dashboard.loadData (/src/pages/Dashboard.vue:134:5)" },
  { message: "ReferenceError: process is not defined", stack: "ReferenceError: process is not defined\n    at Object.<anonymous> (/src/utils/env.ts:3:1)" },
  { message: "Maximum call stack size exceeded", stack: "RangeError: Maximum call stack size exceeded\n    at recursiveFunc (/src/utils/helpers.ts:89:17)" },
];

async function createDomain(domain: { name: string; domain: string }) {
  const res = await fetch(`${API_URL}/api/domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(domain),
  });
  const data = await res.json();
  return data.data;
}

async function sendError(domainId: string, errorData: { message: string; stack?: string }, count = 1) {
  for (let i = 0; i < count; i++) {
    const type = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    await fetch(`${API_URL}/api/errors/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-domain-id': domainId,
      },
      body: JSON.stringify({
        ...errorData,
        type,
        severity,
        url: `https://example.com/page-${Math.floor(Math.random() * 10)}`,
        source: `/src/components/Component${Math.floor(Math.random() * 20)}.ts`,
        lineno: Math.floor(Math.random() * 200) + 1,
        colno: Math.floor(Math.random() * 80) + 1,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }),
    });
  }
}

async function main() {
  console.log('🌱 Seed verisi oluşturuluyor...');
  
  const createdDomains = [];
  for (const domain of domains) {
    try {
      const d = await createDomain(domain);
      createdDomains.push(d);
      console.log(`✅ Domain oluşturuldu: ${domain.name} (${d.uuid})`);
    } catch (e) {
      console.log(`⚠️  Domain zaten var: ${domain.name}`);
    }
  }

  for (const domain of createdDomains) {
    console.log(`\n📦 ${domain.name} için hatalar oluşturuluyor...`);
    for (const error of sampleErrors) {
      const count = Math.floor(Math.random() * 15) + 1;
      await sendError(domain.uuid, error, count);
      console.log(`  ✓ "${error.message.slice(0, 50)}..." - ${count} kez`);
    }
  }

  console.log('\n✨ Seed verisi başarıyla oluşturuldu!');
  console.log(`📊 Dashboard: http://localhost:3000`);
}

main().catch(console.error);
