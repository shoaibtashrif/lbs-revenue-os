const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || "https://script.google.com/macros/s/AKfycbw-cb48qWW4ka33aS4JLcCnXMJJEP-K7MJi8nsWYQ1VYLd4utn5UvZC3EKCy952Y71czQ/exec"

async function testWebhook() {
  console.log('Testing Apps Script Webhook:', webhookUrl)

  const payloadObj = {
    orderId: 'test_order_' + Date.now(),
    orderNumber: 'LBS-2026-9999',
    placedAt: new Date().toISOString(),
    status: 'NEW',
    source: 'menu',
    buyerBusinessName: 'Live Test Dispensary',
    buyerLicenseNumber: 'C10-LIVE-TEST-999',
    buyerContactName: 'Ross Haley',
    buyerEmail: 'ross@lbsdist.com',
    buyerPhone: '(916) 555-0199',
    subtotal: '2040.00',
    notes: 'Testing live Google Apps Script Webhook append',
    lines: [
      {
        sku: 'AL-ZTTZ-3.5-002',
        batchNumber: 'AL-2024-ZTZ-D01',
        productName: 'Ztartz 3.5g — NEW DROP',
        brand: 'Alien Labs',
        caseCount: 2,
        unitPrice: '85.00',
        casePrice: '1020.00',
        lineTotal: '2040.00',
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `payload=${encodeURIComponent(JSON.stringify(payloadObj))}`,
      redirect: 'follow',
    })

    console.log('HTTP Status:', res.status)
    const text = await res.text()
    console.log('Response Body:', text)
  } catch (err) {
    console.error('Fetch error:', err)
  }
}

testWebhook()
