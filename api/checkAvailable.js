import { RetellClient } from 'retell-sdk';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET allowed' });
  }
console.log("API key loaded:", !!process.env.RETELL_API_KEY);

  const client = new RetellClient({ apiKey: process.env.RETELL_API_KEY });

  try {
    const result = await client.phoneNumber.listPhoneNumbers();

    const traceNumber = result.phone_numbers.find(
      (num) => num.phone_number === '+1YOURNUMBERHERE' // replace with your actual Trace number
    );

    if (!traceNumber) {
      return res.status(404).json({ available: false, message: 'Trace number not found' });
    }

    res.status(200).json({
      available: true,
      number: traceNumber.phone_number,
      agentBound: !!traceNumber.outbound_agent_id,
      agentId: traceNumber.outbound_agent_id || null,
    });
  } catch (err) {
    res.status(400).json({
      available: false,
      error: err.response?.data || err.message,
    });
  }
}
